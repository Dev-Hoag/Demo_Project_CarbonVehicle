import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ManagedListing } from '../../shared/entities/managed-listing.entity';
import { ListingActionAudit } from '../../shared/entities/listing-action-audit.entity';
import { ListingServiceClient } from '../../shared/services/listing-service-client.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ListingStatus } from '../../shared/enums/admin.enums';
import { FilterListingDto } from '../../shared/dtos/listing-management.dto';

@Injectable()
export class ListingManagementService {
  private readonly logger = new Logger(ListingManagementService.name);

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
    // Query from Listing_Service instead of local ManagedListing table
    const result = await this.listingClient.getListings(page, limit, {
      sellerId: filters?.ownerId,
      status: filters?.status,
      listingType: filters?.listingType,
    });

    if (!result.success) {
      this.logger.error(`Failed to fetch listings: ${result.error}`);
      // Fallback to empty result instead of throwing error
      return { data: [], total: 0, page, limit };
    }

    // Handle Spring Boot Page response structure
    const responseData = result.data?.data || result.data;
    const listings = responseData?.content || responseData || [];
    const total = responseData?.totalElements || listings.length;

    // Get admin overrides from local DB
    const externalIds = listings.map((l: any) => l.id);
    const managedListings = await this.listingRepo.find({
      where: externalIds.length > 0 ? { externalListingId: In(externalIds) } : {},
    });

    // Create lookup map for admin overrides
    const managedMap = new Map();
    managedListings.forEach(m => {
      managedMap.set(m.externalListingId, m);
    });

    // Map Listing_Service response + merge admin overrides
    const mappedData = listings.map((listing: any) => {
      const managed = managedMap.get(listing.id);
      
      return {
        id: listing.id,
        externalListingId: listing.id,
        ownerId: listing.sellerId,
        amount: parseFloat(listing.availableAmount ?? listing.co2Amount ?? 0),
        pricePerKg: parseFloat(listing.pricePerKg ?? listing.price ?? 0),
        listingType: listing.listingType || listing.type,
        status: managed?.status || listing.status, // Admin override takes precedence
        flag: managed?.flagType || null, // Admin flags
        flagReason: managed?.flagReason || null,
        suspensionReason: managed?.suspensionReason || null,
        title: listing.title,
        description: listing.description,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      };
    });

    return { data: mappedData, total, page, limit };
  }

  async getListingById(id: string) {
    // Query from Listing_Service
    const result = await this.listingClient.getListingById(id);
    
    if (!result.success) {
      throw new BadRequestException('Listing not found');
    }

    const listing = result.data?.data || result.data;
    
    // Map to admin format
    return {
      id: listing.id,
      externalListingId: listing.id,
      ownerId: listing.sellerId,
      amount: parseFloat(listing.availableAmount ?? listing.co2Amount ?? 0),
      pricePerKg: parseFloat(listing.pricePerKg ?? listing.price ?? 0),
      listingType: listing.listingType || listing.type,
      status: listing.status,
      flag: listing.flag || null,
      flagReason: listing.flagReason || null,
      title: listing.title,
      description: listing.description,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  // ========== WRITE OPERATIONS ==========

  async suspendListing(id: string, adminId: number, reason: string) {
    // Find or create managed listing record
    let managedListing = await this.listingRepo.findOne({ 
      where: { externalListingId: id } 
    });

    if (!managedListing) {
      // Create new managed listing record
      managedListing = this.listingRepo.create({
        externalListingId: id,
        status: ListingStatus.SUSPENDED,
        suspensionReason: reason,
      });
    } else {
      managedListing.status = ListingStatus.SUSPENDED;
      managedListing.suspensionReason = reason;
    }

    await this.listingRepo.save(managedListing);

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'SUSPEND_LISTING',
      resourceType: 'LISTING',
      resourceId: id,
      description: `Admin suspended listing: ${reason}`,
      oldValue: undefined,
      newValue: { status: 'SUSPENDED', reason },
    });

    return {
      success: true,
      message: 'Listing suspended successfully.',
    };
  }

  async activateListing(id: string, adminId: number, reason: string) {
    let managedListing = await this.listingRepo.findOne({ 
      where: { externalListingId: id } 
    });

    if (!managedListing) {
      managedListing = this.listingRepo.create({
        externalListingId: id,
        status: ListingStatus.ACTIVE,
      });
    } else {
      managedListing.status = ListingStatus.ACTIVE;
      managedListing.suspensionReason = '';
    }

    await this.listingRepo.save(managedListing);

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'ACTIVATE_LISTING',
      resourceType: 'LISTING',
      resourceId: id,
      description: `Admin activated listing: ${reason}`,
      oldValue: undefined,
      newValue: { status: 'ACTIVE', reason },
    });

    return {
      success: true,
      message: 'Listing activated successfully.',
    };
  }

  async flagListing(id: string, adminId: number, flagType: string, reason: string) {
    let managedListing = await this.listingRepo.findOne({ 
      where: { externalListingId: id } 
    });

    if (!managedListing) {
      managedListing = this.listingRepo.create({
        externalListingId: id,
        flagType: flagType,
        flagReason: reason,
      });
    } else {
      managedListing.flagType = flagType;
      managedListing.flagReason = reason;
    }

    await this.listingRepo.save(managedListing);

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'FLAG_LISTING',
      resourceType: 'LISTING',
      resourceId: id,
      description: `Admin flagged listing: ${reason}`,
      oldValue: undefined,
      newValue: { flagType, reason },
    });

    return {
      success: true,
      message: 'Listing flagged successfully.',
    };
  }

  async unflagListing(id: string, adminId: number, reason: string) {
    let managedListing = await this.listingRepo.findOne({ 
      where: { externalListingId: id } 
    });

    if (managedListing) {
      managedListing.flagType = '';
      managedListing.flagReason = '';
      await this.listingRepo.save(managedListing);
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'UNFLAG_LISTING',
      resourceType: 'LISTING',
      resourceId: id,
      description: `Admin unflagged listing: ${reason}`,
      oldValue: undefined,
      newValue: { flagType: null, reason },
    });

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