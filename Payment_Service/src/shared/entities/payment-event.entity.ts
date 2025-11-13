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

@Entity('payment_events')
@Index(['paymentId'])
@Index(['eventType'])
export class PaymentEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  paymentId: number;

  @Column({ type: 'varchar', length: 64 })
  paymentCode: string;

  @Column({ type: 'varchar', length: 50 })
  eventType: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  eventSource: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fromStatus: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  toStatus: string;

  @Column({ type: 'json', nullable: true })
  details: any;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  triggeredBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Payment, (payment) => payment.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;
}