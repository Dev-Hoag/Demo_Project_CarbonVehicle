import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { InternalKycController } from './internal-kyc.controller';
import { KycDocument } from '../../shared/entities/kyc-document.entity';
import { User } from '../../shared/entities/user.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycDocument, User]),
    MulterModule.register({
      dest: './uploads/kyc',
    }),
  ],
  controllers: [KycController, InternalKycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}