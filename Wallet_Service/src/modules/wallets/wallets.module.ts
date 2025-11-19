// src/modules/wallets/wallets.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletCacheService } from './wallet-cache.service';
import { Wallet, WalletTransaction, Reserve } from '../../shared/entities';
import { WalletAuditLog } from '../../shared/entities/wallet-audit.entity';
import { EventsModule } from '../events/events.module';
import { RedisCacheModule } from '../../redis/redis-cache.module';
import { CacheService } from '../../redis/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, Reserve, WalletAuditLog]), 
    EventsModule,
    RedisCacheModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService, WalletCacheService, CacheService],
  exports: [WalletsService, TypeOrmModule], // Export TypeOrmModule to make Wallet repository available
})
export class WalletsModule {}
