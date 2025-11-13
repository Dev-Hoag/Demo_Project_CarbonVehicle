import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { ManagedListing } from './managed-listing.entity';
import { AdminUser } from './admin-user.entity';

@Entity('listing_action_audit')
export class ListingActionAudit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // ❌ Bỏ @Column listingId / performedBy (số)
  @ManyToOne(() => ManagedListing, (l) => l.actionAudits, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'listing_id' })
  listing: ManagedListing;
  @RelationId((a: ListingActionAudit) => a.listing)
  readonly listingId?: number;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType: string;

  @ManyToOne(() => AdminUser, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'performed_by' })
  performedBy: AdminUser;
  @RelationId((a: ListingActionAudit) => a.performedBy)
  readonly performedById?: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'old_status' })
  oldStatus: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'new_status' })
  newStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
