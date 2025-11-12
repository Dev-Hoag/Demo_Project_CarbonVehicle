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
    queueOptions: {
      durable: true,
      deadLetterExchange: 'ccm.events.dlx',
      deadLetterRoutingKey: 'wallet.payment.completed.dlq',
    },
  })
  async handlePaymentCompleted(msg: any) {
    try {
      this.logger.log(`Received payment.completed event: ${JSON.stringify(msg)}`);
      
      // Extract data from event payload (BaseEvent structure)
      const userId = String(msg.payload?.userId || msg.userId);
      const amount = Number(msg.payload?.amount || msg.amount);
      const paymentId = msg.payload?.paymentCode || msg.payload?.transactionId || msg.paymentId;
      const description = msg.payload?.orderInfo || msg.reason || 'Payment completed';

      if (!userId || !amount || !paymentId) {
        this.logger.error(`Invalid payment event data: ${JSON.stringify(msg)}`);
        return; // ACK invalid messages
      }

      await this.walletsService.addBalance(userId, amount, paymentId, description);
      this.logger.log(`Applied payment ${paymentId} (${amount} VND) to wallet ${userId}`);
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
