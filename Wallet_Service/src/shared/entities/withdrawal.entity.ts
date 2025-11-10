// src/shared/entities/withdrawal.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WithdrawalStatus } from '../enums';

@Entity('withdrawals')
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 36, name: 'wallet_id' })
  @Index()
  walletId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fee: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'net_amount',
  })
  netAmount: number; // amount - fee

  @Column({ type: 'varchar', length: 100, name: 'bank_account_name' })
  bankAccountName: string;

  @Column({ type: 'varchar', length: 50, name: 'bank_account_number' })
  bankAccountNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'bank_name' })
  bankName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'bank_branch' })
  bankBranch: string;

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'transaction_id' })
  transactionId: string; // Wallet transaction ID

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_reference' })
  paymentReference: string; // Bank transfer reference

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'approved_by' })
  approvedBy: string; // Admin user ID

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
