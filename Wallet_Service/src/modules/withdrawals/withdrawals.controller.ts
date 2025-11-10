// src/modules/withdrawals/withdrawals.controller.ts

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from '../../shared/dtos/wallet.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/wallets/withdraw')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Request withdrawal' })
  async requestWithdrawal(@Body() dto: CreateWithdrawalDto, @CurrentUser() user: any) {
    return this.withdrawalsService.requestWithdrawal(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get withdrawal history' })
  async getWithdrawals(@CurrentUser() user: any) {
    return this.withdrawalsService.getWithdrawals(user.id);
  }
}
