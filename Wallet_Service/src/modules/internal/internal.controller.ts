// src/modules/internal/internal.controller.ts

import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ReservesService } from '../reserves/reserves.service';
import { WalletsService } from '../wallets/wallets.service';
import { InternalApiGuard } from '../../shared/guards/internal-api.guard';
import {
  ReserveFundsDto,
  ReleaseFundsDto,
  SettleFundsDto,
  RefundPaymentDto,
} from '../../shared/dtos/wallet.dto';

@ApiTags('internal-wallet')
@ApiSecurity('internal-api-key')
@UseGuards(InternalApiGuard)
@Controller('internal/wallets')
export class InternalController {
  constructor(
    private readonly reservesService: ReservesService,
    private readonly walletsService: WalletsService,
  ) {}

  @Post('reserve')
  @ApiOperation({ summary: '[Internal] Reserve funds for transaction' })
  async reserveFunds(@Body() dto: ReserveFundsDto) {
    return this.reservesService.reserveFunds(
      dto.userId,
      dto.transactionId,
      dto.amount,
      dto.expirationMinutes,
    );
  }

  @Post('release')
  @ApiOperation({ summary: '[Internal] Release reserved funds' })
  async releaseFunds(@Body() dto: ReleaseFundsDto) {
    return this.reservesService.releaseFunds(dto.transactionId);
  }

  @Post('settle')
  @ApiOperation({ summary: '[Internal] Settle transaction (transfer funds)' })
  async settleFunds(@Body() dto: SettleFundsDto) {
    return this.reservesService.settleFunds(
      dto.transactionId,
      dto.buyerId,
      dto.sellerId,
      dto.amount,
    );
  }

  @Post('refund')
  @ApiOperation({ summary: '[Internal] Refund payment' })
  async refundPayment(@Body() dto: RefundPaymentDto) {
    // Phân biệt refund của settle (reverse) và refund payment nạp dư
    // Giả sử paymentId trỏ đến giao dịch DEPOSIT hoặc SETTLE_IN trước đó.
    // TODO: tra cứu giao dịch gốc và xác định loại refund chính xác.
    return this.walletsService.addBalance(
      dto.userId,
      dto.amount,
      `refund:${dto.paymentId}`,
      dto.reason || 'Payment refunded',
    );
  }

  @Get(':userId/balance')
  @ApiOperation({ summary: '[Internal] Get user wallet balance' })
  async getBalance(@Param('userId') userId: string) {
    const wallet = await this.walletsService.getOrCreateWallet(userId);
    return {
      userId,
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      availableBalance: wallet.availableBalance,
    };
  }

  @Get('metrics/summary')
  @ApiOperation({ summary: '[Internal] Wallet metrics summary' })
  async getMetricsSummary() {
    return this.reservesService.getMetrics();
  }
}
