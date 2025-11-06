# User Service - Event Consumer

## Overview
User Service lắng nghe payment events từ RabbitMQ để cập nhật transaction history và user state.

## Event Consumers

### PaymentEventConsumer (`payment-event.consumer.ts`)

#### 1. payment.completed
- **Queue**: `user.payment-completed`
- **Routing Key**: `payment.completed`
- **Purpose**: Cập nhật user transaction history khi payment thành công
- **Idempotency**: Check event.id trước khi process
- **DLQ**: `ccm.events.dlx` với routing key `payment.completed.dead`

#### 2. payment.failed
- **Queue**: `user.payment-failed`
- **Routing Key**: `payment.failed`
- **Purpose**: Notify user hoặc log khi payment failed
- **Idempotency**: Check event.id trước khi process
- **DLQ**: `ccm.events.dlx` với routing key `payment.failed.dead`

#### 3. payment.initiated (Optional)
- **Queue**: `user.payment-initiated`
- **Routing Key**: `payment.initiated`
- **Purpose**: Track payment cho analytics
- **No DLQ**: Không critical

## Configuration

### Environment Variables
```env
RABBITMQ_URL=amqp://guest:guest@ccm_rabbitmq:5672
```

### RabbitMQ Config (`rabbitmq.config.ts`)
- Exchange: `ccm.events` (topic)
- Channel: `payment-events-channel` with prefetch=10
- Connection timeout: 20s
- Auto-reconnect: enabled

## Event Flow

```
Payment Service                RabbitMQ                User Service
     |                            |                          |
     |-- payment.completed ------>|                          |
     |                            |---- routing key -------->|
     |                            |    payment.completed     |
     |                            |                          |
     |                            |                     [Consumer]
     |                            |                     1. Check idempotency
     |                            |                     2. Update DB
     |                            |                     3. Mark processed
     |                            |<------- ACK -----------|
```

## Idempotency Strategy

### In-Memory Cache
- Simple `Set<string>` lưu event IDs đã process
- Pros: Fast, đơn giản
- Cons: Mất data khi restart

### Database-based (TODO)
```typescript
@Entity()
export class ProcessedEvent {
  @PrimaryColumn()
  eventId: string;

  @Column()
  processedAt: Date;
}
```

## Error Handling

### Retry Strategy
1. Consumer throw error → Message requeue
2. Max retries from queue TTL config
3. After max retries → DLQ

### Dead Letter Queue
- Exchange: `ccm.events.dlx`
- Queue: `user.payment-completed.dead`
- Manual intervention needed

## Testing

### Test Consumer
```bash
# Check User Service logs
docker logs user_service-user-service-1 --tail 50 -f

# Create test payment in Payment Service
curl -X POST http://localhost:3002/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"userId":123,"transactionId":"test-123","amount":50000,"gateway":"TEST"}'

# Complete payment → trigger event
# Check User Service logs for "Received payment.completed event"
```

### Verify Queues
```bash
# RabbitMQ Management UI
http://localhost:15672

# Check queues:
- user.payment-completed
- user.payment-failed
- user.payment-initiated
```

## TODO

- [ ] Implement database-based idempotency check
- [ ] Add transaction history entity and repository
- [ ] Send user notifications on payment completed
- [ ] Add retry logic with exponential backoff
- [ ] Implement circuit breaker for external calls
- [ ] Add metrics and monitoring
