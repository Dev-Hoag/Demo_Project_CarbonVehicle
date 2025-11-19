import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'ccm_redis',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
          password: process.env.REDIS_PASSWORD || 'ccm_redis_password_2024',
          database: parseInt(process.env.REDIS_DB || '0'),
          ttl: 3600, // Default TTL: 1 hour (in seconds)
        });

        return {
          store: store as any,
          ttl: 3600,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
