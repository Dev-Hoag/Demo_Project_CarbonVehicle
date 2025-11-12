// src/modules/admin/admin.controller.ts

import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  FinancialReportDto,
  TransactionReportDto,
  WalletReportDto,
  ReportQueryDto,
} from './dto/financial-report.dto';
import {
  WalletListQueryDto,
  WalletDetailDto,
  WalletListResponseDto,
} from './dto/wallet-list.dto';
import {
  TransactionListQueryDto,
  TransactionListResponseDto,
} from './dto/transaction-list.dto';

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

  // ============================================
  // 🆕 DETAILED ADMIN ENDPOINTS
  // ============================================

  @Get('wallets/list')
  @ApiOperation({ summary: '📋 Danh sách tất cả wallets với filter, sort, pagination' })
  @ApiResponse({ status: 200, description: 'Danh sách wallets chi tiết', type: WalletListResponseDto })
  async getWalletList(@Query() query: WalletListQueryDto): Promise<WalletListResponseDto> {
    return this.adminService.getWalletList(query);
  }

  @Get('wallets/:userId')
  @ApiOperation({ summary: '🔍 Chi tiết wallet của 1 user cụ thể' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết wallet', type: WalletDetailDto })
  async getWalletDetail(@Param('userId') userId: string): Promise<WalletDetailDto> {
    return this.adminService.getWalletDetail(userId);
  }

  @Get('transactions/list')
  @ApiOperation({ summary: '📜 Danh sách tất cả transactions với filter và pagination' })
  @ApiResponse({ status: 200, description: 'Danh sách transactions chi tiết', type: TransactionListResponseDto })
  async getTransactionList(@Query() query: TransactionListQueryDto): Promise<TransactionListResponseDto> {
    return this.adminService.getTransactionList(query);
  }
}
