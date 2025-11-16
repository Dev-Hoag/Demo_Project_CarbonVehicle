import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  DIRECT_PURCHASE = 'DIRECT_PURCHASE',
  BID_ACCEPTED = 'BID_ACCEPTED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  listingId: string;

  @Column({ type: 'varchar', length: 36 })
  sellerId: string;

  @Column({ type: 'varchar', length: 36 })
  buyerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // CO2 amount in kg

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  pricePerKg: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.DIRECT_PURCHASE,
  })
  transactionType: TransactionType;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
