import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TransactionManagementService } from './transaction-management.service';
import {
  FilterTransactionDto,
  ConfirmTransactionDto,
  CancelTransactionDto,
  RefundTransactionDto,
  ResolveDisputeDto,
  TransactionResponseDto,
  TransactionListResponseDto,
} from '../../shared/dtos/transaction-management.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('api/admin/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionManagementController {
  constructor(private transactionService: TransactionManagementService) {}

  @Get()
  @ApiOperation({
    summary: 'List transactions',
    description:
      'Danh sách giao dịch với filter (status/type/seller/buyer/date). Mặc định sort DESC by createdAt.',
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ type: FilterTransactionDto })
  @ApiOkResponse({ description: 'List of transactions', type: TransactionListResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid filters' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAllTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() filters: FilterTransactionDto,
  ) {
    return this.transactionService.getAllTransactions(page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID', description: 'Chi tiết 1 giao dịch theo ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID', example: 1 })
  @ApiOkResponse({ description: 'Transaction detail', type: TransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getTransactionById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.getTransactionById(id);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirm transaction',
    description: 'Xác nhận giao dịch PENDING -> COMPLETED, chỉ admin, ghi audit.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID', example: 1 })
  @ApiBody({ type: ConfirmTransactionDto })
  @ApiOkResponse({ description: 'Transaction confirmed', type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid status or not pending' })
  async confirmTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmTransactionDto,
    @CurrentUser() admin: any,
  ) {
    // ✅ Truyền cả DTO cho service (đúng chữ ký)
    return this.transactionService.confirmTransaction(id, admin.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel transaction', description: 'Hủy giao dịch PENDING -> CANCELLED, chỉ admin.' })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID', example: 1 })
  @ApiBody({ type: CancelTransactionDto })
  @ApiOkResponse({ description: 'Transaction cancelled', type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Cannot cancel non-pending' })
  async cancelTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelTransactionDto,
    @CurrentUser() admin: any,
  ) {
    // ✅ Truyền DTO
    return this.transactionService.cancelTransaction(id, admin.id, dto);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund transaction', description: 'Hoàn tiền COMPLETED/DISPUTED -> REFUNDED.' })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID', example: 1 })
  @ApiBody({ type: RefundTransactionDto })
  @ApiOkResponse({ description: 'Transaction refunded', type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid for refund' })
  async refundTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefundTransactionDto,
    @CurrentUser() admin: any,
  ) {
    // ✅ Truyền DTO
    return this.transactionService.refundTransaction(id, admin.id, dto);
  }

  @Post(':id/resolve-dispute')
  @ApiOperation({
    summary: 'Resolve dispute',
    description: 'Giải quyết tranh chấp DISPUTED -> resolution (e.g., REFUNDED/COMPLETED), clear dispute.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID', example: 1 })
  @ApiBody({ type: ResolveDisputeDto })
  @ApiOkResponse({ description: 'Dispute resolved', type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Not disputed or invalid resolution' })
  async resolveDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() admin: any,
  ) {
    // ✅ Service nhận (id, adminId, dto) → chỉ truyền 3 tham số
    return this.transactionService.resolveDispute(id, admin.id, dto);
  }

  @Get(':id/action-history')
  @ApiOperation({
    summary: 'Transaction action history',
    description: 'Lịch sử thao tác (confirm/cancel/refund/resolve) trên giao dịch.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID', example: 1 })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiOkResponse({ description: 'Transaction action history' })
  async getTransactionActionHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.transactionService.getTransactionActionHistory(id, page, limit);
  }
}
