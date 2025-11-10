// src/shared/dtos/wallet.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { WalletStatus } from '../enums';

export class CreateDepositDto {
  @ApiProperty({ description: 'Amount to deposit', example: 500000 })
  @IsNumber()
  @Min(10000, { message: 'Minimum deposit is 10,000 VND' })
  amount: number;

  @ApiPropertyOptional({ description: 'Payment method', example: 'VNPAY' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Return URL after payment' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Amount to withdraw', example: 200000 })
  @IsNumber()
  @Min(50000, { message: 'Minimum withdrawal is 50,000 VND' })
  amount: number;

  @ApiProperty({ description: 'Bank account name', example: 'NGUYEN VAN A' })
  @IsString()
  bankAccountName: string;

  @ApiProperty({ description: 'Bank account number', example: '0123456789' })
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({ description: 'Bank name', example: 'Vietcombank' })
  @IsString()
  bankName: string;

  @ApiPropertyOptional({ description: 'Bank branch', example: 'HCM Branch' })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReserveFundsDto {
  @ApiProperty({ description: 'User ID', example: 'mock-user-id' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Transaction ID', example: 'txn-123' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Amount to reserve', example: 100000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Expiration minutes', example: 30, default: 30 })
  @IsOptional()
  @IsNumber()
  expirationMinutes?: number;
}

export class ReleaseFundsDto {
  @ApiProperty({ description: 'Transaction ID', example: 'txn-123' })
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Reason for release' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SettleFundsDto {
  @ApiProperty({ description: 'Transaction ID from Transaction Service' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Buyer User ID' })
  @IsString()
  buyerId: string;

  @ApiProperty({ description: 'Seller User ID' })
  @IsString()
  sellerId: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Platform fee amount', default: 0 })
  @IsOptional()
  @IsNumber()
  platformFee?: number;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'Payment ID from Payment Service' })
  @IsString()
  paymentId: string;

  @ApiProperty({ description: 'User ID to refund' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Refund amount' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Refund reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}
