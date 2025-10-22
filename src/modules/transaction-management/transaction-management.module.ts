import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TransactionManagementService } from './transaction-management.service';
import { TransactionManagementController } from './transaction-management.controller';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { TransactionActionAudit } from '../../shared/entities/transaction-action-audit.entity';
import { TransactionServiceClient } from '../../shared/services/transaction-service-client.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManagedTransaction, TransactionActionAudit]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    AuditLogModule,
  ],
  controllers: [TransactionManagementController],
  providers: [TransactionManagementService, TransactionServiceClient],
  exports: [TransactionManagementService],
})
export class TransactionManagementModule {}