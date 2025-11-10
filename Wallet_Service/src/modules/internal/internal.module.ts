// src/modules/internal/internal.module.ts

import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { ReservesModule } from '../reserves/reserves.module';

@Module({
  imports: [WalletsModule, ReservesModule],
  controllers: [InternalController],
})
export class InternalModule {}
