import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CacheService } from '../../redis/cache.service';

@Module({
  controllers: [HealthController],
  providers: [CacheService],
})
export class HealthModule {}
