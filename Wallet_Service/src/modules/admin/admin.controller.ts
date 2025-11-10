// src/modules/admin/admin.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  FinancialReportDto,
  TransactionReportDto,
  WalletReportDto,
  ReportQueryDto,
} from './dto/financial-report.dto';

@ApiTags('Admin Reports')
@ApiBearerAuth()
@Controller('api/admin/reports')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('financial')
  @ApiOperation({ summary: 'Báo cáo tài chính tổng quan' })
  @ApiResponse({ status: 200, description: 'Trả về thống kê tài chính tổng quan', type: FinancialReportDto })
  @ApiQuery({ name: 'startDate', required: false, description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Ngày kết thúc (YYYY-MM-DD)' })
  async getFinancialReport(@Query() query: ReportQueryDto): Promise<FinancialReportDto> {
    return this.adminService.getFinancialReport(query);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Báo cáo giao dịch theo thời gian' })
  @ApiResponse({ status: 200, description: 'Trả về thống kê giao dịch theo ngày/tuần/tháng', type: [TransactionReportDto] })
  @ApiQuery({ name: 'startDate', required: false, description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Nhóm theo' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng record trả về (default: 30)' })
  async getTransactionReport(@Query() query: ReportQueryDto): Promise<TransactionReportDto[]> {
    return this.adminService.getTransactionReport(query);
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Báo cáo ví' })
  @ApiResponse({ status: 200, description: 'Trả về thống kê ví và top wallets', type: WalletReportDto })
  async getWalletReport(): Promise<WalletReportDto> {
    return this.adminService.getWalletReport();
  }
}
