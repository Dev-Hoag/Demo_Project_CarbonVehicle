# Event-Driven Architecture Setup Guide

## 📋 Tổng quan

Dự án Carbon Credit Marketplace đã được triển khai với **Event-Driven Architecture** sử dụng:
- **RabbitMQ** làm message broker
- **Outbox Pattern** để đảm bảo transactional publishing
- **Shared Events Package** (@ccm/events) để maintain contracts giữa các services

## 🏗️ Kiến trúc

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│ Payment Service │────────▶│   RabbitMQ       │────────▶│  User Service   │
│                 │         │   (Broker)       │         │                 │
│  - Publisher    │         │                  │         │  - Consumer     │
│  - Outbox       │         │  Exchange: ccm.  │         │  - Idempotent   │
└─────────────────┘         │    events        │         └─────────────────┘
                            │                  │
                            │  DLQ & Retry     │         ┌─────────────────┐
                            │  Exchanges       │────────▶│  Admin Service  │
                            └──────────────────┘         │  - Consumer     │
                                                         └─────────────────┘
```

## 📦 Components đã triển khai

### 1. Shared Events Package (`libs/events`)
**Location**: `c:\Study\BuildAppOOP\CreditCarbonMarket\libs\events`

**Chức năng**:
- Định nghĩa event contracts (TypeScript interfaces & classes)
- BaseEvent với metadata (correlationId, causationId, retries)
- Event versioning support
- Validation với class-validator

**Events đã định nghĩa**:
- **Payment Events**: `payment.initiated`, `payment.completed`, `payment.failed`, `payment.refunded`
- **User Events**: `user.created`, `user.verified`, `user.status_changed`, `user.profile_updated`
- **KYC Events**: `kyc.document_uploaded`, `kyc.document_verified`, `kyc.status_changed`

**Cài đặt trong service**:
```bash
npm install file:../../libs/events
```

### 2. RabbitMQ Service
**Location**: `docker-compose.yml` (root)

**Configuration**:
- Image: `rabbitmq:3.12-management-alpine`
- Ports: 
  - 5672 (AMQP)
  - 15672 (Management UI)
- Credentials:
  - User: `ccm_admin`
  - Password: `ccm_password_2024`
  - VHost: `ccm_vhost`

**Exchanges**:
- `ccm.events` (topic, durable)
- `ccm.events.dlx` (Dead Letter Exchange)

**Queues**:
- `payment.events` → routing key: `payment.#`
- `user.events` → routing key: `user.#`
- `kyc.events` → routing key: `kyc.#`
- DLQ queues: `*.events.dlq`

**Access Management UI**:
```
http://localhost:15672
Username: ccm_admin
Password: ccm_password_2024
```

### 3. Payment Service (Publisher)
**Location**: `c:\Study\BuildAppOOP\CreditCarbonMarket\Payment_Service`

**Modules**:
1. **RabbitMQModule** (`src/modules/rabbitmq/`)
   - RabbitMQ connection configuration
   - OutboxPublisherService (background worker)
   - Cron job chạy mỗi 10 giây

2. **PaymentEventService** (`src/modules/payment/payment-event.service.ts`)
   - `publishPaymentInitiated()`
   - `publishPaymentCompleted()`
   - `publishPaymentFailed()`
   - Saves events to outbox table transactionally

**Outbox Pattern Flow**:
```
1. Payment transaction starts
2. Save payment + Save event to outbox (same transaction)
3. Commit transaction
4. Background publisher reads outbox (status=PENDING)
5. Publish to RabbitMQ
6. Mark as PUBLISHED in outbox
7. If failed: retry with exponential backoff
```

**Retry Policy**:
- Max retries: 5
- Exponential backoff: 1min, 2min, 4min, 8min, 16min
- After max retries → manual review needed

**Environment Variables**:
```env
RABBITMQ_URL=amqp://ccm_admin:ccm_password_2024@rabbitmq:5672/ccm_vhost
```

## 🚀 Quick Start

### 1. Start RabbitMQ
```powershell
cd c:\Study\BuildAppOOP\CreditCarbonMarket
docker-compose up -d
```

Verify RabbitMQ is running:
```powershell
docker ps | findstr rabbitmq
```

### 2. Build Shared Events Package
```powershell
cd libs\events
npm install
npm run build
```

### 3. Install Events Package in Services
```powershell
# Payment Service
cd Payment_Service
npm install file:../libs/events

# User Service (khi implement consumer)
cd User_Service
npm install file:../libs/events
```

### 4. Start Payment Service
```powershell
cd Payment_Service
docker-compose up -d --build
```

### 5. Verify Event Publishing
Check RabbitMQ Management UI:
- Go to: http://localhost:15672
- Check "Exchanges" → `ccm.events`
- Check "Queues" → should see `payment.events` với messages

Check Payment Service logs:
```powershell
docker logs payment_service_app -f
```

You should see:
```
[OutboxPublisherService] OutboxPublisher initialized. Starting background publishing...
[OutboxPublisherService] Publishing X pending events
[OutboxPublisherService] Published event: payment.completed (uuid) for aggregate PAY_xxx
```

## 📊 Monitoring

### RabbitMQ Management UI
- URL: http://localhost:15672
- Monitor:
  - Message rates
  - Queue lengths
  - Consumer activity
  - Connection status

### Outbox Statistics
Payment Service provides outbox statistics:
```typescript
// In PaymentController or create new endpoint
@Get('outbox/stats')
async getOutboxStats() {
  return this.outboxPublisherService.getStatistics();
}

// Response:
{
  "pending": 5,
  "published": 1234,
  "failed": 2
}
```

### Health Checks
```bash
# RabbitMQ
curl http://localhost:15672/api/health/checks/alarms

# Payment Service
curl http://localhost:3002/health
```

## 🔧 Troubleshooting

### RabbitMQ không kết nối được
```powershell
# Check if RabbitMQ is running
docker ps | findstr rabbitmq

# Check logs
docker logs ccm_rabbitmq

# Restart RabbitMQ
docker restart ccm_rabbitmq
```

### Events không được publish
```powershell
# Check Payment Service logs
docker logs payment_service_app -f

# Check outbox table
# Access Adminer: http://localhost:8082
# Query: SELECT * FROM outbox_events WHERE status = 'PENDING'

# Manually retry failed events (if endpoint created)
curl -X POST http://localhost:3002/api/outbox/retry
```

### Connection refused
- Verify `RABBITMQ_URL` in `.env`:
  - For Docker: `amqp://ccm_admin:ccm_password_2024@ccm_rabbitmq:5672/ccm_vhost`
  - For local dev: `amqp://ccm_admin:ccm_password_2024@localhost:5672/ccm_vhost`

## 🎯 Next Steps

### To Implement Consumers:
1. **User Service Consumer** (TODO)
   - Listen to `payment.completed`
   - Update user transaction history
   - Implement idempotency (store processed event IDs)

2. **Admin Service Consumer** (TODO)
   - Listen to `payment.*`, `user.*`, `kyc.*`
   - Sync to managed tables (eventual consistency)
   - Implement idempotency

### Example Consumer Code:
```typescript
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PaymentCompletedEvent, EVENT_TYPES } from '@ccm/events';

@Injectable()
export class PaymentConsumer {
  @RabbitSubscribe({
    exchange: 'ccm.events',
    routingKey: EVENT_TYPES.PAYMENT_COMPLETED,
    queue: 'user-service.payment-completed',
  })
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    // 1. Check idempotency
    const alreadyProcessed = await this.checkProcessed(event.id);
    if (alreadyProcessed) return;

    // 2. Process event
    await this.updateUserWallet(event.payload.userId, event.payload.amount);

    // 3. Mark as processed
    await this.markProcessed(event.id);
  }
}
```

## 📚 References

- [Shared Events README](./libs/events/README.md)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [@golevelup/nestjs-rabbitmq](https://github.com/golevelup/nestjs/tree/master/packages/rabbitmq)

## 🤝 Team Guidelines

1. **Never break event contracts** - Always maintain backward compatibility
2. **Version events** when schema changes
3. **Document new events** in `libs/events/README.md`
4. **Test with integration tests** before deploying
5. **Monitor RabbitMQ queues** regularly
6. **Implement idempotency** in all consumers
7. **Use correlationId** for distributed tracing
