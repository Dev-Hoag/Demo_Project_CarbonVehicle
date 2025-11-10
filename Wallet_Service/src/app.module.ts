// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';

// Modules
import { WalletsModule } from './modules/wallets/wallets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReservesModule } from './modules/reserves/reserves.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { EventsModule } from './modules/events/events.module';
import { InternalModule } from './modules/internal/internal.module';

// Controllers & Services
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
    }),

    // TypeORM Module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),

    // Schedule Module (for cron jobs - expire reserves)
    ScheduleModule.forRoot(),

    // Feature Modules
    WalletsModule,
    TransactionsModule,
    ReservesModule,
    WithdrawalsModule,
    EventsModule,
    InternalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
