// src/modules/wallets/wallets.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { Wallet, WalletTransaction, Reserve } from '../../shared/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransaction, Reserve])],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
