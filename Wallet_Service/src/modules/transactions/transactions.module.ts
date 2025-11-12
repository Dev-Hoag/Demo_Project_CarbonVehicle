// src/modules/transactions/transactions.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { WalletTransaction, Wallet } from '../../shared/entities';

@Module({
  imports: [TypeOrmModule.forFeature([WalletTransaction, Wallet])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
