// src/modules/wallets/wallets.controller.ts

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateDepositDto } from '../../shared/dtos/wallet.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance' })
  async getWallet(@CurrentUser() user: any) {
    return this.walletsService.getOrCreateWallet(user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get wallet summary' })
  async getWalletSummary(@CurrentUser() user: any) {
    return this.walletsService.getWalletSummary(user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Initiate deposit' })
  async initiateDeposit(@Body() dto: CreateDepositDto, @CurrentUser() user: any) {
    return this.walletsService.initiateDeposit(user.id, dto);
  }

  @Get('limits')
  @ApiOperation({ summary: 'Get withdrawal limits' })
  async getWithdrawalLimits() {
    return {
      minWithdrawal: 50000,
      maxWithdrawal: 50000000,
      dailyLimit: 100000000,
      fee: 0.5,
    };
  }
}
