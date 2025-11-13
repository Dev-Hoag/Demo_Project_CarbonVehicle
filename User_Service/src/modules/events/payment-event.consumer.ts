// src/modules/events/payment-event.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Consumer lắng nghe payment events từ RabbitMQ
 * Hiện tại Payment Service publish message dạng phẳng:
 * {
 *   paymentCode: string;
 *   amount: number;
 *   userId?: string;
 *   timestamp?: string;
 * }
 * (không có id, aggregateId, payload, metadata). Vì vậy mapping được điều chỉnh lại cho đúng.
 */
interface PaymentCompletedMessage {
  paymentCode: string;
  amount: number;
  userId?: string;
  timestamp?: string;
}

interface PaymentFailedMessage {
  paymentCode: string;
  reason?: string;
  userId?: string;
  timestamp?: string;
}
@Injectable()
export class PaymentEventConsumer {
  private readonly logger = new Logger(PaymentEventConsumer.name);
  private readonly processedEvents = new Set<string>(); // Simple in-memory cache

  constructor(
    // TODO: Inject repository nếu cần lưu vào DB
    // @InjectRepository(TransactionHistory)
    // private transactionHistoryRepo: Repository<TransactionHistory>,
  ) {}

  /**
   * Listen for payment.completed events
   * Routing key: payment.completed
   */
  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'payment.completed',
    queue: 'user.payment-completed',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'ccm.events.dlx',
      deadLetterRoutingKey: 'payment.completed.dead',
    },
  })
  async handlePaymentCompleted(msg: PaymentCompletedMessage) {
    try {
      if (!msg || !msg.paymentCode) {
        this.logger.error('Received malformed payment.completed message (missing paymentCode)');
        return; // không throw để tránh retry vô nghĩa
      }

      const eventKey = msg.paymentCode; // dùng paymentCode làm idempotency key
      this.logger.log(`Received payment.completed message: ${eventKey}`);
      this.logger.log(`Message data: ${JSON.stringify(msg, null, 2)}`);

      if (this.processedEvents.has(eventKey)) {
        this.logger.warn(`Message ${eventKey} already processed, skipping...`);
        return;
      }

      this.logger.log(`Processing paymentCode=${msg.paymentCode} amount=${msg.amount} userId=${msg.userId}`);

      // TODO: Persist user transaction history here
      // await this.transactionHistoryRepo.save({
      //   userId: msg.userId,
      //   paymentCode: msg.paymentCode,
      //   amount: msg.amount,
      //   status: 'COMPLETED',
      //   completedAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      //   eventKey,
      // });

      this.processedEvents.add(eventKey);
      this.logger.log(`✅ Successfully processed payment.completed: ${eventKey}`);
    } catch (error) {
      this.logger.error(`Error processing payment.completed: ${error.message}`);
      this.logger.error(error.stack);
      throw error; // cho retry / DLQ nếu thật sự là lỗi xử lý
    }
  }

  /**
   * Listen for payment.failed events
   * Routing key: payment.failed
   */
  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'payment.failed',
    queue: 'user.payment-failed',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'ccm.events.dlx',
      deadLetterRoutingKey: 'payment.failed.dead',
    },
  })
  async handlePaymentFailed(msg: PaymentFailedMessage) {
    try {
      if (!msg || !msg.paymentCode) {
        this.logger.error('Received malformed payment.failed message (missing paymentCode)');
        return;
      }

      const eventKey = `failed:${msg.paymentCode}`;
      this.logger.log(`Received payment.failed message: ${msg.paymentCode}`);
      this.logger.log(`Message data: ${JSON.stringify(msg, null, 2)}`);

      if (this.processedEvents.has(eventKey)) {
        this.logger.warn(`Message ${eventKey} already processed, skipping...`);
        return;
      }

      this.logger.warn(`Payment failed: ${msg.paymentCode} reason=${msg.reason || 'Unknown'}`);

      // TODO: Persist failure notification/history

      this.processedEvents.add(eventKey);
      this.logger.log(`✅ Successfully processed payment.failed: ${msg.paymentCode}`);
    } catch (error) {
      this.logger.error(`Error processing payment.failed: ${error.message}`);
      throw error; // cho retry nếu là lỗi xử lý
    }
  }

  /**
   * Listen for payment.initiated events (optional - for tracking)
   */
  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'payment.initiated',
    queue: 'user.payment-initiated',
    queueOptions: {
      durable: true,
    },
  })
  async handlePaymentInitiated(msg: any) {
    // Với message dạng phẳng có thể chỉ cần paymentCode
    const code = msg?.paymentCode || msg?.aggregateId || 'unknown';
    this.logger.log(`📝 Payment initiated: ${code}`);
  }
}
