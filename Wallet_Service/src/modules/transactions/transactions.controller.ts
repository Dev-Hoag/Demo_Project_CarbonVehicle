// src/modules/transactions/transactions.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('api/wallets/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = 'mock-user-id'; // TODO: Get from JWT
    return this.transactionsService.getTransactions(userId, page, limit);
  }
}
