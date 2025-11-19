import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        try {
          const store = await redisStore({
            socket: {
              host: process.env.REDIS_HOST || 'ccm_redis',
              port: parseInt(process.env.REDIS_PORT || '6379'),
              connectTimeout: 5000, // 5 second timeout
            },
            password: process.env.REDIS_PASSWORD || 'ccm_redis_password_2024',
            database: parseInt(process.env.REDIS_DB || '0'),
            ttl: 3600,
          });

          console.log('✅ Redis connection established successfully');
          return {
            store: store as any,
            ttl: 3600,
          };
        } catch (error) {
          console.warn('⚠️  Redis connection failed, using in-memory cache fallback:', error.message);
          
          // Fallback to in-memory cache (no-op cache)
          return {
            store: {
              get: async () => null, // Always cache miss
              set: async () => {}, // No-op
              del: async () => {}, // No-op
              reset: async () => {}, // No-op
              mget: async () => [], // No-op
              mset: async () => {}, // No-op
              mdel: async () => {}, // No-op
              keys: async () => [], // No-op
              ttl: async () => -1, // No-op
            },
            ttl: 0, // No caching
          };
        }
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
