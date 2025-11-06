import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AdminUser } from '../shared/entities/admin-user.entity';
import { AuditLog } from '../shared/entities/audit-log.entity';
import { ManagedUser } from '../shared/entities/managed-user.entity';
import { UserActionAudit } from '../shared/entities/user-action-audit.entity';
import { ManagedTransaction } from '../shared/entities/managed-transaction.entity';
import { TransactionActionAudit } from '../shared/entities/transaction-action-audit.entity';
import { ManagedWalletTransaction } from '../shared/entities/managed-wallet-transaction.entity';
import { WalletActionAudit } from '../shared/entities/wallet-action-audit.entity';
import { ManagedListing } from '../shared/entities/managed-listing.entity';
import { ListingActionAudit } from '../shared/entities/listing-action-audit.entity';
import { OverrideRequest } from '../shared/entities/override-request.entity';
import { MetricDaily } from '../shared/entities/metric-daily.entity';
import { AdminConfig } from '../shared/entities/admin-config.entity';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  return {
    type: 'mysql',
  
    host: process.env.DB_HOST ?? 'mysql',
    port: parseInt(process.env.DB_PORT ?? '3306'),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_DATABASE ?? 'admin_service_db',
    entities: [
      AdminUser,
      AuditLog,
      ManagedUser,
      UserActionAudit,
      ManagedTransaction,
      TransactionActionAudit,
      ManagedWalletTransaction,
      WalletActionAudit,
      ManagedListing,
      ListingActionAudit,
      OverrideRequest,
      MetricDaily,
      AdminConfig,
    ],
 
    synchronize: process.env.DB_SYNCHRONIZE === 'false',
    logging: process.env.NODE_ENV === 'development',
  };
};
