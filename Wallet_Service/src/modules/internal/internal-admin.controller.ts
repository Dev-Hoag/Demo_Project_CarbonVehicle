// src/modules/internal/internal-admin.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';
import { InternalApiGuard } from '../../shared/guards/internal-api.guard';
import {
  TransactionListQueryDto,
  TransactionListResponseDto,
} from '../admin/dto/transaction-list.dto';

/**
 * Internal Admin endpoints for other services (Admin_Service) to query wallet data
 * Uses InternalApiGuard instead of JwtAuthGuard
 */
@ApiTags('internal-admin')
@ApiSecurity('internal-api-key')
@UseGuards(InternalApiGuard)
@Controller('internal/admin')
export class InternalAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('transactions')
  @ApiOperation({ summary: '[Internal] Get transaction list for admin dashboard' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  async getTransactions(@Query() query: TransactionListQueryDto): Promise<TransactionListResponseDto> {
    return this.adminService.getTransactionList(query);
  }
}
