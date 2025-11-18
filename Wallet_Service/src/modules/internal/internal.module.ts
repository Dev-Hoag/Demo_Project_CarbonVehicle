// src/modules/internal/internal.module.ts

import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { InternalAdminController } from './internal-admin.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { ReservesModule } from '../reserves/reserves.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [WalletsModule, ReservesModule, AdminModule],
  controllers: [InternalController, InternalAdminController],
})
export class InternalModule {}
