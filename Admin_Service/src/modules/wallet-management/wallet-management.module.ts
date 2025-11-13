import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WalletManagementService } from './wallet-management.service';
import { WalletManagementController } from './wallet-management.controller';
import { ManagedWalletTransaction } from '../../shared/entities/managed-wallet-transaction.entity';
import { WalletActionAudit } from '../../shared/entities/wallet-action-audit.entity';
import { WalletServiceClient } from '../../shared/services/wallet-service-client.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManagedWalletTransaction, WalletActionAudit]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    AuditLogModule,
  ],
  controllers: [WalletManagementController],
  providers: [WalletManagementService, WalletServiceClient],
  exports: [WalletManagementService],
})
export class WalletManagementModule {}