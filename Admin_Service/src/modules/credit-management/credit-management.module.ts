import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CreditManagementController } from './credit-management.controller';
import { CreditManagementService } from './credit-management.service';

@Module({
  imports: [HttpModule],
  controllers: [CreditManagementController],
  providers: [CreditManagementService],
  exports: [CreditManagementService],
})
export class CreditManagementModule {}
