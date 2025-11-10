// src/shared/entities/reserve.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ReserveStatus } from '../enums';
import { Wallet } from './wallet.entity';

@Entity('reserves')
@Index(['transactionId'], { unique: true })
@Index(['walletId', 'status'])
export class Reserve {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'wallet_id' })
  @Index()
  walletId: string;

  @Column({ type: 'varchar', length: 36, name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ReserveStatus,
    default: ReserveStatus.ACTIVE,
  })
  status: ReserveStatus;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'released_at' })
  releasedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'settled_at' })
  settledAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Wallet, (wallet) => wallet.reserves)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}
