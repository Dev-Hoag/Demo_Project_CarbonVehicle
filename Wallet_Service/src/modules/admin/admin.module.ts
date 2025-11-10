// src/modules/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Wallet } from '../../shared/entities/wallet.entity';
import { WalletTransaction } from '../../shared/entities/wallet-transaction.entity';
import { Withdrawal } from '../../shared/entities/withdrawal.entity';
import { Reserve } from '../../shared/entities/reserve.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletTransaction,
      Withdrawal,
      Reserve,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
