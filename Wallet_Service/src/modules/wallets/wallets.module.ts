// src/modules/wallets/wallets.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { Wallet, WalletTransaction, Reserve } from '../../shared/entities';
import { WalletAuditLog } from '../../shared/entities/wallet-audit.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransaction, Reserve, WalletAuditLog]), EventsModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
