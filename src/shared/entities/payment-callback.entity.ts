import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';

export enum CallbackType {
  RETURN_URL = 'RETURN_URL',
  IPN = 'IPN',
  WEBHOOK = 'WEBHOOK',
}

@Entity('payment_callbacks')
@Index(['paymentId'])
@Index(['paymentCode'])
export class PaymentCallback {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  paymentId: number;

  @Column({ type: 'varchar', length: 64 })
  paymentCode: string;

  @Column({ type: 'enum', enum: CallbackType, default: CallbackType.IPN })
  callbackType: CallbackType;

  @Column({ type: 'json' })
  payload: any;

  @Column({ type: 'text', nullable: true })
  rawQuery: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  signature: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isValid: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  validationError: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isProcessed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  processingError: string;

  @CreateDateColumn()
  receivedAt: Date;

  @ManyToOne(() => Payment, (payment) => payment.callbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;
}
