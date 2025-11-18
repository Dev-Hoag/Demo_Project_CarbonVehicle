import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';
import { CreditPurchasedEvent } from './credit-purchased.event';

@Injectable()
export class EventPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName = 'ccm.events';
  private readonly routingKey = 'credit.purchased';

  constructor(private configService: ConfigService) {
    this.initializeRabbitMQ();
  }

  private async initializeRabbitMQ() {
    try {
      const rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@ccm_rabbitmq:5672/ccm_vhost');
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Declare exchange (topic type for routing)
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.logger.log('✅ Connected to RabbitMQ and exchange declared');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ', error);
    }
  }

  async publishCreditPurchased(event: CreditPurchasedEvent): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.warn('RabbitMQ channel not ready, attempting to reconnect...');
        await this.initializeRabbitMQ();
      }

      const message = JSON.stringify(event);
      
      this.channel.publish(
        this.exchangeName,
        this.routingKey,
        Buffer.from(message),
        { persistent: true, contentType: 'application/json' }
      );

      this.logger.log(
        `✅ Published credit.purchased event: Transaction ${event.transactionId}, ` +
        `Buyer ${event.buyerId}, Amount ${event.creditAmount} kg`
      );
    } catch (error) {
      this.logger.error('❌ Failed to publish credit.purchased event', error);
      // Don't throw - event publishing failure shouldn't break the transaction
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }
}
