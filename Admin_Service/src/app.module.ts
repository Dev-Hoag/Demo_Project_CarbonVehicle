// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { typeOrmConfig } from './database/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { TransactionManagementModule } from './modules/transaction-management/transaction-management.module';
import { WalletManagementModule } from './modules/wallet-management/wallet-management.module';
import { ListingManagementModule } from './modules/listing-management/listing-management.module';
import { ReportModule } from './modules/report/report.module';
import { OverrideRequestModule } from './modules/override-request/override-request.module';
import { EventsModule } from './modules/events/events.module';
import { KycManagementModule } from './modules/kyc-management/kyc-management.module';
import { CreditManagementModule } from './modules/credit-management/credit-management.module';

// ⚠️ Sửa đường dẫn: 'health' (không phải 'heatlh')
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    AuditLogModule,
    UserManagementModule,
    TransactionManagementModule,
    WalletManagementModule,
    ListingManagementModule,
    ReportModule,
    OverrideRequestModule,
    EventsModule,
    KycManagementModule,
    CreditManagementModule,

    // ❌ KHÔNG đưa Controller vào đây
    // HealthController,
  ],
  controllers: [
    AppController,
    HealthController, // ✅ đặt Controller ở đây
  ],
  providers: [AppService],
})
export class AppModule {}
