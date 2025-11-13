import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum UserActionType {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  SUSPENDED = 'SUSPENDED',
  ACTIVATED = 'ACTIVATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  SOFT_DELETED = 'SOFT_DELETED',
}

@Entity('user_action_logs')
export class UserActionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: UserActionType,
  })
  actionType: UserActionType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'int', nullable: true })
  performedBy: number;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;
}