import { Controller, Get } from '@nestjs/common';
import { CacheService } from '../../redis/cache.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('redis')
  @ApiOperation({ summary: 'Test Redis connection and cache' })
  async testRedis() {
    try {
      // Test SET
      await this.cacheService.set('test:health', { message: 'Redis is working!', timestamp: new Date() }, 60);
      
      // Test GET
      const value = await this.cacheService.get('test:health');
      
      // Test DELETE
      await this.cacheService.del('test:health');
      
      return {
        status: 'success',
        redis: 'connected',
        operations: {
          set: 'OK',
          get: 'OK',
          delete: 'OK'
        },
        cachedValue: value
      };
    } catch (error) {
      return {
        status: 'error',
        redis: 'disconnected',
        error: error.message
      };
    }
  }

  @Get('redis/clear')
  @ApiOperation({ summary: 'Clear all user profile cache' })
  async clearUserCache() {
    try {
      // This would require Redis SCAN command which cache-manager doesn't support directly
      // For now, return a message
      return {
        status: 'info',
        message: 'To clear specific user cache, update your profile or wait for TTL expiry (1 hour)',
        tip: 'Cache keys use pattern: user:00000000-0000-0000-0000-{userId}'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}
