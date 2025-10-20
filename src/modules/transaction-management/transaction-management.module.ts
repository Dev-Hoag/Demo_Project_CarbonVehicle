import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionManagementService } from './transaction-management.service';
import { TransactionManagementController } from './transaction-management.controller';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { TransactionActionAudit } from '../../shared/entities/transaction-action-audit.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Outbox } from '../../shared/entities/outbox.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ManagedTransaction, TransactionActionAudit,Outbox]),
    AuditLogModule,
  ],
  controllers: [TransactionManagementController],
  providers: [TransactionManagementService],
  exports: [TransactionManagementService],
})
export class TransactionManagementModule {}