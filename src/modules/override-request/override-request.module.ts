import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OverrideRequest } from '../../shared/entities/override-request.entity';
import { OverrideRequestService } from './override-request.service';
import { OverrideRequestController } from './override-request.controller';
import { AuditLog } from '../../shared/entities/audit-log.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([OverrideRequest, AuditLog])],
  providers: [OverrideRequestService, AuditLogService],
  controllers: [OverrideRequestController],
  exports: [OverrideRequestService],
})
export class OverrideRequestModule {}
