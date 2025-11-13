import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedListing } from '../../shared/entities/managed-listing.entity';
import { ListingActionAudit } from '../../shared/entities/listing-action-audit.entity';
import { ListingServiceClient } from '../../shared/services/listing-service-client.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ListingStatus } from '../../shared/enums/admin.enums';
import { FilterListingDto } from '../../shared/dtos/listing-management.dto';

@Injectable()
export class ListingManagementService {
  constructor(
    @InjectRepository(ManagedListing)
    private readonly listingRepo: Repository<ManagedListing>,
    @InjectRepository(ListingActionAudit)
    private readonly actionAuditRepo: Repository<ListingActionAudit>,
    private readonly listingClient: ListingServiceClient,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ========== READ OPERATIONS ==========

  async getAllListings(page: number = 1, limit: number = 10, filters?: FilterListingDto) {
    const query = this.listingRepo.createQueryBuilder('l');

    if (filters?.status) {
      query.where('l.status = :status', { status: filters.status });
    }

    if (filters?.listingType) {
      query.andWhere('l.listingType = :type', { type: filters.listingType });
    }

    if (filters?.ownerId) {
      query.andWhere('l.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    const [data, total] = await query
      .orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getListingById(id: number) {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }
    return listing;
  }

  // ========== WRITE OPERATIONS ==========

  async suspendListing(id: number, adminId: number, reason: string) {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    if (listing.status === ListingStatus.SUSPENDED) {
      throw new BadRequestException('Listing already suspended');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'SUSPEND_LISTING_INITIATED',
      resourceType: 'LISTING',
      resourceId: listing.externalListingId,
      description: `Admin initiated suspend listing: ${reason}`,
      oldValue: { status: listing.status },
      newValue: { action: 'SUSPENDING', reason },
    });

    await this.actionAuditRepo.save({
  listing: { id }, // Changed from listingId to listing relation
  actionType: 'SUSPEND_INITIATED',
  performedBy: { id: adminId },
  reason,
  oldStatus: listing.status,
  newStatus: listing.status,
});

    const result = await this.listingClient.suspendListing(listing.externalListingId, adminId, reason);

    if (!result.success) {
      throw new BadRequestException(`Failed to suspend listing: ${result.error}`);
    }

    return {
      success: true,
      message: 'Listing suspended successfully.',
    };
  }

  async activateListing(id: number, adminId: number, reason: string) {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    if (listing.status !== ListingStatus.SUSPENDED) {
      throw new BadRequestException('Can only activate suspended listings');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'ACTIVATE_LISTING_INITIATED',
      resourceType: 'LISTING',
      resourceId: listing.externalListingId,
      description: `Admin initiated activate listing: ${reason}`,
      oldValue: { status: listing.status },
      newValue: { action: 'ACTIVATING', reason },
    });

    await this.actionAuditRepo.save({
      listing: { id },
      actionType: 'ACTIVATE_INITIATED',
      performedBy: { id: adminId },
      reason,
      oldStatus: listing.status,
      newStatus: listing.status,
    });

    const result = await this.listingClient.activateListing(listing.externalListingId, adminId, reason);

    if (!result.success) {
      throw new BadRequestException(`Failed to activate listing: ${result.error}`);
    }

    return {
      success: true,
      message: 'Listing activated successfully.',
    };
  }

  async flagListing(id: number, adminId: number, flagType: string, reason: string) {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'FLAG_LISTING',
      resourceType: 'LISTING',
      resourceId: listing.externalListingId,
      description: `Admin flagged listing: ${reason}`,
      oldValue: { flagType: listing.flagType },
      newValue: { flagType, reason },
    });

    const result = await this.listingClient.flagListing(listing.externalListingId, adminId, flagType, reason);

    if (!result.success) {
      throw new BadRequestException(`Failed to flag listing: ${result.error}`);
    }

    return {
      success: true,
      message: 'Listing flagged successfully.',
    };
  }

  async unflagListing(id: number, adminId: number, reason: string) {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'UNFLAG_LISTING',
      resourceType: 'LISTING',
      resourceId: listing.externalListingId,
      description: `Admin unflagged listing: ${reason}`,
      oldValue: { flagType: listing.flagType },
      newValue: { flagType: null, reason },
    });

    const result = await this.listingClient.unflagListing(listing.externalListingId, adminId, reason);

    if (!result.success) {
      throw new BadRequestException(`Failed to unflag listing: ${result.error}`);
    }

    return {
      success: true,
      message: 'Listing unflagged successfully.',
    };
  }

  // ========== EVENT HANDLERS ==========

  async handleListingSuspended(event: { listingId: string; status: ListingStatus; suspensionReason: string }) {
    await this.listingRepo.update(
      { externalListingId: event.listingId },
      { status: event.status, suspensionReason: event.suspensionReason },
    );
  }

  async handleListingActivated(event: { listingId: string; status: ListingStatus }) {
   await this.listingRepo.update(
  { externalListingId: event.listingId },
  { status: event.status, suspensionReason: '' }, // Changed null to empty string
);
  }

  async handleListingFlagged(event: { listingId: string; flagType: string; flagReason: string }) {
    await this.listingRepo.update(
      { externalListingId: event.listingId },
      { flagType: event.flagType, flagReason: event.flagReason },
    );
  }

  async handleListingUnflagged(event: { listingId: string }) {
   await this.listingRepo.update(
  { externalListingId: event.listingId },
  { flagType: '', flagReason: '' }, // Changed null to empty string
);
  }
}