import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PaymentCallback } from './payment-callback.entity';
import { PaymentEvent } from './payment-event.entity';
import { Refund } from './refund.entity';

export enum PaymentGateway {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  BANK = 'BANK',
  TEST = 'TEST',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

@Entity('payments')
@Index(['paymentCode'])
@Index(['transactionId'])
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  paymentCode: string;

  @Column({ type: 'varchar', length: 100 })
  transactionId: string;

  @Column({ type: 'bigint', unsigned: true })
  userId: number;

  // Gateway info
  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ type: 'varchar', length: 200, nullable: true })
  gatewayTransactionId: string;

  // Amount
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  // Status
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // URLs
  @Column({ type: 'text', nullable: true })
  paymentUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  returnUrl: string;

  // Idempotency & Retry
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  idempotencyKey: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRetryAt: Date;

  // Payment details
  @Column({ type: 'varchar', length: 255, nullable: true })
  orderInfo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankCode: string;

  // Gateway response
  @Column({ type: 'varchar', length: 20, nullable: true })
  gatewayResponseCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayResponseMsg: string;

  // IP & Device
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  initiatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata: any;

  // Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relations
  @OneToMany(() => PaymentCallback, (callback) => callback.payment)
  callbacks: PaymentCallback[];

  @OneToMany(() => PaymentEvent, (event) => event.payment)
  events: PaymentEvent[];

  @OneToMany(() => Refund, (refund) => refund.payment)
  refunds: Refund[];
}