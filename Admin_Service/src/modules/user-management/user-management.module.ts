import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserManagementService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { ManagedUser } from '../../shared/entities/managed-user.entity';
import { UserActionAudit } from '../../shared/entities/user-action-audit.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManagedUser, UserActionAudit]),
    AuditLogModule,
    EventsModule, // For AdminEventPublisher
  ],
  controllers: [UserManagementController],
  providers: [UserManagementService],
  exports: [UserManagementService],
})
export class UserManagementModule {}