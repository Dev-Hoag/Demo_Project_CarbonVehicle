// src/shared/dtos/transaction-management.dto.ts (with ApiProperty for Swagger)
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { TransactionType, TransactionStatus } from '../enums/admin.enums';

export class FilterTransactionDto {
  @ApiProperty({ enum: TransactionStatus, required: false, description: 'Filter by status' })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty({ enum: TransactionType, required: false, description: 'Filter by type' })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @ApiProperty({ required: false, description: 'Filter by seller ID' })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({ required: false, description: 'Filter by buyer ID' })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiProperty({ required: false, description: 'From date (ISO format)', example: '2023-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, description: 'To date (ISO format)', example: '2023-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class ConfirmTransactionDto {
  @ApiProperty({ description: 'Reason for confirmation', example: 'Verified by admin' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class CancelTransactionDto {
  @ApiProperty({ description: 'Reason for cancellation', example: 'User request' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RefundTransactionDto {
  @ApiProperty({ description: 'Reason for refund', example: 'Dispute resolved' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: TransactionStatus, description: 'Resolution status (e.g., REFUNDED, COMPLETED)' })
  @IsEnum(TransactionStatus)
  resolution!: TransactionStatus;

  @ApiProperty({ description: 'Reason for resolution', example: 'Buyer complaint valid' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id!: number;

  @ApiProperty({ description: 'External transaction ID', nullable: true })
  externalTransactionId: string | null;

  @ApiProperty({ description: 'Seller ID', nullable: true })
  sellerId: string | null;

  @ApiProperty({ description: 'Buyer ID', nullable: true })
  buyerId: string | null;

  @ApiProperty({ description: 'Amount' })
  amount!: number;

  @ApiProperty({ description: 'Credits amount' })
  creditsAmount!: number;

  @ApiProperty({ enum: TransactionType })
  transactionType!: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  status!: TransactionStatus;

  @ApiProperty({ description: 'Dispute reason', nullable: true })
  disputeReason: string | null;

  @ApiProperty({ description: 'Is disputed' })
  isDisputed!: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Completed at', nullable: true })
  completedAt: Date | null;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data!: TransactionResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Limit per page' })
  limit!: number;
}