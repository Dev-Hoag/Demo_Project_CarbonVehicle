// src/modules/events/payment-event.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCompletedEvent, PaymentFailedEvent } from '@ccm/events';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { TransactionStatus } from '../../shared/enums/admin.enums';

@Injectable()
export class PaymentEventConsumer {
  private readonly logger = new Logger(PaymentEventConsumer.name);
  private readonly processedEvents = new Set<string>();

  constructor(
    @InjectRepository(ManagedTransaction)
    private readonly transactionRepo: Repository<ManagedTransaction>,
  ) {}

  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'payment.completed',
    queue: 'admin.payment-completed',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'ccm.events.dlx',
    },
  })
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    const eventId = event.id;
    
    // Idempotency check
    if (this.processedEvents.has(eventId)) {
      this.logger.warn(`[payment.completed] Event already processed: ${eventId}`);
      return;
    }

    try {
      this.logger.log(`[payment.completed] Processing event: ${eventId}, Payment: ${event.payload.paymentCode}`);

      // Find transaction by external ID (payment code)
      const transaction = await this.transactionRepo.findOne({
        where: { externalTransactionId: event.payload.paymentCode },
      });

      if (transaction) {
        // Update transaction status and amount
        await this.transactionRepo.update(
          { id: transaction.id },
          {
            status: TransactionStatus.COMPLETED,
            amount: event.payload.amount,
            completedAt: new Date(event.timestamp),
            syncedAt: new Date(),
          },
        );

        this.logger.log(
          `✅ Updated managed_transaction: ${transaction.externalTransactionId} → COMPLETED (${event.payload.amount} VND)`,
        );
      } else {
        // Create new transaction record if not exists
        const newTransaction = this.transactionRepo.create({
          externalTransactionId: event.payload.paymentCode,
          status: TransactionStatus.COMPLETED,
          amount: event.payload.amount,
          completedAt: new Date(event.timestamp),
          syncedAt: new Date(),
          // Note: sellerId, buyerId will be null for now
          // Can be enriched later from user events
        });

        await this.transactionRepo.save(newTransaction);

        this.logger.log(
          `✅ Created new managed_transaction: ${event.payload.paymentCode} (${event.payload.amount} VND)`,
        );
      }

      // Mark as processed
      this.processedEvents.add(eventId);

      // Cleanup old processed events (keep last 1000)
      if (this.processedEvents.size > 1000) {
        const toDelete = Array.from(this.processedEvents).slice(0, 100);
        toDelete.forEach(id => this.processedEvents.delete(id));
      }

    } catch (error) {
      this.logger.error(
        `❌ Failed to process payment.completed: ${eventId}`,
        error.stack,
      );
      throw error; // Trigger retry/DLQ
    }
  }

  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'payment.failed',
    queue: 'admin.payment-failed',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'ccm.events.dlx',
    },
  })
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    const eventId = event.id;

    // Idempotency check
    if (this.processedEvents.has(eventId)) {
      this.logger.warn(`[payment.failed] Event already processed: ${eventId}`);
      return;
    }

    try {
      this.logger.log(`[payment.failed] Processing event: ${eventId}, Payment: ${event.payload.paymentCode}`);

      // Find transaction by external ID
      const transaction = await this.transactionRepo.findOne({
        where: { externalTransactionId: event.payload.paymentCode },
      });

      if (transaction) {
        // Update transaction status
        await this.transactionRepo.update(
          { id: transaction.id },
          {
            status: TransactionStatus.CANCELLED,
            disputeReason: event.payload.reason || 'Payment failed',
            syncedAt: new Date(),
          },
        );

        this.logger.log(
          `✅ Updated managed_transaction: ${transaction.externalTransactionId} → CANCELLED (Reason: ${event.payload.reason})`,
        );
      } else {
        // Create new transaction record as cancelled
        const newTransaction = this.transactionRepo.create({
          externalTransactionId: event.payload.paymentCode,
          status: TransactionStatus.CANCELLED,
          disputeReason: event.payload.reason || 'Payment failed',
          syncedAt: new Date(),
        });

        await this.transactionRepo.save(newTransaction);

        this.logger.log(
          `✅ Created new managed_transaction: ${event.payload.paymentCode} → CANCELLED`,
        );
      }

      // Mark as processed
      this.processedEvents.add(eventId);

      // Cleanup
      if (this.processedEvents.size > 1000) {
        const toDelete = Array.from(this.processedEvents).slice(0, 100);
        toDelete.forEach(id => this.processedEvents.delete(id));
      }

    } catch (error) {
      this.logger.error(
        `❌ Failed to process payment.failed: ${eventId}`,
        error.stack,
      );
      throw error; // Trigger retry/DLQ
    }
  }
}
