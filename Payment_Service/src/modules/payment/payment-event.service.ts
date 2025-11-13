import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent, OutboxStatus } from '../../shared/entities/outbox-event.entity';
import {
  PaymentInitiatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  BaseEvent,
  IPaymentInitiatedPayload,
  IPaymentCompletedPayload,
  IPaymentFailedPayload,
} from '@ccm/events';

@Injectable()
export class PaymentEventService {
  private readonly logger = new Logger(PaymentEventService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
  ) {}

  /**
   * Publish PaymentInitiated event
   */
  async publishPaymentInitiated(
    payload: IPaymentInitiatedPayload,
    correlationId?: string,
  ): Promise<void> {
    const event = new PaymentInitiatedEvent(
      payload.paymentCode,
      payload,
      {
        correlationId: correlationId || BaseEvent.generateCorrelationId(),
        actor: 'system',
      },
    );

    await this.saveToOutbox(event);
    this.logger.log(`PaymentInitiated event queued: ${payload.paymentCode}`);
  }

  /**
   * Publish PaymentCompleted event
   */
  async publishPaymentCompleted(
    payload: IPaymentCompletedPayload,
    correlationId?: string,
  ): Promise<void> {
    const event = new PaymentCompletedEvent(
      payload.paymentCode,
      payload,
      {
        correlationId: correlationId || BaseEvent.generateCorrelationId(),
        actor: 'system',
      },
    );

    await this.saveToOutbox(event);
    this.logger.log(`PaymentCompleted event queued: ${payload.paymentCode}`);
  }

  /**
   * Publish PaymentFailed event
   */
  async publishPaymentFailed(
    payload: IPaymentFailedPayload,
    correlationId?: string,
  ): Promise<void> {
    const event = new PaymentFailedEvent(
      payload.paymentCode,
      payload,
      {
        correlationId: correlationId || BaseEvent.generateCorrelationId(),
        actor: 'system',
      },
    );

    await this.saveToOutbox(event);
    this.logger.log(`PaymentFailed event queued: ${payload.paymentCode}`);
  }

  /**
   * Save event to outbox table
   * This ensures transactional publishing with Outbox pattern
   */
  private async saveToOutbox(event: any): Promise<void> {
    // Convert event instance to plain object for JSON serialization
    const eventData = {
      id: event.id,
      type: event.type,
      version: event.version,
      source: event.source,
      aggregateId: event.aggregateId,
      timestamp: event.timestamp,
      payload: event.payload,
      metadata: event.metadata,
    };

    const outboxEvent = this.outboxRepository.create({
      eventId: event.id,
      aggregateType: event.source,
      aggregateId: event.aggregateId,
      eventType: event.type,
      payload: JSON.stringify(eventData),
      routingKey: event.type,
      exchange: 'ccm.events',
      topic: event.type,
      status: OutboxStatus.PENDING,
      retryCount: 0,
      maxRetries: 5,
    });

    await this.outboxRepository.save(outboxEvent);
  }
}
