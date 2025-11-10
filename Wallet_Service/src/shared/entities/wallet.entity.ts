// src/shared/entities/wallet.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { WalletStatus } from '../enums';
import { WalletTransaction } from './wallet-transaction.entity';
import { Reserve } from './reserve.entity';

@Entity('wallets')
@Index(['userId'], { unique: true })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'locked_balance',
  })
  lockedBalance: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
  })
  status: WalletStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => WalletTransaction, (transaction) => transaction.wallet)
  transactions: WalletTransaction[];

  @OneToMany(() => Reserve, (reserve) => reserve.wallet)
  reserves: Reserve[];

  // Virtual fields
  get availableBalance(): number {
    return Number(this.balance) - Number(this.lockedBalance);
  }

  get totalEarned(): number {
    // Calculated from transactions (DEPOSIT + SETTLE_IN)
    return 0; // Implement in service
  }

  get totalSpent(): number {
    // Calculated from transactions (WITHDRAWAL + SETTLE_OUT)
    return 0; // Implement in service
  }
}
