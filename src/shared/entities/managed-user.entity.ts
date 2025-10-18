import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserType, ManagedUserStatus, KycStatus } from '../enums/admin.enums';
import { UserActionAudit } from './user-action-audit.entity';

@Entity('managed_user')
export class ManagedUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, name: 'external_user_id' })
  externalUserId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserType, name: 'user_type' })
  userType: UserType;

  @Column({ type: 'enum', enum: ManagedUserStatus, default: ManagedUserStatus.ACTIVE })
  status: ManagedUserStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'full_name' })
  fullName: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING, name: 'kyc_status' })
  kycStatus: KycStatus;

  @Column({ type: 'text', nullable: true, name: 'suspension_reason' })
  suspensionReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'synced_at' })
  syncedAt: Date;

  @OneToMany(() => UserActionAudit, (audit) => audit.managedUser, { onDelete: 'CASCADE' })
  actionAudits: UserActionAudit[];
}