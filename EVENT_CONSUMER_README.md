# Admin Service - Event Consumer

## Overview
Admin Service Consumer subscribes to payment events from RabbitMQ to keep the `managed_transaction` cache table synchronized with Payment Service.

## Architecture Pattern: CQRS (Command Query Responsibility Segregation)

### Write Side (Commands)
- Admin performs actions (confirm, cancel, refund)
- Commands sent to Transaction Service via HTTP API
- Transaction Service updates its database
- Transaction Service publishes events to RabbitMQ

### Read Side (Queries)
- Admin dashboard queries `managed_transaction` table
- Fast queries without cross-service calls
- Data synced via Event Consumer

### Sync Mechanism
- **Event Consumer** keeps read model updated
- Real-time sync via RabbitMQ (eventual consistency)
- Better than polling/cron (efficient, low latency)

## Implementation

### Files Created
1. **src/modules/events/rabbitmq.config.ts**
   - RabbitMQ connection configuration
   - Exchange: `ccm.events` (topic)
   - Credentials: `ccm_admin:ccm_password_2024@ccm_rabbitmq:5672/ccm_vhost`

2. **src/modules/events/payment-event.consumer.ts**
   - `@RabbitSubscribe` decorators for payment events
   - Handlers:
     * `handlePaymentCompleted` → `admin.payment-completed` queue
     * `handlePaymentFailed` → `admin.payment-failed` queue
   - Features:
     * Idempotency check (in-memory Set)
     * DLQ configuration
     * Error handling with retry
     * Structured logging

3. **src/modules/events/events.module.ts**
   - NestJS module registering RabbitMQModule
   - Imports: TypeOrmModule.forFeature([ManagedTransaction])

### Files Updated
- **src/app.module.ts**: Added `EventsModule` import
- **package.json**: Added dependencies:
  * `@golevelup/nestjs-rabbitmq@^5.6.0`
  * `amqplib@^0.10.3`
  * `@ccm/events@file:../libs/events`
- **.env**: Added `RABBITMQ_URL` configuration
- **Dockerfile**: Updated to build from root context with `libs/events`
- **tsconfig.json**: 
  * Added `paths` mapping for `@ccm/events`
  * Changed `module: commonjs`, `moduleResolution: node`

## Event Handlers

### payment.completed
```typescript
async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void>
```
- **Action**: Updates `managed_transaction` status to `COMPLETED`
- **Updates**: 
  * `status → COMPLETED`
  * `amount → event.payload.amount`
  * `completedAt → event.timestamp`
  * `syncedAt → now()`
- **Behavior**: Creates new record if not exists

### payment.failed
```typescript
async handlePaymentFailed(event: PaymentFailedEvent): Promise<void>
```
- **Action**: Updates `managed_transaction` status to `CANCELLED`
- **Updates**:
  * `status → CANCELLED`
  * `disputeReason → event.payload.reason`
  * `syncedAt → now()`
- **Behavior**: Creates new record if not exists

## Idempotency

### In-Memory Cache
```typescript
private readonly processedEvents = new Set<string>();
```
- Tracks processed event IDs
- Prevents duplicate processing
- Auto-cleanup: Keeps last 1000 events

### Check Logic
```typescript
if (this.processedEvents.has(eventId)) {
  this.logger.warn(`Event already processed: ${eventId}`);
  return;
}
```

## Dead Letter Queue (DLQ)

### Configuration
```typescript
queueOptions: {
  durable: true,
  deadLetterExchange: 'ccm.events.dlx',
}
```
- Failed events moved to DLX after retries
- Prevents message loss
- Enables manual inspection

## Testing

### Verify Consumer Running
```bash
docker logs admin_service_app --tail 50
```
Expected output:
```
[Nest] INFO [PaymentEventConsumer] PaymentEventConsumer registered
[Nest] INFO [RabbitMQ] Connected to ccm_rabbitmq:5672/ccm_vhost
```

### Test Event Flow
1. Create payment in Payment Service
2. Check Admin Service logs for event processing
3. Query `managed_transaction` table to verify sync

### Manual Test
```bash
# Check managed_transaction before
docker exec admin_service-mysql-1 mysql -uroot -proot -D admin_service_db \
  -e "SELECT id, externalTransactionId, status, amount, syncedAt FROM managed_transaction ORDER BY id DESC LIMIT 5;"

# Trigger payment event (complete a payment)

# Check logs
docker logs admin_service_app --tail 20 | grep "payment.completed"

# Verify update
docker exec admin_service-mysql-1 mysql -uroot -proot -D admin_service_db \
  -e "SELECT id, externalTransactionId, status, amount, syncedAt FROM managed_transaction ORDER BY syncedAt DESC LIMIT 5;"
```

## Benefits

### Performance
- ✅ Fast dashboard queries (no API calls)
- ✅ Cached data optimized for reporting
- ✅ No cross-service latency

### Reliability
- ✅ Eventual consistency (acceptable for admin UI)
- ✅ DLQ for failed messages
- ✅ Idempotency prevents duplicates

### Scalability
- ✅ Decoupled from Payment Service
- ✅ Event-driven sync scales better than polling
- ✅ Admin Service can query without impacting Payment Service

## Comparison with Alternatives

### ❌ Polling/Cron
- Higher latency (minutes delay)
- Increased load on source services
- Less efficient than push-based events

### ❌ Direct API Queries
- Slow dashboard (network latency every query)
- Couples Admin Service to Payment Service availability
- Can't aggregate/join data efficiently

### ✅ Event Consumer (Chosen)
- Real-time sync (seconds delay)
- Efficient push-based updates
- Follows industry standard patterns (Netflix, Uber, Amazon)

## Future Enhancements

### User Events
- Subscribe to `user.updated`, `user.suspended` events
- Sync `managed_user` table
- Complete CQRS pattern for all entities

### Persistent Idempotency
- Replace in-memory Set with Redis/Database
- Survive service restarts
- Distributed idempotency across replicas

### Metrics & Monitoring
- Track event processing time
- Alert on DLQ messages
- Dashboard for consumer health

## References

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Materialized View Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view)
- [Event-Driven Architecture Best Practices](https://www.confluent.io/blog/event-driven-architecture-patterns/)
