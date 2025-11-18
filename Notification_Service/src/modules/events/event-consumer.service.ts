import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.connectRabbitMQ();
    await this.setupConsumers();
  }

  private async connectRabbitMQ() {
    try {
      const rabbitmqUrl = this.configService.get('RABBITMQ_URL');
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.logger.log('✅ Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error.message);
      throw error;
    }
  }

  private async setupConsumers() {
    // List of events to consume
    const events = [
      'trip.verified',
      'listing.created',
      'listing.sold',
      'payment.completed',
      'credit.issued',
      'withdrawal.approved',
      'withdrawal.rejected',
      'user.registered',
      'certificate.generated',
    ];

    for (const event of events) {
      await this.consumeEvent(event);
    }
  }

  private async consumeEvent(eventName: string) {
    const queue = `notification_service_${eventName}`;
    
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, 'ccm.events', eventName);

    this.logger.log(`📬 Listening to ${eventName} events`);

    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const eventData = JSON.parse(msg.content.toString());
          await this.handleEvent(eventName, eventData);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Failed to process ${eventName} event:`, error.message);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async handleEvent(eventName: string, data: any) {
    this.logger.log(`📨 Received event: ${eventName}`, JSON.stringify(data).substring(0, 200));

    const templateMap = {
      'trip.verified': 'TRIP_VERIFIED',
      'listing.created': 'LISTING_CREATED',
      'listing.sold': 'LISTING_SOLD',
      'payment.completed': 'PAYMENT_COMPLETED',
      'credit.issued': 'CREDIT_ISSUED',
      'withdrawal.approved': 'WITHDRAWAL_APPROVED',
      'withdrawal.rejected': 'WITHDRAWAL_REJECTED',
      'user.registered': 'USER_REGISTERED',
      'certificate.generated': 'CERTIFICATE_GENERATED',
    };

    const templateCode = templateMap[eventName];
    if (!templateCode) {
      this.logger.warn(`No template found for event: ${eventName}`);
      return;
    }

    // Support both flat and nested event structures
    // Some services send: { userId: "1", ... }
    // Others send: { payload: { userId: "1", ... } }
    const eventPayload = data.payload || data;
    const userId = eventPayload.userId || eventPayload.user_id || data.userId || data.user_id;
    
    if (!userId) {
      this.logger.warn(`❌ No userId found in event: ${eventName}`, JSON.stringify(data));
      return;
    }

    this.logger.log(`👤 Processing notification for userId: ${userId}`);
    
    // Use event payload as variables
    const variables = eventPayload;

    try {
      await this.notificationService.sendInternalNotification({
        userId,
        templateCode,
        variables,
        channels: ['PUSH', 'IN_APP'], // Send via Push and In-App by default
      });

      this.logger.log(`✅ Notification sent for event: ${eventName} to user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for ${eventName}:`, error.message);
      throw error;
    }
  }

  async publishNotificationEvent(eventName: string, data: any) {
    try {
      await this.channel.assertExchange('ccm.events', 'topic', { durable: true });
      this.channel.publish('ccm.events', eventName, Buffer.from(JSON.stringify(data)));
      this.logger.log(`Published event: ${eventName}`);
    } catch (error) {
      this.logger.error(`Failed to publish ${eventName} event:`, error.message);
    }
  }
}
