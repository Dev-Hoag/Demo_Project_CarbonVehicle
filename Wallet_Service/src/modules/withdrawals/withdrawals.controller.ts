// src/modules/withdrawals/withdrawals.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from '../../shared/dtos/wallet.dto';

@ApiTags('withdrawals')
@Controller('api/wallets/withdraw')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Request withdrawal' })
  async requestWithdrawal(@Body() dto: CreateWithdrawalDto) {
    const userId = 'mock-user-id'; // TODO: Get from JWT
    return this.withdrawalsService.requestWithdrawal(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get withdrawal history' })
  async getWithdrawals() {
    const userId = 'mock-user-id';
    return this.withdrawalsService.getWithdrawals(userId);
  }
}
