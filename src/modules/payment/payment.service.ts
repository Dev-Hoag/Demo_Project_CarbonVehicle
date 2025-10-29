import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Payment, PaymentStatus, PaymentGateway } from '../../shared/entities/payment.entity';
import { PaymentCallback, CallbackType } from '../../shared/entities/payment-callback.entity';
import { PaymentEvent } from '../../shared/entities/payment-event.entity';
import { OutboxEvent } from '../../shared/entities/outbox-event.entity';
import { CreatePaymentDto, PaymentResponseDto, PaymentStatusDto } from '../../shared/dtos/payment.dto';
import { PaymentProviderFactory } from '../../providers/payment-provider.factory';
import { PaymentCodeUtil } from '../../shared/utils/payment-code.util';
import { CryptoUtil } from '../../shared/utils/crypto.util';
import {
  PaymentNotFoundException,
  DuplicatePaymentException,
  PaymentExpiredException,
} from '../../shared/exceptions/payment.exception';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentCallback)
    private callbackRepository: Repository<PaymentCallback>,
    @InjectRepository(PaymentEvent)
    private eventRepository: Repository<PaymentEvent>,
    @InjectRepository(OutboxEvent)
    private outboxRepository: Repository<OutboxEvent>,
    private paymentProviderFactory: PaymentProviderFactory,
  ) {}

  /**
   * Create payment with idempotency check
   */
  async createPayment(
    dto: CreatePaymentDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<PaymentResponseDto> {
    // Generate idempotency key
    const idempotencyKey = PaymentCodeUtil.generateIdempotencyKey(
      dto.userId,
      dto.transactionId,
      dto.amount,
    );

    // Check for duplicate payment
    const existingPayment = await this.paymentRepository.findOne({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      this.logger.warn(
        `Duplicate payment detected: ${existingPayment.paymentCode}`,
      );

      // If existing payment is still valid, return it
      if (
        existingPayment.status === PaymentStatus.PENDING &&
        new Date() < existingPayment.expiredAt
      ) {
        return this.mapToResponseDto(existingPayment);
      }

      throw new DuplicatePaymentException(idempotencyKey);
    }

    // Generate payment code
    const paymentCode = PaymentCodeUtil.generate('PAY');
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 15 * 60 * 1000); // +15 minutes

    // Create payment record
    const payment = this.paymentRepository.create({
      paymentCode,
      transactionId: dto.transactionId,
      userId: dto.userId,
      gateway: dto.gateway,
      amount: dto.amount,
      currency: 'VND',
      status: PaymentStatus.PENDING,
      orderInfo: dto.orderInfo || 'Thanh toán tín chỉ carbon',
      bankCode: dto.bankCode,
      returnUrl: dto.returnUrl,
      idempotencyKey,
      ipAddress,
      userAgent,
      initiatedAt: now,
      expiredAt,
    });

    await this.paymentRepository.save(payment);

    this.logger.log(`Payment created: ${paymentCode}`);

    // Log event
    await this.logEvent(payment, 'INITIATED', PaymentStatus.PENDING, {
      source: 'USER',
    });

    // Get payment provider
    const provider = this.paymentProviderFactory.getProvider(dto.gateway);

    // Create payment URL
    const response = await provider.createPayment({
      paymentCode,
      amount: dto.amount,
      orderInfo: payment.orderInfo,
      ipAddress,
      bankCode: dto.bankCode,
      returnUrl: dto.returnUrl,
    });

    if (!response.success) {
      // Update payment to failed
      payment.status = PaymentStatus.FAILED;
      payment.gatewayResponseMsg = response.error;
      await this.paymentRepository.save(payment);

      await this.logEvent(payment, 'FAILED', PaymentStatus.FAILED, {
        error: response.error,
      });

      throw new BadRequestException(`Failed to create payment: ${response.error}`);
    }

    // Update payment URL
    payment.paymentUrl = response.paymentUrl;
    await this.paymentRepository.save(payment);

    // Publish event to outbox
    await this.publishEvent('PaymentInitiated', payment, {
      paymentCode: payment.paymentCode,
      transactionId: payment.transactionId,
      userId: payment.userId,
      amount: payment.amount,
      gateway: payment.gateway,
    });

    return this.mapToResponseDto(payment);
  }

  /**
   * Handle payment callback from gateway
   */
  async handleCallback(
    gateway: PaymentGateway,
    callbackData: any,
    callbackType: CallbackType = CallbackType.IPN,
    rawQuery?: string,
  ): Promise<PaymentStatusDto> {
    this.logger.log(`Handling ${callbackType} callback for gateway: ${gateway}`);

    // Get provider and verify callback
    const provider = this.paymentProviderFactory.getProvider(gateway);
    const verification = provider.verifyCallback(callbackData);

    // Find payment
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode: verification.paymentCode },
    });

    if (!payment) {
      this.logger.error(`Payment not found: ${verification.paymentCode}`);
      throw new PaymentNotFoundException(verification.paymentCode);
    }

    // Save callback record
    const callback = this.callbackRepository.create({
      paymentId: payment.id,
      paymentCode: payment.paymentCode,
      callbackType,
      payload: callbackData,
      rawQuery,
      signature: callbackData.vnp_SecureHash || callbackData.signature,
      isValid: verification.isValid,
      validationError: verification.isValid ? null : 'Invalid signature',
    });

    await this.callbackRepository.save(callback);

    // If signature is invalid, don't process
    if (!verification.isValid) {
      this.logger.warn(`Invalid callback signature: ${payment.paymentCode}`);
      callback.processingError = 'Invalid signature';
      await this.callbackRepository.save(callback);
      throw new BadRequestException('Invalid signature');
    }

    // Check if already processed
    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
      this.logger.warn(
        `Payment already processed: ${payment.paymentCode} - Status: ${payment.status}`,
      );
      callback.isProcessed = true;
      callback.processedAt = new Date();
      await this.callbackRepository.save(callback);
      return this.mapToStatusDto(payment);
    }

    try {
      // Update payment based on response code
      const oldStatus = payment.status;
      payment.gatewayTransactionId = verification.transactionNo;
      payment.gatewayResponseCode = verification.responseCode;

      if (gateway === PaymentGateway.VNPAY) {
        const vnpayProvider = provider as any;
        payment.gatewayResponseMsg = vnpayProvider.getResponseMessage(
          verification.responseCode,
        );

        if (vnpayProvider.isSuccessResponse(verification.responseCode)) {
          payment.status = PaymentStatus.COMPLETED;
          payment.completedAt = new Date();
        } else {
          payment.status = PaymentStatus.FAILED;
        }
      } else if (verification.responseCode === '00') {
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();
      } else {
        payment.status = PaymentStatus.FAILED;
      }

      await this.paymentRepository.save(payment);

      // Log event
      await this.logEvent(payment, 'CALLBACK_RECEIVED', payment.status, {
        from: oldStatus,
        responseCode: verification.responseCode,
        transactionNo: verification.transactionNo,
      });

      // Mark callback as processed
      callback.isProcessed = true;
      callback.processedAt = new Date();
      await this.callbackRepository.save(callback);

      // Publish event based on status
      if (payment.status === PaymentStatus.COMPLETED) {
        await this.publishEvent('PaymentCompleted', payment, {
          paymentCode: payment.paymentCode,
          transactionId: payment.transactionId,
          userId: payment.userId,
          amount: payment.amount,
          gatewayTransactionId: payment.gatewayTransactionId,
        });

        this.logger.log(`Payment completed: ${payment.paymentCode}`);
      } else if (payment.status === PaymentStatus.FAILED) {
        await this.publishEvent('PaymentFailed', payment, {
          paymentCode: payment.paymentCode,
          transactionId: payment.transactionId,
          userId: payment.userId,
          responseCode: payment.gatewayResponseCode,
          responseMsg: payment.gatewayResponseMsg,
        });

        this.logger.log(`Payment failed: ${payment.paymentCode}`);
      }

      return this.mapToStatusDto(payment);
    } catch (error) {
      this.logger.error(`Error processing callback: ${error.message}`);
      callback.processingError = error.message;
      await this.callbackRepository.save(callback);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentCode: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode },
    });

    if (!payment) {
      throw new PaymentNotFoundException(paymentCode);
    }

    return this.mapToStatusDto(payment);
  }

  /**
   * Get payment by transaction ID (for Transaction Service)
   */
  async getByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { transactionId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cron job: Expire pending payments
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingPayments() {
    const now = new Date();

    const expiredPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PENDING,
        expiredAt: LessThan(now),
      },
    });

    if (expiredPayments.length === 0) {
      return;
    }

    this.logger.log(`Expiring ${expiredPayments.length} pending payments`);

    for (const payment of expiredPayments) {
      payment.status = PaymentStatus.EXPIRED;
      await this.paymentRepository.save(payment);

      await this.logEvent(payment, 'EXPIRED', PaymentStatus.EXPIRED, {
        expiredAt: payment.expiredAt,
      });

      await this.publishEvent('PaymentExpired', payment, {
        paymentCode: payment.paymentCode,
        transactionId: payment.transactionId,
      });
    }
  }

  /**
   * Log payment event
   */
  private async logEvent(
    payment: Payment,
    eventType: string,
    toStatus: PaymentStatus,
    details?: any,
  ) {
    const event = this.eventRepository.create({
      paymentId: payment.id,
      paymentCode: payment.paymentCode,
      eventType,
      eventSource: details?.source || 'SYSTEM',
      fromStatus: payment.status,
      toStatus,
      details,
    });

    await this.eventRepository.save(event);
  }

  /**
   * Publish event to outbox
   */
  private async publishEvent(
    eventType: string,
    payment: Payment,
    payload: any,
  ) {
    const outboxEvent = this.outboxRepository.create({
      eventId: CryptoUtil.uuid(),
      aggregateType: 'Payment',
      aggregateId: payment.paymentCode,
      eventType,
      payload,
      routingKey: `payment.${eventType.toLowerCase()}`,
      exchange: 'carbon-credit-events',
    });

    await this.outboxRepository.save(outboxEvent);
    this.logger.log(`Event published to outbox: ${eventType}`);
  }

  /**
   * Map to response DTO
   */
  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      paymentCode: payment.paymentCode,
      paymentUrl: payment.paymentUrl,
      status: payment.status,
      amount: Number(payment.amount),
      transactionId: payment.transactionId,
      expiredAt: payment.expiredAt,
    };
  }

  /**
   * Map to status DTO
   */
  private mapToStatusDto(payment: Payment): PaymentStatusDto {
    return {
      paymentCode: payment.paymentCode,
      status: payment.status,
      amount: Number(payment.amount),
      transactionId: payment.transactionId,
      gatewayResponseCode: payment.gatewayResponseCode,
      gatewayResponseMsg: payment.gatewayResponseMsg,
      completedAt: payment.completedAt,
    };
  }
}