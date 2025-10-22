import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ListingManagementService } from './listing-management.service';
import { ListingManagementController } from './listing-management.controller';
import { ManagedListing } from '../../shared/entities/managed-listing.entity';
import { ListingActionAudit } from '../../shared/entities/listing-action-audit.entity';
import { ListingServiceClient } from '../../shared/services/listing-service-client.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManagedListing, ListingActionAudit]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    AuditLogModule,
  ],
  controllers: [ListingManagementController],
  providers: [ListingManagementService, ListingServiceClient],
  exports: [ListingManagementService],
})
export class ListingManagementModule {}