# SYSTEM EVENT FLOW - Carbon Credit Marketplace

## ✅ ĐỒNG BỘ HOÀN TẤT

### Kiến trúc Event-Driven

```
Trip Service → trip.verified → Verification Service
                            ↓
              Verification Service → TripVerified event → Certificate Service
                                                        ↓
                            Certificate Service → certificate.generated → Notification Service
```

---

## 📊 CHI TIẾT EVENT FLOWS

### 1. TRIP VERIFICATION FLOW ✅

**Services liên quan:** Trip Service, Verification Service, Certificate Service, Notification Service

**Luồng sự kiện:**

1. **User hoàn thành chuyến đi** (Trip Service)
   - POST `/api/trips/{id}/complete`
   - Trip Service update status: `COMPLETED`
   - **Publish event:** `trip.verified` → Exchange: `ccm.events`, Routing Key: `trip.verified`

2. **Verification Service nhận event** ✅
   - Queue: `verification_service_events`
   - Consumer: Đang chạy (logs: "RabbitMQ consumer started")
   - Tạo verification record
   - CVA approve/reject verification
   - **Publish event:** `TripVerified` → Routing Key: `trip.verified`

3. **Certificate Service nhận event** ✅
   - Queue: `certificate_service_events`
   - Consumer: Đang chạy (logs: "Starting consumer for queue 'certificate_service_events'")
   - Event handler: `process_trip_verified_event()`
   - Generate PDF certificate
   - **Publish event:** `certificate.generated` → Routing Key: `certificate.generated`

4. **Notification Service nhận event** ✅
   - Queue: `notification_service_certificate.generated`
   - Consumer: Đang chạy (logs: "Listening to certificate.generated events")
   - Templates: CERT_GEN_EMAIL, CERT_GEN_PUSH, CERT_GEN_INAPP
   - Send notifications to user

**Event Data Structure:**

```typescript
// trip.verified (from Trip Service)
{
  event_type: "trip.verified",
  trip_id: number,
  user_id: number,
  verification_id: number,
  credit_amount: decimal,
  timestamp: string
}

// TripVerified (from Verification Service)
{
  event_type: "TripVerified",
  verification_id: number,
  trip_id: number,
  user_id: number,
  credit_amount: decimal
}

// certificate.generated (from Certificate Service)
{
  event_type: "CertificateGenerated",
  certificate_id: number,
  trip_id: number,
  user_id: number,
  cert_hash: string,
  template_id: number
}
```

---

### 2. PAYMENT FLOW ✅

**Services liên quan:** Payment Service, Admin Service, Notification Service

**Luồng sự kiện:**

1. **Payment completed** (Payment Service)
   - **Publish:** `payment.completed` → `ccm.events`

2. **Admin Service** ✅
   - Queue: `admin.payment-completed`
   - Update `managed_transaction` table status → `COMPLETED`

3. **Notification Service** ✅
   - Queue: `notification_service_payment.completed`
   - Template: `PAYMENT_COMPLETED`
   - Send notification to user

---

### 3. CREDIT ISSUANCE FLOW ✅

**Services liên quan:** Credit Service, Notification Service

**Luồng sự kiện:**

1. **Credit issued** (Credit Service)
   - **Publish:** `credit.issued` → `ccm.events`

2. **Notification Service** ✅
   - Queue: `notification_service_credit.issued`
   - Template: `CREDIT_ISSUED`
   - Send notification to user

---

### 4. LISTING MARKETPLACE FLOW ✅

**Services liên quan:** Listing Service, Notification Service

**Luồng sự kiện:**

1. **Listing created** (Listing Service)
   - **Publish:** `listing.created` → `ccm.events`

2. **Listing sold** (Listing Service)
   - **Publish:** `listing.sold` → `ccm.events`

3. **Notification Service** ✅
   - Queues: `notification_service_listing.created`, `notification_service_listing.sold`
   - Templates: `LISTING_CREATED`, `LISTING_SOLD`

---

### 5. WITHDRAWAL FLOW ✅

**Services liên quan:** Wallet Service, Notification Service

**Luồng sự kiện:**

1. **Withdrawal approved/rejected** (Wallet Service)
   - **Publish:** `withdrawal.approved` / `withdrawal.rejected` → `ccm.events`

2. **Notification Service** ✅
   - Queues: `notification_service_withdrawal.approved`, `notification_service_withdrawal.rejected`
   - Templates: `WITHDRAWAL_APPROVED`, `WITHDRAWAL_REJECTED`

---

## 🔧 INFRASTRUCTURE

### RabbitMQ Configuration ✅
- **Host:** `ccm_rabbitmq:5672`
- **VHost:** `ccm_vhost`
- **Credentials:** `ccm_admin:ccm_password_2024`
- **Exchange:** `ccm.events` (type: topic, durable: true)
- **Network:** `ccm_net` (external)

### Running Services ✅
```
✅ Trip Service          - Port 8091 (Spring Boot)
✅ Credit Service        - Port 8093 (Spring Boot)
✅ Verification Service  - Port 8006 (Python FastAPI) - MySQL 3326
✅ Certificate Service   - Port 3011 (Python FastAPI) - MySQL 3327
✅ Notification Service  - Port 3010 (NestJS) - MySQL 3320
✅ User Service          - Port 3001 (NestJS)
✅ Payment Service       - Port 3005 (NestJS)
✅ Admin Service         - Port 3002 (NestJS)
✅ RabbitMQ             - Port 5672 (AMQP), 15672 (Management UI)
```

### Docker Networks ✅
- `ccm_net` - Shared network for all microservices
- All services connected to ccm_net for RabbitMQ communication

---

## 🎨 FRONTEND INTEGRATION POINTS

### API Endpoints cần gọi:

#### 1. Trip Management
```
GET    /api/trips                    - List user trips
POST   /api/trips                    - Create new trip
GET    /api/trips/{id}               - Get trip details
POST   /api/trips/{id}/complete      - Complete trip (triggers verification)
```

#### 2. Verification (CVA Dashboard)
```
GET    /api/v1/verifications         - List all verifications (CVA)
GET    /api/v1/verifications/{id}    - Get verification details
POST   /api/v1/verifications/{id}/approve - Approve verification
POST   /api/v1/verifications/{id}/reject  - Reject verification
GET    /api/v1/verifications/stats/summary - Statistics
```

#### 3. Certificate
```
GET    /api/certificates             - List user certificates
GET    /api/certificates/{id}        - Get certificate details
GET    /api/certificates/{id}/download - Download PDF
POST   /api/certificates/{id}/verify - Verify certificate authenticity
```

#### 4. Credit Management
```
GET    /api/credits/balance          - Get user credit balance
GET    /api/credits/transactions     - List credit transactions
POST   /api/credits/transfer         - Transfer credits
```

#### 5. Listing Marketplace
```
GET    /api/listings                 - Browse marketplace listings
POST   /api/listings                 - Create new listing
POST   /api/listings/{id}/purchase   - Buy credits from listing
```

#### 6. Notifications
```
GET    /api/notifications            - Get user notifications
POST   /api/notifications/{id}/read  - Mark as read
GET    /api/notifications/preferences - Get notification settings
PUT    /api/notifications/preferences - Update notification settings
```

#### 7. Wallet & Payment
```
GET    /api/wallet/balance           - Get wallet balance
POST   /api/wallet/deposit           - Deposit funds
POST   /api/wallet/withdraw          - Withdraw funds
GET    /api/payment/history          - Payment history
POST   /api/payment/vnpay/create     - Create VNPay payment
```

---

## 🔐 Authentication

**JWT Token:** Shared secret `Huyhoang24042005` across all services

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**User Roles:**
- `USER` - Regular user (create trips, buy credits, view own certificates)
- `CVA` - Carbon Verification Auditor (approve/reject verifications)
- `ADMIN` - System administrator

---

## 🧪 TESTING EVENT FLOW

### Test Complete Flow:

```bash
# 1. Create user and login (User Service)
POST http://localhost:3001/api/auth/register
POST http://localhost:3001/api/auth/login

# 2. Create trip (Trip Service)
POST http://localhost:8091/api/trips
{
  "userId": 1,
  "startLocation": "Hanoi",
  "endLocation": "Ho Chi Minh",
  "distance": 1500,
  "vehicleType": "electric_car"
}

# 3. Complete trip (triggers verification)
POST http://localhost:8091/api/trips/{tripId}/complete

# 4. CVA approve verification (Verification Service)
POST http://localhost:8006/api/v1/verifications/{verificationId}/approve

# 5. Check certificate generated (Certificate Service)
GET http://localhost:3011/api/certificates?user_id=1

# 6. Check notifications received (Notification Service)
GET http://localhost:3010/api/notifications
```

### Verify RabbitMQ Messages:

**RabbitMQ Management UI:** http://localhost:15672
- Username: `ccm_admin`
- Password: `ccm_password_2024`

**Check Queues:**
- `verification_service_events` - Should have 1 consumer
- `certificate_service_events` - Should have 1 consumer
- `notification_service_certificate.generated` - Should have 1 consumer

---

## ✅ CHECKLIST ĐỒNG BỘ

- [x] **Verification Service** - Database connected, RabbitMQ consumer running
- [x] **Certificate Service** - Database connected, RabbitMQ consumer running, Publishes certificate.generated
- [x] **Notification Service** - Subscribes to certificate.generated, Templates added
- [x] **Trip Service** - Publishes trip.verified
- [x] **All services** - Connected to ccm_net network
- [x] **RabbitMQ** - Exchange ccm.events configured, all queues bound
- [x] **JWT** - Shared secret synchronized

---

## 🚀 READY FOR FRONTEND

Tất cả backend services đã đồng bộ và sẵn sàng. Frontend có thể:

1. ✅ Gọi các API endpoints trên
2. ✅ Sử dụng JWT authentication
3. ✅ Nhận real-time notifications từ Notification Service
4. ✅ Download certificates dạng PDF
5. ✅ View verification status real-time
6. ✅ Marketplace trading credits

**Next Steps:**
- Triển khai React/Vue.js frontend
- Integrate WebSocket/SSE cho real-time notifications
- Setup Nginx gateway cho API routing
- Configure CORS policies
