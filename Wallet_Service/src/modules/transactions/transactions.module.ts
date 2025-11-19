// src/modules/transactions/transactions.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { WalletTransaction, Wallet } from '../../shared/entities';
import { RedisCacheModule } from '../../redis/redis-cache.module';
import { CacheService } from '../../redis/cache.service';
import { WalletCacheService } from '../wallets/wallet-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletTransaction, Wallet]),
    RedisCacheModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, CacheService, WalletCacheService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
