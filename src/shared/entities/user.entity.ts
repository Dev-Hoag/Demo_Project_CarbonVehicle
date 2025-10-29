import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserType, UserStatus, KycStatus } from '../enums/user.enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserType, name: 'user_type' })
  userType: UserType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING, name: 'status' })
  status: UserStatus;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING, name: 'kyc_status' })
  kycStatus: KycStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

 
  @Column({ type: 'tinyint', width: 1, default: 0, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'verification_token' })
  verificationToken: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'verification_token_expires' })
  verificationTokenExpires: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'reset_token' })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reset_token_expires' })
  resetTokenExpires: Date | null;
  // 👇 THÊM CÁC FIELDS NÀY
  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ nullable: true })
  lockedBy: number; // Admin ID

  @Column({ type: 'text', nullable: true })
  lockReason: string;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ nullable: true })
  suspendedBy: number;

  @Column({ type: 'text', nullable: true })
  suspendReason: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // Soft delete

  @Column({ nullable: true })
  deletedBy: number;

  @Column({ type: 'text', nullable: true })
  deleteReason: string;
}
