import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KycManagementController } from './kyc-management.controller';
import { KycManagementService } from './kyc-management.service';

@Module({
  imports: [HttpModule],
  controllers: [KycManagementController],
  providers: [KycManagementService],
  exports: [KycManagementService],
})
export class KycManagementModule {}
