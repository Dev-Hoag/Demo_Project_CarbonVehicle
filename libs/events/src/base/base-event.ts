import { IsString, IsDateString, IsNumber, IsObject, IsOptional } from 'class-validator';

/**
 * Base interface for all domain events
 * Every event must extend this to ensure consistency across services
 */
export interface IBaseEvent {
  /** Unique event identifier (UUID v4) */
  id: string;

  /** Event type (e.g., 'payment.completed', 'user.verified') */
  type: string;

  /** Event schema version for backward compatibility */
  version: number;

  /** Source service that produced the event */
  source: string;

  /** ID of the aggregate root (e.g., userId, paymentId) */
  aggregateId: string;

  /** Event occurrence timestamp (ISO 8601) */
  timestamp: string;

  /** Event payload - specific to each event type */
  payload: Record<string, any>;

  /** Metadata for tracing and debugging */
  metadata: IEventMetadata;
}

export interface IEventMetadata {
  /** For distributed tracing - unique per business transaction */
  correlationId: string;

  /** ID of the event that caused this event (for causality tracking) */
  causationId?: string;

  /** Number of times this event has been retried */
  retries?: number;

  /** User or system that triggered this event */
  actor?: string;

  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Base class for all domain events
 * Provides common validation and structure
 */
export abstract class BaseEvent implements IBaseEvent {
  @IsString()
  id!: string;

  @IsString()
  type!: string;

  @IsNumber()
  version!: number;

  @IsString()
  source!: string;

  @IsString()
  aggregateId!: string;

  @IsDateString()
  timestamp!: string;

  @IsObject()
  payload!: Record<string, any>;

  @IsObject()
  metadata!: IEventMetadata;

  constructor(partial: Partial<IBaseEvent>) {
    Object.assign(this, partial);
  }

  /**
   * Generate a new event ID (UUID v4)
   */
  static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create correlation ID for tracing
   */
  static generateCorrelationId(): string {
    return this.generateId();
  }
}
