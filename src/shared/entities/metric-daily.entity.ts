import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('metric_daily')
export class MetricDaily {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'date', unique: true, name: 'metric_date' })
  metricDate: string;

  @Column({ type: 'int', default: 0, name: 'total_users' })
  totalUsers: number;

  @Column({ type: 'int', default: 0, name: 'total_ev_owners' })
  totalEvOwners: number;

  @Column({ type: 'int', default: 0, name: 'total_buyers' })
  totalBuyers: number;

  @Column({ type: 'int', default: 0, name: 'total_verifiers' })
  totalVerifiers: number;

  @Column({ type: 'int', default: 0, name: 'total_active_users' })
  totalActiveUsers: number;

  @Column({ type: 'int', default: 0, name: 'total_suspended_users' })
  totalSuspendedUsers: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0, name: 'total_credits_issued' })
  totalCreditsIssued: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0, name: 'total_credits_traded' })
  totalCreditsTraded: number;

  @Column({ type: 'int', default: 0, name: 'total_transactions' })
  totalTransactions: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, name: 'total_revenue' })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0, name: 'total_co2_reduced' })
  totalCo2Reduced: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, name: 'total_fee_collected' })
  totalFeeCollected: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}