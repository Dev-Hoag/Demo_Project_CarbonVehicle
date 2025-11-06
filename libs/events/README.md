# @ccm/events

Shared event schemas and types for Carbon Credit Marketplace microservices.

## Purpose

This package provides:
- **Standardized event contracts** that all services agree on
- **Type safety** with TypeScript interfaces and classes
- **Validation** using class-validator
- **Versioning support** for backward compatibility
- **Tracing metadata** (correlationId, causationId)

## Installation

```bash
# In each service that needs to publish/consume events
npm install file:../../libs/events
# or with pnpm
pnpm add file:../../libs/events
```

## Usage

### Publishing an Event

```typescript
import { PaymentCompletedEvent } from '@ccm/events';

// Create event
const event = new PaymentCompletedEvent(
  'PAY_123456', // aggregateId
  {
    paymentCode: 'PAY_123456',
    transactionId: 'TXN_789',
    userId: 1,
    gateway: 'VNPAY',
    amount: 100000,
    currency: 'VND',
    orderInfo: 'Purchase carbon credits',
    gatewayTransactionId: 'VNP_123',
    completedAt: new Date().toISOString(),
  },
  {
    correlationId: 'corr-123',
    actor: 'system',
  }
);

// Publish to message broker
await publisher.publish(event);
```

### Consuming an Event

```typescript
import { PaymentCompletedEvent, EVENT_TYPES } from '@ccm/events';

@RabbitSubscribe({
  exchange: 'ccm.events',
  routingKey: EVENT_TYPES.PAYMENT_COMPLETED,
  queue: 'user-service.payment-completed',
})
async handlePaymentCompleted(event: PaymentCompletedEvent) {
  // Validate
  const errors = await validate(event);
  if (errors.length > 0) {
    throw new Error('Invalid event');
  }

  // Process idempotently
  const alreadyProcessed = await this.checkProcessed(event.id);
  if (alreadyProcessed) return;

  // Handle event
  await this.updateUserWallet(event.payload.userId, event.payload.amount);
  
  // Mark as processed
  await this.markProcessed(event.id);
}
```

## Event Catalog

### Payment Events

| Event Type | Description | Producer | Consumers |
|------------|-------------|----------|-----------|
| `payment.initiated` | Payment created, pending gateway | Payment Service | Admin Service (audit) |
| `payment.completed` | Payment successful | Payment Service | User Service (wallet), Admin Service |
| `payment.failed` | Payment failed | Payment Service | User Service (notification), Admin Service |
| `payment.refunded` | Payment refunded | Payment Service | User Service (wallet), Admin Service |

### User Events

| Event Type | Description | Producer | Consumers |
|------------|-------------|----------|-----------|
| `user.created` | New user registered | User Service | Admin Service (mirror), Notification Service |
| `user.verified` | Email verified | User Service | Admin Service, Notification Service |
| `user.status_changed` | User locked/suspended/activated | User Service | Admin Service (mirror) |
| `user.profile_updated` | Profile changed | User Service | Admin Service (mirror) |

### KYC Events

| Event Type | Description | Producer | Consumers |
|------------|-------------|----------|-----------|
| `kyc.document_uploaded` | User uploaded KYC doc | User Service | Admin Service (review queue) |
| `kyc.document_verified` | CVA verified document | User Service | Admin Service, Notification Service |
| `kyc.status_changed` | KYC status changed | User Service | Admin Service, Notification Service |

## Event Structure

All events extend `BaseEvent` and follow this structure:

```typescript
{
  id: "uuid-v4",                    // Unique event ID
  type: "payment.completed",        // Event type
  version: 1,                       // Schema version
  source: "payment-service",        // Producer service
  aggregateId: "PAY_123",           // Aggregate root ID
  timestamp: "2025-11-06T...",      // ISO 8601
  payload: { ... },                 // Event-specific data
  metadata: {
    correlationId: "uuid",          // For tracing
    causationId: "uuid",            // Causality chain
    retries: 0,                     // Retry count
    actor: "user@example.com"       // Who triggered it
  }
}
```

## Best Practices

### 1. Idempotency
Always check if event was already processed:

```typescript
const processed = await db.query(
  'SELECT 1 FROM processed_events WHERE event_id = ?',
  [event.id]
);
if (processed) return;
```

### 2. Correlation Tracing
Pass correlationId through the entire flow:

```typescript
const correlationId = event.metadata.correlationId;
logger.info({ correlationId }, 'Processing payment completed');
```

### 3. Versioning
When changing event structure, increment version:

```typescript
// v2 of event
export class PaymentCompletedEventV2 extends BaseEvent {
  static readonly VERSION = 2;
  // ... new fields
}
```

Consumers should handle multiple versions:

```typescript
if (event.version === 1) {
  // Handle v1
} else if (event.version === 2) {
  // Handle v2
}
```

### 4. Error Handling
Always wrap processing in try-catch:

```typescript
try {
  await this.handleEvent(event);
} catch (error) {
  logger.error({ event, error }, 'Failed to process event');
  throw error; // Will be retried or moved to DLQ
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Clean
npm run clean
```

## Team Guidelines

- **Never break contracts**: Always maintain backward compatibility
- **Version when needed**: Increment version for breaking changes
- **Document changes**: Update this README when adding events
- **Test contracts**: Write tests for event serialization/deserialization
- **Code review**: All event changes require review from architecture team
