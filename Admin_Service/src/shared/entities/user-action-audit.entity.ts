import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, RelationId
} from 'typeorm';
import { ManagedUser } from './managed-user.entity';
import { AdminUser } from './admin-user.entity';

@Entity('user_action_audit')
export class UserActionAudit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => ManagedUser, (user) => user.actionAudits, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'managed_user_id' }) // <-- trùng cột DB
  managedUser: ManagedUser;

  @RelationId((ua: UserActionAudit) => ua.managedUser)
  readonly managedUserId?: number;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType: string;

  @ManyToOne(() => AdminUser, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'performed_by' })   // <-- trùng cột DB
  performedBy: AdminUser;

  @RelationId((ua: UserActionAudit) => ua.performedBy)
  readonly performedById?: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
