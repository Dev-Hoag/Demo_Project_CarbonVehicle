// src/modules/reserves/reserves.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservesService } from './reserves.service';
import { Reserve, Wallet, WalletTransaction } from '../../shared/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Reserve, Wallet, WalletTransaction])],
  providers: [ReservesService],
  exports: [ReservesService],
})
export class ReservesModule {}
