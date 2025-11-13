import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WalletTransactionType, WalletTransactionStatus } from '../enums/admin.enums';
import { WalletActionAudit } from './wallet-action-audit.entity';

@Entity('managed_wallet_transaction')
export class ManagedWalletTransaction {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'external_wallet_id' })
  externalWalletId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'external_transaction_id' })
  externalTransactionId: string;

  @Column({ type: 'varchar', length: 100, name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: WalletTransactionType, name: 'transaction_type' })
  transactionType: WalletTransactionType;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'enum', enum: WalletTransactionStatus, default: WalletTransactionStatus.PENDING })
  status: WalletTransactionStatus;

  @Column({ type: 'json', nullable: true, name: 'bank_info' })
  bankInfo: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date;

  @UpdateDateColumn({ name: 'synced_at' })
  syncedAt: Date;

  @OneToMany(() => WalletActionAudit, (audit) => audit.walletTransaction, { onDelete: 'CASCADE' })
  actionAudits: WalletActionAudit[];
}