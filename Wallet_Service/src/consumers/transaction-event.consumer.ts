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
      await this.reservesService.reserveFunds(
        msg.userId,
        msg.transactionId,
        msg.amount,
        msg.expirationMinutes || 60,
      );
      this.logger.log(`Successfully reserved funds for transaction ${msg.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing transaction.created: ${error.message}`, error.stack);
      throw error; // Retry for errors
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
      throw error; // Retry for errors
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
