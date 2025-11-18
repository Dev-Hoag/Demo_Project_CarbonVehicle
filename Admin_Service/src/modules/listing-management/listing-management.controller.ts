import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ListingManagementService } from './listing-management.service';
import {
  FilterListingDto,
  SuspendListingDto,
  ActivateListingDto,
  FlagListingDto,
  UnflagListingDto,
} from '../../shared/dtos/listing-management.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Listings')
@ApiBearerAuth()
@Controller('api/admin/listings')
@UseGuards(JwtAuthGuard)
export class ListingManagementController {
  constructor(private readonly service: ListingManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List listings', description: 'Lấy danh sách listing' })
  @ApiResponse({ status: 200, description: 'List of listings' })
  async getAllListings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('listingType') listingType?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    // Convert to numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    
    // Build filters object
    const filters: any = {};
    if (status) filters.status = status;
    if (listingType) filters.listingType = listingType;
    if (ownerId) filters.ownerId = ownerId;
    
    return this.service.getAllListings(pageNum, limitNum, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingById(@Param('id') id: string) {
    return this.service.getListingById(id);
  }

  @Post(':id/suspend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Suspend listing', description: 'Tạm ngưng listing' })
  @ApiResponse({ status: 200, description: 'Suspend command sent' })
  @ApiResponse({ status: 400, description: 'Cannot suspend listing' })
  async suspendListing(
    @Param('id') id: string,
    @Body() dto: SuspendListingDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.suspendListing(id, admin.id, dto.reason);
  }

  @Post(':id/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate listing', description: 'Kích hoạt lại listing đã bị suspend' })
  @ApiResponse({ status: 200, description: 'Activate command sent' })
  async activateListing(
    @Param('id') id: string,
    @Body() dto: ActivateListingDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.activateListing(id, admin.id, dto.reason);
  }

  @Post(':id/flag')
  @HttpCode(200)
  @ApiOperation({ summary: 'Flag listing', description: 'Đánh dấu listing có vấn đề' })
  @ApiResponse({ status: 200, description: 'Flag command sent' })
  async flagListing(@Param('id') id: string, @Body() dto: FlagListingDto, @CurrentUser() admin: any) {
    return this.service.flagListing(id, admin.id, dto.flagType, dto.reason);
  }

  @Post(':id/unflag')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unflag listing', description: 'Bỏ cờ đánh dấu' })
  @ApiResponse({ status: 200, description: 'Unflag command sent' })
  async unflagListing(
    @Param('id') id: string,
    @Body() dto: UnflagListingDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.unflagListing(id, admin.id, dto.reason);
  }
}