// src/modules/wallets/wallets.controller.ts

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateDepositDto } from '../../shared/dtos/wallet.dto';

@ApiTags('wallets')
@Controller('api/wallets')
// @UseGuards(JwtAuthGuard) // TODO: Implement after User Service integration
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance' })
  async getWallet() {
    // TODO: Get userId from JWT token
    const userId = 'mock-user-id';
    return this.walletsService.getOrCreateWallet(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get wallet summary' })
  async getWalletSummary() {
    const userId = 'mock-user-id';
    return this.walletsService.getWalletSummary(userId);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Initiate deposit' })
  async initiateDeposit(@Body() dto: CreateDepositDto) {
    const userId = 'mock-user-id';
    return this.walletsService.initiateDeposit(userId, dto);
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
