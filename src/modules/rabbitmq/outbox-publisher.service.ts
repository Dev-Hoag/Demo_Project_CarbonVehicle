import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  OutboxEvent,
  OutboxStatus,
} from '../../shared/entities/outbox-event.entity';
import { IBaseEvent } from '@ccm/events';

@Injectable()
export class OutboxPublisherService implements OnModuleInit {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private readonly MAX_RETRY = 5;
  private readonly BATCH_SIZE = 50;
  private isPublishing = false;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async onModuleInit() {
    this.logger.log('OutboxPublisher initialized. Starting background publishing...');
    // Publish pending events on startup
    await this.publishPendingEvents();
  }

  /**
   * Cron job chạy mỗi 10 giây để publish pending events
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async publishPendingEventsCron() {
    if (this.isPublishing) {
      this.logger.debug('Previous publishing still in progress, skipping...');
      return;
    }
    await this.publishPendingEvents();
  }

  /**
   * Publish all pending events from outbox table
   */
  async publishPendingEvents(): Promise<void> {
    if (this.isPublishing) return;

    this.isPublishing = true;
    try {
      const pendingEvents = await this.outboxRepository.find({
        where: [
          { status: OutboxStatus.PENDING, retryCount: LessThan(this.MAX_RETRY) },
          { status: OutboxStatus.FAILED, retryCount: LessThan(this.MAX_RETRY), nextRetryAt: LessThan(new Date()) },
        ],
        order: { createdAt: 'ASC' },
        take: this.BATCH_SIZE,
      });

      if (pendingEvents.length === 0) {
        this.logger.debug('No pending events to publish');
        return;
      }

      this.logger.log(`Publishing ${pendingEvents.length} pending events`);

      for (const outboxEvent of pendingEvents) {
        await this.publishEvent(outboxEvent);
      }
    } catch (error) {
      this.logger.error('Error publishing pending events', error.stack);
    } finally {
      this.isPublishing = false;
    }
  }

  /**
   * Publish single event to RabbitMQ
   */
  private async publishEvent(outboxEvent: OutboxEvent): Promise<void> {
    try {
      // TypeORM 'json' column type automatically parses JSON, so payload is already an object
      const event: IBaseEvent = typeof outboxEvent.payload === 'string' 
        ? JSON.parse(outboxEvent.payload)
        : outboxEvent.payload;

      // Publish to RabbitMQ using routing key from outbox table
      await this.amqpConnection.publish(
        outboxEvent.exchange, // Use exchange from DB
        outboxEvent.routingKey, // Use routing key from DB (e.g., 'payment.initiated')
        event,
        {
          persistent: true,
          contentType: 'application/json',
          messageId: event.id,
          correlationId: event.metadata.correlationId,
          timestamp: Date.now(),
        },
      );

      // Mark as published
      outboxEvent.status = OutboxStatus.PUBLISHED;
      outboxEvent.publishedAt = new Date();
      await this.outboxRepository.save(outboxEvent);

      this.logger.log(
        `Published event: ${event.type} (${event.id}) to ${outboxEvent.exchange}/${outboxEvent.routingKey}`,
      );
    } catch (error) {
      // Increment retry count and set next retry time
      outboxEvent.retryCount += 1;
      outboxEvent.lastRetryAt = new Date();
      outboxEvent.lastError = error.message;
      outboxEvent.status = OutboxStatus.FAILED;
      
      // Exponential backoff: 1min, 2min, 4min, 8min, 16min
      const backoffMinutes = Math.pow(2, outboxEvent.retryCount - 1);
      outboxEvent.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      
      await this.outboxRepository.save(outboxEvent);

      this.logger.error(
        `Failed to publish event ${outboxEvent.id} (retry: ${outboxEvent.retryCount}/${this.MAX_RETRY})`,
        error.stack,
      );

      if (outboxEvent.retryCount >= this.MAX_RETRY) {
        this.logger.error(
          `Event ${outboxEvent.id} exceeded max retries. Moving to manual review.`,
        );
      }
    }
  }

  /**
   * Manually retry failed events
   */
  async retryFailedEvents(): Promise<void> {
    const failedEvents = await this.outboxRepository.find({
      where: {
        status: OutboxStatus.FAILED,
        retryCount: LessThan(this.MAX_RETRY),
      },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`Retrying ${failedEvents.length} failed events`);

    for (const event of failedEvents) {
      await this.publishEvent(event);
    }
  }

  /**
   * Get statistics about outbox events
   */
  async getStatistics(): Promise<{
    pending: number;
    published: number;
    failed: number;
  }> {
    const [pending, published, failed] = await Promise.all([
      this.outboxRepository.count({
        where: { status: OutboxStatus.PENDING, retryCount: LessThan(this.MAX_RETRY) },
      }),
      this.outboxRepository.count({ where: { status: OutboxStatus.PUBLISHED } }),
      this.outboxRepository.count({
        where: { status: OutboxStatus.FAILED, retryCount: this.MAX_RETRY },
      }),
    ]);

    return { pending, published, failed };
  }
}
