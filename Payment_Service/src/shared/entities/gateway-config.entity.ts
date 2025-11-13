import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GatewayEnvironment {
  SANDBOX = 'SANDBOX',
  PRODUCTION = 'PRODUCTION',
}

@Entity('gateway_configs')
export class GatewayConfig {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  gateway: string;

  @Column({
    type: 'enum',
    enum: GatewayEnvironment,
    default: GatewayEnvironment.SANDBOX,
  })
  environment: GatewayEnvironment;

  @Column({ type: 'text', nullable: true })
  apiKey: string;

  @Column({ type: 'text', nullable: true })
  secretKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  webhookUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  returnUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipnUrl: string;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  enabled: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxAmount: number;

  @Column({ type: 'int', nullable: true, default: 100 })
  rateLimit: number;

  @Column({ type: 'json', nullable: true })
  config: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}