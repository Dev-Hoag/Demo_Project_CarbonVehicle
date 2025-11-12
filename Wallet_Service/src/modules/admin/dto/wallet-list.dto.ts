// src/modules/admin/dto/wallet-list.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { WalletStatus } from '../../../shared/enums';

export class WalletListQueryDto {
  @ApiPropertyOptional({ description: 'Tìm kiếm theo userId hoặc email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WalletStatus, description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ description: 'Số dư tối thiểu' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBalance?: number;

  @ApiPropertyOptional({ description: 'Số dư tối đa' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBalance?: number;

  @ApiPropertyOptional({ description: 'Trang hiện tại', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số item mỗi trang', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['balance', 'locked_balance', 'created_at'], description: 'Sắp xếp theo' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Thứ tự sắp xếp' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class WalletDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  lockedBalance: number;

  @ApiProperty()
  availableBalance: number;

  @ApiProperty({ enum: WalletStatus })
  status: WalletStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Tổng số giao dịch' })
  totalTransactions: number;

  @ApiProperty({ description: 'Tổng nạp tiền' })
  totalDeposited: number;

  @ApiProperty({ description: 'Tổng rút tiền' })
  totalWithdrawn: number;

  @ApiProperty({ description: 'Giao dịch gần nhất' })
  lastTransaction?: {
    id: string;
    type: string;
    amount: number;
    createdAt: Date;
  };
}

export class WalletListResponseDto {
  @ApiProperty({ type: [WalletDetailDto] })
  items: WalletDetailDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
