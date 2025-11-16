import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsNotEmpty()
  @IsString()
  listingId: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsNotEmpty()
  @IsString()
  sellerId: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002' })
  @IsNotEmpty()
  @IsString()
  buyerId: string;

  @ApiProperty({ example: 5.5, description: 'CO2 amount in kg' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 50000, description: 'Price per kg in VND' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerKg: number;

  @ApiProperty({ example: 275000, description: 'Total price in VND' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ enum: TransactionType, default: TransactionType.DIRECT_PURCHASE })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({ example: 'Purchase for company carbon offset' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PurchaseListingDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002' })
  @IsNotEmpty()
  @IsString()
  buyerId: string;

  @ApiProperty({ example: 5.5, description: 'Amount to purchase in kg' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Purchase for Q4 2025 offset' })
  @IsOptional()
  @IsString()
  notes?: string;
}
