// src/modules/withdrawals/withdrawals.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsController } from './withdrawals.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { Withdrawal, Wallet, WalletTransaction } from '../../shared/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal, Wallet, WalletTransaction])],
  controllers: [WithdrawalsController, AdminWithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
