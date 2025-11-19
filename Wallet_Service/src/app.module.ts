// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { getDatabaseConfig } from './config/database.config';
import { JwtStrategy } from './shared/strategies/jwt.strategy';
import { Reserve } from './shared/entities/reserve.entity';

// Redis Cache Module
import { RedisCacheModule } from './redis/redis-cache.module';

// Modules
import { WalletsModule } from './modules/wallets/wallets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReservesModule } from './modules/reserves/reserves.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { EventsModule } from './modules/events/events.module';
import { InternalModule } from './modules/internal/internal.module';
import { AdminModule } from './modules/admin/admin.module';

// Controllers & Services
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Consumers are now provided via ConsumersModule to ensure proper DI order
// import { TransactionEventConsumer } from './consumers/transaction-event.consumer';
// import { PaymentEventConsumer } from './consumers/payment-event.consumer';
import { ReserveCleanupService } from './services/reserve-cleanup.service';
import { ConsumersModule } from './modules/consumers/consumers.module';

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
    
    // Import Reserve entity for ReserveCleanupService
    TypeOrmModule.forFeature([Reserve]),

    // Schedule Module (for cron jobs - expire reserves)
    ScheduleModule.forRoot(),

    // Passport & JWT Module
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),

    // Redis Cache Module (Global)
    RedisCacheModule,

    // Feature Modules
    WalletsModule,
    TransactionsModule,
    ReservesModule,
    WithdrawalsModule,
    EventsModule,
    InternalModule,
    AdminModule,
    ConsumersModule, // central module for RabbitMQ consumers
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    ReserveCleanupService,
  ],
})
export class AppModule {}
