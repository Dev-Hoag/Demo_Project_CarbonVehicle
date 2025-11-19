# Redis Setup for Carbon Credit Market

## Overview
Redis is used for caching, session management, and real-time data across all microservices.

## Configuration

### Connection Details
- **Host:** `ccm_redis` (Docker network) or `localhost` (local development)
- **Port:** `6379`
- **Password:** `ccm_redis_password_2024`
- **Max Memory:** 512MB
- **Eviction Policy:** allkeys-lru (Least Recently Used)

### Persistence
- **RDB Snapshots:** Every 60 seconds if 1+ key changed
- **AOF (Append Only File):** Enabled with `everysec` fsync

## Usage by Service

### 1. User Service (NestJS)
```typescript
// Cache user profiles, sessions, JWT blacklist
Key Pattern: user:{userId}
Key Pattern: session:{sessionId}
Key Pattern: jwt:blacklist:{token}
TTL: 3600s (1 hour)
```

### 2. Trip Service (Java Spring)
```java
// Cache trip summaries, statistics
Key Pattern: trip:summary:{userId}
Key Pattern: trip:stats:{period}
TTL: 300s (5 minutes)
```

### 3. Transaction Service
```typescript
// Cache transaction history, balances
Key Pattern: transaction:history:{userId}
Key Pattern: wallet:balance:{userId}
TTL: 60s (1 minute)
```

### 4. Notification Service
```typescript
// Cache notification counts, recent notifications
Key Pattern: notification:count:{userId}
Key Pattern: notification:recent:{userId}
TTL: 30s (30 seconds)
```

### 5. Admin Service
```typescript
// Cache admin permissions, system stats
Key Pattern: admin:permissions:{adminId}
Key Pattern: system:stats:{metric}
TTL: 600s (10 minutes)
```

## Redis CLI Commands

### Connect to Redis
```bash
docker exec -it ccm_redis redis-cli -a ccm_redis_password_2024
```

### Useful Commands
```bash
# View all keys
KEYS *

# Get a key
GET user:123

# Set a key with TTL
SETEX user:123 3600 "user_data"

# Check TTL
TTL user:123

# Delete a key
DEL user:123

# Clear all keys
FLUSHALL

# Get memory usage
INFO memory

# Monitor real-time commands
MONITOR
```

## Health Check
```bash
# Check if Redis is running
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 PING
# Expected output: PONG

# Check memory usage
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 INFO memory
```

## Performance Tuning

### Memory Management
- Current limit: 512MB
- Eviction policy: allkeys-lru (automatically removes least recently used keys)
- To increase memory: Edit `maxmemory` in docker-compose.yml

### Connection Pooling
- **NestJS:** Use `@nestjs/cache-manager` with connection pool
- **Java Spring:** Configure `JedisPoolConfig` with max connections

### Best Practices
1. Use namespaced keys (e.g., `service:entity:id`)
2. Set appropriate TTLs to prevent memory bloat
3. Use Redis pipelining for bulk operations
4. Monitor memory usage regularly
5. Use Redis pub/sub for real-time notifications

## Monitoring

### Memory Usage
```bash
docker stats ccm_redis
```

### Redis Info
```bash
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 INFO
```

### Slow Queries
```bash
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 SLOWLOG GET 10
```

## Backup & Recovery

### Manual Backup
```bash
# Trigger RDB snapshot
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 BGSAVE

# Copy dump file
docker cp ccm_redis:/data/dump.rdb ./backup/redis-dump-$(date +%Y%m%d).rdb
```

### Restore from Backup
```bash
# Stop Redis
docker stop ccm_redis

# Copy backup to data volume
docker cp ./backup/redis-dump.rdb ccm_redis:/data/dump.rdb

# Start Redis
docker start ccm_redis
```

## Troubleshooting

### Redis Not Starting
```bash
# Check logs
docker logs ccm_redis

# Common issues:
# 1. Port 6379 already in use
# 2. Insufficient memory
# 3. Invalid configuration
```

### Connection Issues
```bash
# Test connection
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 PING

# Check network
docker network inspect ccm_net
```

### High Memory Usage
```bash
# Check memory
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 INFO memory

# Clear specific pattern
docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --scan --pattern "temp:*" | xargs docker exec -i ccm_redis redis-cli -a ccm_redis_password_2024 DEL
```

## Next Steps

1. **User Service Integration**: Add Redis caching for user profiles and sessions
2. **Trip Service Integration**: Cache trip summaries and statistics
3. **Transaction Service Integration**: Cache wallet balances and transaction history
4. **Rate Limiting**: Implement API rate limiting using Redis
5. **Session Management**: Centralized session store for all NestJS services
