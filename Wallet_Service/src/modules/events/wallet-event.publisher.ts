// src/modules/events/wallet-event.publisher.ts

import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

interface WithdrawalEvent {
  userId: string;
  withdrawalId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
}

@Injectable()
export class WalletEventPublisher {
  private readonly logger = new Logger(WalletEventPublisher.name);
  private readonly EXCHANGE = 'ccm.events';

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishWithdrawalApproved(event: WithdrawalEvent): Promise<void> {
    try {
      await this.amqpConnection.publish(
        this.EXCHANGE,
        'withdrawal.approved',
        event,
      );
      this.logger.log(`📤 Published withdrawal.approved event for withdrawal: ${event.withdrawalId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish withdrawal.approved event: ${error.message}`);
    }
  }

  async publishWithdrawalRejected(event: WithdrawalEvent): Promise<void> {
    try {
      await this.amqpConnection.publish(
        this.EXCHANGE,
        'withdrawal.rejected',
        event,
      );
      this.logger.log(`📤 Published withdrawal.rejected event for withdrawal: ${event.withdrawalId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish withdrawal.rejected event: ${error.message}`);
    }
  }
}
