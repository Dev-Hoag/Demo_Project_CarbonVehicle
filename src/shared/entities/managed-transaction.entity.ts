import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TransactionType, TransactionStatus } from '../enums/admin.enums';
import { TransactionActionAudit } from './transaction-action-audit.entity';

@Entity('managed_transaction')
export class ManagedTransaction {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, name: 'external_transaction_id' })
  externalTransactionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'buyer_id' })
  buyerId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true, name: 'credits_amount' })
  creditsAmount: number;

  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.FIXED_PRICE, name: 'transaction_type' })
  transactionType: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true, name: 'dispute_reason' })
  disputeReason: string;

  @Column({ type: 'boolean', default: false, name: 'is_disputed' })
  isDisputed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'synced_at' })
  syncedAt: Date;

  @OneToMany(() => TransactionActionAudit, (audit) => audit.transaction, { onDelete: 'CASCADE' })
  actionAudits: TransactionActionAudit[];
}