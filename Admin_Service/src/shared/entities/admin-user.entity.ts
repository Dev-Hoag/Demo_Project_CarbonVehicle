// src/shared/entities/admin-user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AdminUserStatus } from '../enums/admin.enums';
import { AuditLog } from './audit-log.entity';

@Entity('admin_user')
export class AdminUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // 👇 THAY ĐỔI: ẩn cột password
  @Column({ type: 'varchar', length: 255, name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'boolean', default: true, name: 'is_super_admin' })
  isSuperAdmin: boolean;

  @Column({
    type: 'enum',
    enum: AdminUserStatus,
    default: AdminUserStatus.ACTIVE,
  })
  status: AdminUserStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AuditLog, (log) => log.adminUser, { onDelete: 'SET NULL' })
  auditLogs: AuditLog[];
}
