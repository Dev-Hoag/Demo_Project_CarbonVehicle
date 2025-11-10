// src/shared/entities/wallet-audit.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('wallet_audit_logs')
@Index(['walletId', 'createdAt'])
export class WalletAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'wallet_id' })
  walletId: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'delta' })
  delta: number; // +/- thay đổi số dư

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'balance_before' })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 40, name: 'source_type' })
  sourceType: string; // 'deposit','withdraw','settle','refund','reserve'

  @Column({ type: 'varchar', length: 80, name: 'source_id', nullable: true })
  sourceId: string;

  @Column({ type: 'varchar', length: 40, name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 60, name: 'trace_id', nullable: true })
  traceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
