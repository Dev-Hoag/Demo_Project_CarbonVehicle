import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportPeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

export class ReportFilterDto {
  @ApiPropertyOptional({ enum: ReportPeriod, default: ReportPeriod.LAST_7_DAYS })
  @IsEnum(ReportPeriod)
  @IsOptional()
  period?: ReportPeriod = ReportPeriod.LAST_7_DAYS;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

// Response DTOs
export interface DashboardSummaryDto {
  overview: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    evOwners: number;
    buyers: number;
    verifiers: number;
  };
  credits: {
    totalIssued: number;
    totalTraded: number;
    totalCo2Reduced: number;
  };
  financial: {
    totalRevenue: number;
    totalFeeCollected: number;
    totalTransactions: number;
  };
  timestamp: string;
}

export interface TrendDataDto {
  date: string;
  value: number;
  label?: string;
}
