// src/shared/entities/wallet-transaction.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionType, TransactionStatus } from '../enums';
import { Wallet } from './wallet.entity';

@Entity('wallet_transactions')
@Index(['walletId', 'createdAt'])
// Idempotency guard: tránh ghi trùng giao dịch cho cùng (wallet, reference, type)
@Index(['walletId', 'referenceType', 'referenceId', 'type'], { unique: true })
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'wallet_id' })
  @Index()
  walletId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'balance_before',
  })
  balanceBefore: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'balance_after',
  })
  balanceAfter: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_type' })
  referenceType: string; // 'payment', 'trade', 'withdrawal', 'reserve'

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'reference_id' })
  @Index()
  referenceId: string; // ID của payment, transaction, withdrawal, reserve

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}
