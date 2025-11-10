import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { WalletsService } from '../modules/wallets/wallets.service';

@Injectable()
export class PaymentEventConsumer {
  private readonly logger = new Logger(PaymentEventConsumer.name);

  constructor(private readonly walletsService: WalletsService) {}

  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: 'payment.completed',
    queue: 'wallet.payment.completed',
  })
  async handlePaymentCompleted(msg: any) {
    try {
      this.logger.log(`Received payment.completed event: ${JSON.stringify(msg)}`);
      // msg: { userId, amount, paymentId, reason }
      await this.walletsService.addBalance(
        msg.userId,
        msg.amount,
        msg.paymentId,
        msg.reason || 'Payment completed',
      );
      this.logger.log(`Applied payment ${msg.paymentId} to wallet ${msg.userId}`);
    } catch (error) {
      // Business/idempotent errors should be ACKed
      if (typeof error?.message === 'string' && error.message.includes('duplicate')) {
        this.logger.warn(`Duplicate payment ${msg.paymentId}, acknowledging.`);
        return;
      }
      this.logger.error(`Error processing payment.completed: ${error.message}`, error.stack);
      throw error; // requeue unexpected errors
    }
  }
}
