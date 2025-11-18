import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletTransactionStatus, WalletTransactionType } from '../enums/admin.enums';

export class FilterWalletTransactionDto {
  @ApiPropertyOptional({ example: 'user-123' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: WalletTransactionStatus })
  @IsEnum(WalletTransactionStatus)
  @IsOptional()
  status?: WalletTransactionStatus;

  @ApiPropertyOptional({ example: 'DEPOSIT' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'DEPOSIT' })
  @IsString()
  @IsOptional()
  transactionType?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  toDate?: string;
}

export class ReverseWalletTransactionDto {
  @ApiProperty({ example: 'Fraud detected' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ConfirmWalletTransactionDto {
  @ApiProperty({ example: 'Verified by admin' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AdjustBalanceDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 100.5, description: 'Amount to adjust (positive or negative)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Manual adjustment for refund' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}