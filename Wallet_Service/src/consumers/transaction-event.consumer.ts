import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ReservesService } from '../modules/reserves/reserves.service';

@Injectable()
export class TransactionEventConsumer {
  private readonly logger = new Logger(TransactionEventConsumer.name);

  constructor(private readonly reservesService: ReservesService) {}

  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'transaction.created',
    queue: 'wallet.transaction.created',
  })
  async handleTransactionCreated(msg: any) {
    try {
      this.logger.log(`Received transaction.created event: ${JSON.stringify(msg)}`);
      // msg: { userId, transactionId, amount, expirationMinutes }
      const { reserve } = await this.reservesService.reserveFunds(
        msg.userId,
        msg.transactionId,
        msg.amount,
        msg.expirationMinutes || 60,
      );
      if (reserve && reserve.status === 'ACTIVE') {
        this.logger.log(`Successfully reserved funds for transaction ${msg.transactionId}`);
      } else {
        this.logger.log(`Reserve already exists for transaction ${msg.transactionId}, idempotent ack.`);
      }
    } catch (error) {
      this.logger.error(`Error processing transaction.created: ${error.message}`, error.stack);
      if (error.message.includes('Insufficient balance')) {
        // Business rejection -> ack, do not retry
        this.logger.warn(`Insufficient balance for transaction ${msg.transactionId}, acknowledging.`);
        return;
      }
      if (error.message.includes('Wallet not found')) {
        this.logger.warn(`Wallet not found for user ${msg.userId}, acknowledging.`);
        return;
      }
      // Other errors -> requeue
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'transaction.completed',
    queue: 'wallet.transaction.completed',
  })
  async handleTransactionCompleted(msg: any) {
    try {
      this.logger.log(`Received transaction.completed event: ${JSON.stringify(msg)}`);
      // msg: { transactionId, buyerId, sellerId, amount }
      await this.reservesService.settleFunds(
        msg.transactionId,
        msg.buyerId,
        msg.sellerId,
        msg.amount,
      );
      this.logger.log(`Successfully settled funds for transaction ${msg.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing transaction.completed: ${error.message}`, error.stack);
      if (
        error.message.includes('Buyer reserve not found') ||
        error.message.includes('Already processed') ||
        error.message.includes('Insufficient locked funds')
      ) {
        this.logger.warn(`Idempotent settle for transaction ${msg.transactionId}, acknowledging.`);
        return; // ack
      }
      throw error; // requeue other errors
    }
  }

  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'transaction.cancelled',
    queue: 'wallet.transaction.cancelled',
  })
  async handleTransactionCancelled(msg: any) {
    try {
      this.logger.log(`Received transaction.cancelled event: ${JSON.stringify(msg)}`);
      // msg: { transactionId }
      await this.reservesService.releaseFunds(msg.transactionId);
      this.logger.log(`Successfully processed transaction.cancelled for ${msg.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing transaction.cancelled: ${error.message}`, error.stack);
      // Acknowledge message to prevent infinite retry for non-existent reserves
      if (error.message.includes('Reserve not found')) {
        this.logger.warn(`Reserve not found for transaction ${msg.transactionId}, acknowledging message`);
        return; // ACK the message
      }
      throw error; // Retry for other errors
    }
  }
}
