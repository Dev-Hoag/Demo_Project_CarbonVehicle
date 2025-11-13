// src/modules/events/payment-event.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { TransactionStatus } from '../../shared/enums/admin.enums';

// Payment Service hiện publish message dạng phẳng (không có id/payload wrapper)
// Ví dụ: { paymentCode, amount, userId, timestamp }
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
  async handlePaymentCompleted(msg: PaymentCompletedMessage): Promise<void> {
    this.logger.log(`[payment.completed] Raw message received: ${JSON.stringify(msg)}`);
    if (!msg || !msg.paymentCode) {
      this.logger.error('[payment.completed] Malformed message (missing paymentCode)');
      return;
    }
    const eventKey = `completed:${msg.paymentCode}`;

    if (this.processedEvents.has(eventKey)) {
      this.logger.warn(`[payment.completed] Already processed: ${eventKey}`);
      return;
    }

    try {
      this.logger.log(`[payment.completed] Processing paymentCode=${msg.paymentCode} amount=${msg.amount}`);

      const transaction = await this.transactionRepo.findOne({
        where: { externalTransactionId: msg.paymentCode },
      });

      if (transaction) {
        await this.transactionRepo.update(
          { id: transaction.id },
          {
            status: TransactionStatus.COMPLETED,
            amount: msg.amount,
            completedAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            syncedAt: new Date(),
          },
        );
        this.logger.log(`✅ Updated managed_transaction: ${transaction.externalTransactionId} → COMPLETED (${msg.amount} VND)`);
      } else {
        const newTransaction = this.transactionRepo.create({
          externalTransactionId: msg.paymentCode,
          status: TransactionStatus.COMPLETED,
          amount: msg.amount,
            completedAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          syncedAt: new Date(),
        });
        await this.transactionRepo.save(newTransaction);
        this.logger.log(`✅ Created new managed_transaction: ${msg.paymentCode} (${msg.amount} VND)`);
      }

      this.processedEvents.add(eventKey);
      if (this.processedEvents.size > 1000) {
        const toDelete = Array.from(this.processedEvents).slice(0, 100);
        toDelete.forEach(id => this.processedEvents.delete(id));
      }
    } catch (error) {
      this.logger.error(`❌ Failed to process payment.completed: ${msg.paymentCode}`, error.stack);
      throw error;
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
  async handlePaymentFailed(msg: PaymentFailedMessage): Promise<void> {
    if (!msg || !msg.paymentCode) {
      this.logger.error('[payment.failed] Malformed message (missing paymentCode)');
      return;
    }
    const eventKey = `failed:${msg.paymentCode}`;
    if (this.processedEvents.has(eventKey)) {
      this.logger.warn(`[payment.failed] Already processed: ${eventKey}`);
      return;
    }

    try {
      this.logger.log(`[payment.failed] Processing paymentCode=${msg.paymentCode} reason=${msg.reason || 'Unknown'}`);
      const transaction = await this.transactionRepo.findOne({
        where: { externalTransactionId: msg.paymentCode },
      });

      if (transaction) {
        await this.transactionRepo.update(
          { id: transaction.id },
          {
            status: TransactionStatus.CANCELLED,
            disputeReason: msg.reason || 'Payment failed',
            syncedAt: new Date(),
          },
        );
        this.logger.log(`✅ Updated managed_transaction: ${transaction.externalTransactionId} → CANCELLED (Reason: ${msg.reason || 'Payment failed'})`);
      } else {
        const newTransaction = this.transactionRepo.create({
          externalTransactionId: msg.paymentCode,
          status: TransactionStatus.CANCELLED,
          disputeReason: msg.reason || 'Payment failed',
          syncedAt: new Date(),
        });
        await this.transactionRepo.save(newTransaction);
        this.logger.log(`✅ Created new managed_transaction: ${msg.paymentCode} → CANCELLED`);
      }

      this.processedEvents.add(eventKey);
      if (this.processedEvents.size > 1000) {
        const toDelete = Array.from(this.processedEvents).slice(0, 100);
        toDelete.forEach(id => this.processedEvents.delete(id));
      }
    } catch (error) {
      this.logger.error(`❌ Failed to process payment.failed: ${msg.paymentCode}`, error.stack);
      throw error;
    }
  }
}
