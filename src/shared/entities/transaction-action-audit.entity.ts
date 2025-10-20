import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ManagedTransaction } from './managed-transaction.entity';
import { AdminUser } from './admin-user.entity';

@Entity('transaction_action_audit')
export class TransactionActionAudit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'transaction_id', type: 'bigint' })
  transactionId: number;

  @ManyToOne(() => ManagedTransaction, (t) => t.actionAudits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: ManagedTransaction;

  @Column({ name: 'performed_by', type: 'bigint' })
  performedById: number;

  @ManyToOne(() => AdminUser, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'performed_by' })
  performedBy: AdminUser;

  @Column({ name: 'action_type', type: 'varchar', length: 50 })
  actionType: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'old_status', type: 'varchar', length: 50, nullable: true })
  oldStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 50, nullable: true })
  newStatus: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
