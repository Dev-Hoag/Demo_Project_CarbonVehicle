// src/modules/withdrawals/admin-withdrawals.controller.ts

import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { WithdrawalStatus } from '../../shared/enums';

class ApproveWithdrawalDto {
  adminNote?: string;
}

class RejectWithdrawalDto {
  reason: string;
}

@ApiTags('admin-withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/admin/withdrawals')
export class AdminWithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending withdrawals (Admin only)' })
  async getPendingWithdrawals() {
    return this.withdrawalsService.getPendingWithdrawals();
  }

  @Get()
  @ApiOperation({ summary: 'Get all withdrawals (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: WithdrawalStatus })
  async getAllWithdrawals(@Query('status') status?: WithdrawalStatus) {
    return this.withdrawalsService.getAllWithdrawals(status);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve withdrawal request (Admin only)' })
  async approveWithdrawal(
    @Param('id') withdrawalId: string,
    @CurrentUser() admin: any,
    @Body() dto: ApproveWithdrawalDto,
  ) {
    return this.withdrawalsService.approveWithdrawal(withdrawalId, admin.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject withdrawal request (Admin only)' })
  async rejectWithdrawal(
    @Param('id') withdrawalId: string,
    @CurrentUser() admin: any,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.withdrawalsService.rejectWithdrawal(withdrawalId, admin.id, dto.reason);
  }
}
