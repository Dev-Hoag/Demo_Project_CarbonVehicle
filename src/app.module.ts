import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './database/typeorm.config';

import { AuthModule } from './modules/auth/auth.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { TransactionManagementModule } from './modules/transaction-management/transaction-management.module';
import { OutboxModule } from './modules/outbox/outbox.module'; // ★ NEW

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    AuthModule,
    AuditLogModule,
    UserManagementModule,
    TransactionManagementModule,
    OutboxModule, // ★ NEW
  ],
})
export class AppModule {}
