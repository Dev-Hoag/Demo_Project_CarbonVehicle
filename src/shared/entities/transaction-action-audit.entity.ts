import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { ManagedTransaction } from './managed-transaction.entity';
import { AdminUser } from './admin-user.entity';

@Entity('transaction_action_audit')
export class TransactionActionAudit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => ManagedTransaction, (t) => t.actionAudits, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'transaction_id' })
  transaction: ManagedTransaction;
  @RelationId((a: TransactionActionAudit) => a.transaction)
  readonly transactionId?: number;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType: string;

  @ManyToOne(() => AdminUser, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'performed_by' })
  performedBy: AdminUser;
  @RelationId((a: TransactionActionAudit) => a.performedBy)
  readonly performedById?: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'old_status' })
  oldStatus: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'new_status' })
  newStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
