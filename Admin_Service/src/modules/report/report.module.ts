
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { MetricDaily } from '../../shared/entities/metric-daily.entity';
import { AuditLog } from '../../shared/entities/audit-log.entity';
import { AdminUser } from '../../shared/entities/admin-user.entity';
import { ManagedUser } from '../../shared/entities/managed-user.entity';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetricDaily,
      AuditLog,
      AdminUser,
      ManagedUser,
      ManagedTransaction,
    ]),
    AuthModule, // Import AuthModule để JwtAuthGuard hoạt động
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}