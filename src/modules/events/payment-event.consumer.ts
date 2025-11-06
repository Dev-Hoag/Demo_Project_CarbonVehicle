// src/modules/events/payment-event.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Consumer lắng nghe payment events từ RabbitMQ
 * Demo: Idempotency, Event-driven architecture
 */
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
  async handlePaymentCompleted(event: any) {
    try {
      this.logger.log(`Received payment.completed event: ${event.id}`);
      this.logger.log(`Event data: ${JSON.stringify(event, null, 2)}`);

      // Idempotency check
      if (this.processedEvents.has(event.id)) {
        this.logger.warn(`Event ${event.id} already processed, skipping...`);
        return;
      }

      const { aggregateId, payload, metadata } = event;
      
      this.logger.log(`Processing payment: ${aggregateId}`);
      this.logger.log(`User ID: ${payload.userId}`);
      this.logger.log(`Amount: ${payload.amount}`);
      this.logger.log(`Transaction ID: ${payload.transactionId}`);

      // TODO: Update user transaction history
      // await this.transactionHistoryRepo.save({
      //   userId: payload.userId,
      //   paymentCode: aggregateId,
      //   transactionId: payload.transactionId,
      //   amount: payload.amount,
      //   status: 'COMPLETED',
      //   eventId: event.id,
      // });

      // Mark as processed
      this.processedEvents.add(event.id);

      this.logger.log(`✅ Successfully processed payment.completed: ${aggregateId}`);
    } catch (error) {
      this.logger.error(`Error processing payment.completed: ${error.message}`);
      this.logger.error(error.stack);
      // Nếu throw error, message sẽ retry hoặc vào DLQ
      throw error;
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
  async handlePaymentFailed(event: any) {
    try {
      this.logger.log(`Received payment.failed event: ${event.id}`);
      this.logger.log(`Event data: ${JSON.stringify(event, null, 2)}`);

      // Idempotency check
      if (this.processedEvents.has(event.id)) {
        this.logger.warn(`Event ${event.id} already processed, skipping...`);
        return;
      }

      const { aggregateId, payload } = event;
      
      this.logger.warn(`Payment failed: ${aggregateId}`);
      this.logger.warn(`Reason: ${payload.reason || 'Unknown'}`);

      // TODO: Update user notification or transaction history

      // Mark as processed
      this.processedEvents.add(event.id);

      this.logger.log(`✅ Successfully processed payment.failed: ${aggregateId}`);
    } catch (error) {
      this.logger.error(`Error processing payment.failed: ${error.message}`);
      throw error;
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
  async handlePaymentInitiated(event: any) {
    this.logger.log(`📝 Payment initiated: ${event.aggregateId}`);
    // Optional: Track payment initiation for analytics
  }
}
