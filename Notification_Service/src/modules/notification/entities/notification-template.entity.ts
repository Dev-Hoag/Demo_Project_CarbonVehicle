import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  code: string;

  @Column({ name: 'event_type', length: 100 })
  eventType: string;

  @Column({ name: 'title_template', length: 255, nullable: true })
  title: string;

  @Column({ name: 'content_template', type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] })
  channel: string;

  @Column({ type: 'json', nullable: true })
  variables: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
