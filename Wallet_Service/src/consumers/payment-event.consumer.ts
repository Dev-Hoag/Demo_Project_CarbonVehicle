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
    this.logger.log(`Received payment.completed event: ${JSON.stringify(msg)}`);
    // msg: { userId, amount, paymentId, reason }
    await this.walletsService.addBalance(
      msg.userId,
      msg.amount,
      msg.paymentId,
      msg.reason || 'Payment completed',
    );
  }
}
