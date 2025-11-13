import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { OverrideRequestStatus } from '../enums/admin.enums';
import { AdminUser } from './admin-user.entity';

@Entity('override_request')
export class OverrideRequest {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, name: 'request_type' })
  requestType: string;

  @Column({ type: 'varchar', length: 100, name: 'target_type' })
  targetType: string;

  @Column({ type: 'varchar', length: 100, name: 'target_id' })
  targetId: string;

  // ❌ Bỏ requesterId/approverId @Column (số)
  @ManyToOne(() => AdminUser, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'requester_id' })
  requester: AdminUser;
  @RelationId((r: OverrideRequest) => r.requester)
  readonly requesterId?: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: OverrideRequestStatus, default: OverrideRequestStatus.PENDING })
  status: OverrideRequestStatus;

  @ManyToOne(() => AdminUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: AdminUser | null;
  @RelationId((r: OverrideRequest) => r.approver)
  readonly approverId?: number;

  @Column({ type: 'json', nullable: true })
  payload: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'result_message' })
  resultMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;
}
