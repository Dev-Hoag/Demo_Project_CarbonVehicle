import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('outbox') // trùng tên bảng bạn đã tạo
export class Outbox {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 50 })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 100 })
  aggregateId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  // MySQL 8: dùng type 'json'
  @Column({ name: 'payload', type: 'json' })
  payload: Record<string, any>;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 100, unique: true, nullable: true })
  idempotencyKey?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;
}
