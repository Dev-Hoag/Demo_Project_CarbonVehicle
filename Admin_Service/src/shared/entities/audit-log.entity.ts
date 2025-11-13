import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, RelationId
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => AdminUser, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'admin_user_id' }) // <-- map đúng tên cột trong DB
  adminUser: AdminUser | null;

  // Không tạo cột mới; chỉ để đọc id của quan hệ
  @RelationId((log: AuditLog) => log.adminUser)
  readonly adminUserId?: number;

  @Column({ type: 'varchar', length: 200, name: 'action_name' })
  actionName: string;

  @Column({ type: 'varchar', length: 100, name: 'resource_type' })
  resourceType: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'resource_id' })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true, name: 'old_value' })
  oldValue: Record<string, any>;

  @Column({ type: 'json', nullable: true, name: 'new_value' })
  newValue: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'trace_id' })
  traceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
