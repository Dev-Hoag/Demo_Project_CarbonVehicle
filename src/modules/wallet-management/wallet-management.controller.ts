import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { WalletManagementService } from './wallet-management.service';
import { FilterWalletTransactionDto } from '../../shared/dtos/wallet-management.dto';

// ===== Extra DTOs for Controller layer =====

class ReverseWalletDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

class ConfirmWalletDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

class AdjustBalanceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

class WalletListQueryDto extends FilterWalletTransactionDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}

@ApiTags('Admin · Wallet Transactions')
@ApiBearerAuth()
@Controller('/api/admin/wallet-transactions')
export class WalletManagementController {
  constructor(private readonly service: WalletManagementService) {}

  // GET /api/admin/wallet-transactions?page=&limit=&userId=&status=&transactionType=&fromDate=&toDate=
  @Get()
  @ApiOperation({ summary: 'List wallet transactions' })
  @ApiOkResponse({ description: 'List of wallet transactions' })
  async getAll(@Query() q: WalletListQueryDto) {
    const { page = 1, limit = 10, ...filters } = q;
    return this.service.getAllWalletTransactions(page, limit, filters);
  }

  // GET /api/admin/wallet-transactions/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get wallet transaction by ID' })
  @ApiOkResponse({ description: 'Wallet transaction details' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getWalletTransactionById(id);
  }

  // POST /api/admin/wallet-transactions/:id/reverse
  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse wallet transaction' })
  @ApiOkResponse({ description: 'Reverse requested' })
  async reverse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReverseWalletDto,
    @Req() req: any,
  ) {
    const adminId = Number(req?.user?.id ?? 0);
    return this.service.reverseTransaction(id, adminId, dto.reason);
  }

  // POST /api/admin/wallet-transactions/:id/confirm
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm wallet transaction (PENDING → CONFIRMED)' })
  @ApiOkResponse({ description: 'Confirm requested' })
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmWalletDto,
    @Req() req: any,
  ) {
    const adminId = Number(req?.user?.id ?? 0);
    return this.service.confirmTransaction(id, adminId, dto.reason);
  }

  // POST /api/admin/wallet-transactions/adjust-balance
  @Post('adjust-balance')
  @ApiOperation({ summary: 'Adjust user balance (admin action)' })
  @ApiOkResponse({ description: 'Balance adjusted' })
  async adjustBalance(@Body() dto: AdjustBalanceDto, @Req() req: any) {
    const adminId = Number(req?.user?.id ?? 0);
    return this.service.adjustBalance(dto.userId, dto.amount, adminId, dto.reason);
  }
}
