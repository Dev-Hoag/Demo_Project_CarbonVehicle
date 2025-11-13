import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportFilterDto } from '../../shared/dtos/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('api/admin/reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Dashboard summary', 
    description: 'Tổng quan hệ thống (từ MetricDaily nếu có, fallback real-time nếu chưa có data)' 
  })
  @ApiResponse({ status: 200, description: 'Dashboard summary data' })
  async getDashboardSummary() {
    return this.service.getDashboardSummary();
  }

  @Get('transaction-trend')
  @ApiOperation({ 
    summary: 'Transaction trend', 
    description: 'Xu hướng giao dịch theo ngày (từ MetricDaily)' 
  })
  @ApiResponse({ status: 200, description: 'Array of daily transaction counts' })
  async getTransactionTrend(@Query() filter: ReportFilterDto) {
    return this.service.getTransactionTrend(filter);
  }

  @Get('user-growth')
  @ApiOperation({ 
    summary: 'User growth', 
    description: 'Tăng trưởng người dùng theo thời gian (từ MetricDaily)' 
  })
  @ApiResponse({ status: 200, description: 'Array of daily user counts' })
  async getUserGrowth(@Query() filter: ReportFilterDto) {
    return this.service.getUserGrowth(filter);
  }

  @Get('co2-impact')
  @ApiOperation({ 
    summary: 'CO2 impact report', 
    description: 'Báo cáo tác động môi trường (từ MetricDaily)' 
  })
  @ApiResponse({ status: 200, description: 'CO2 reduction and credits data' })
  async getCo2ImpactReport(@Query() filter: ReportFilterDto) {
    return this.service.getCo2ImpactReport(filter);
  }

  @Get('revenue')
  @ApiOperation({ 
    summary: 'Revenue report', 
    description: 'Báo cáo doanh thu và phí (từ MetricDaily)' 
  })
  @ApiResponse({ status: 200, description: 'Revenue and fee data' })
  async getRevenueReport(@Query() filter: ReportFilterDto) {
    return this.service.getRevenueReport(filter);
  }

  @Get('admin-actions')
  @ApiOperation({ 
    summary: 'Admin action summary', 
    description: 'Thống kê hành động admin (từ AuditLog)' 
  })
  @ApiResponse({ status: 200, description: 'Admin action statistics' })
  async getAdminActionSummary(@Query() filter: ReportFilterDto) {
    return this.service.getAdminActionSummary(filter);
  }
}