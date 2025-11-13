import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('outbox_events')
@Index(['status', 'nextRetryAt'])
@Index(['aggregateType', 'aggregateId'])
export class OutboxEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  eventId: string;

  @Column({ type: 'varchar', length: 50 })
  aggregateType: string;

  @Column({ type: 'varchar', length: 100 })
  aggregateId: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'json' })
  payload: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  routingKey: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  exchange: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  topic: string;

  @Column({ type: 'enum', enum: OutboxStatus, default: OutboxStatus.PENDING })
  status: OutboxStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 5 })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRetryAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;
}