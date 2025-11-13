import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { ConfigType } from '../enums/admin.enums';
import { AdminUser } from './admin-user.entity';

@Entity('admin_config')
export class AdminConfig {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'config_key' })
  configKey: string;

  @Column({ type: 'varchar', length: 1000, name: 'config_value' })
  configValue: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ConfigType, default: ConfigType.STRING, name: 'config_type' })
  configType: ConfigType;

  // ❌ BỎ @Column updatedBy (trước là số)
  @ManyToOne(() => AdminUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  admin: AdminUser | null;

  // Read-only id nếu cần
  @RelationId((cfg: AdminConfig) => cfg.admin)
  readonly updatedBy?: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
