import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionManagementService } from './transaction-management.service';
import {
  FilterTransactionDto,
  ConfirmTransactionDto,
  CancelTransactionDto,
  RefundTransactionDto,
  ResolveDisputeDto,
} from '../../shared/dtos/transaction-management.dto';
import { TransactionStatus, TransactionType } from '../../shared/enums/admin.enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('api/admin/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionManagementController {
  constructor(private readonly service: TransactionManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions' })
  async getAllTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: TransactionStatus,
    @Query('transactionType') transactionType?: TransactionType,
    @Query('sellerId') sellerId?: string,
    @Query('buyerId') buyerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters: FilterTransactionDto = {
      status,
      transactionType,
      sellerId,
      buyerId,
      fromDate,
      toDate,
    };
    return this.service.getAllTransactions(page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransactionById(@Param('id') id: string) {
    return this.service.getTransactionById(id);
  }

  // ========== ADMIN COMMANDS DISABLED ==========
  // Transaction_Service does not implement these endpoints yet
  // Only read-only operations are supported

  // @Post(':id/confirm')
  // @HttpCode(200)
  // @ApiOperation({ summary: 'Confirm transaction' })
  // async confirmTransaction(
  //   @Param('id') id: string,
  //   @Body() dto: ConfirmTransactionDto,
  //   @CurrentUser() admin: any,
  // ) {
  //   return this.service.confirmTransaction(id, admin.id, dto);
  // }

  // @Post(':id/cancel')
  // @HttpCode(200)
  // @ApiOperation({ summary: 'Cancel transaction' })
  // async cancelTransaction(
  //   @Param('id') id: string,
  //   @Body() dto: CancelTransactionDto,
  //   @CurrentUser() admin: any,
  // ) {
  //   return this.service.cancelTransaction(id, admin.id, dto);
  // }

  // @Post(':id/refund')
  // @HttpCode(200)
  // @ApiOperation({ summary: 'Refund transaction' })
  // async refundTransaction(
  //   @Param('id') id: string,
  //   @Body() dto: RefundTransactionDto,
  //   @CurrentUser() admin: any,
  // ) {
  //   return this.service.refundTransaction(id, admin.id, dto);
  // }

  // @Post(':id/resolve-dispute')
  // @HttpCode(200)
  // @ApiOperation({ summary: 'Resolve dispute' })
  // async resolveDispute(
  //   @Param('id') id: string,
  //   @Body() dto: ResolveDisputeDto,
  //   @CurrentUser() admin: any,
  // ) {
  //   return this.service.resolveDispute(id, admin.id, dto);
  // }

  @Get(':id/action-history')
  @ApiOperation({ summary: 'Transaction action history' })
  async getActionHistory(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.getTransactionActionHistory(id, page, limit);
  }
}