import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { ManagedWalletTransaction } from './managed-wallet-transaction.entity';
import { AdminUser } from './admin-user.entity';

@Entity('wallet_action_audit')
export class WalletActionAudit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => ManagedWalletTransaction, (w) => w.actionAudits, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'wallet_transaction_id' })
  walletTransaction: ManagedWalletTransaction;
  @RelationId((a: WalletActionAudit) => a.walletTransaction)
  readonly walletTransactionId?: number;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType: string;

  @ManyToOne(() => AdminUser, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'performed_by' })
  performedBy: AdminUser;
  @RelationId((a: WalletActionAudit) => a.performedBy)
  readonly performedById?: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, name: 'amount_before' })
  amountBefore: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, name: 'amount_after' })
  amountAfter: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
