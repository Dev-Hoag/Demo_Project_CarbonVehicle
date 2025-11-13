import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ListingType, ListingStatus } from '../enums/admin.enums';
import { ListingActionAudit } from './listing-action-audit.entity';

@Entity('managed_listing')
export class ManagedListing {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, name: 'external_listing_id' })
  externalListingId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true, name: 'credits_amount' })
  creditsAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, name: 'price_per_credit' })
  pricePerCredit: number;

  @Column({ type: 'enum', enum: ListingType, default: ListingType.FIXED_PRICE, name: 'listing_type' })
  listingType: ListingType;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.ACTIVE })
  status: ListingStatus;

  @Column({ type: 'text', nullable: true, name: 'suspension_reason' })
  suspensionReason: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'flag_type' })
  flagType: string;

  @Column({ type: 'text', nullable: true, name: 'flag_reason' })
  flagReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'synced_at' })
  syncedAt: Date;

  @OneToMany(() => ListingActionAudit, (audit) => audit.listing, { onDelete: 'CASCADE' })
  actionAudits: ListingActionAudit[];
}