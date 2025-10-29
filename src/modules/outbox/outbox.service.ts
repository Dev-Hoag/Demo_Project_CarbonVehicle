import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEvent, OutboxStatus } from '../../shared/entities/outbox-event.entity';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private outboxRepository: Repository<OutboxEvent>,
  ) {}

  /**
   * Process outbox events every 10 seconds
   */
  @Cron('*/10 * * * * *')
  async processOutboxEvents() {
    const now = new Date();

    const pendingEvents = await this.outboxRepository.find({
      where: [
        { status: OutboxStatus.PENDING },
        {
          status: OutboxStatus.FAILED,
          nextRetryAt: LessThanOrEqual(now),
        },
      ],
      take: 50,
      order: { createdAt: 'ASC' },
    });

    if (pendingEvents.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingEvents.length} outbox events`);

    for (const event of pendingEvents) {
      try {
        // TODO: Publish to RabbitMQ/Kafka
        // await this.eventBus.publish(event.eventType, event.payload);

        // For now, just log
        this.logger.log(
          `[OUTBOX] Event published: ${event.eventType} - ${event.aggregateId}`,
        );

        event.status = OutboxStatus.PUBLISHED;
        event.publishedAt = new Date();
        await this.outboxRepository.save(event);
      } catch (error) {
        this.logger.error(
          `Failed to publish event ${event.id}: ${error.message}`,
        );

        event.retryCount++;
        event.lastError = error.message;
        event.lastRetryAt = new Date();

        if (event.retryCount >= event.maxRetries) {
          event.status = OutboxStatus.FAILED;
          this.logger.error(
            `Event ${event.id} failed after ${event.retryCount} retries`,
          );
        } else {
          // Calculate next retry with exponential backoff
          const delayMinutes = Math.pow(2, event.retryCount);
          event.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        }

        await this.outboxRepository.save(event);
      }
    }
  }

  /**
   * Archive old published events (run daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async archiveOldEvents() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.outboxRepository.update(
      {
        status: OutboxStatus.PUBLISHED,
        publishedAt: LessThanOrEqual(thirtyDaysAgo),
      },
      { status: OutboxStatus.ARCHIVED },
    );

    this.logger.log(`Archived ${result.affected} old outbox events`);
  }
}
