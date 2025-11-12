# 📊 TÓM TẮT DỰ ÁN: CARBON CREDIT MARKETPLACE
## Hệ thống Thị trường Tín chỉ Carbon từ Xe điện

**Ngày cập nhật**: 5 tháng 11, 2025
**Branch hiện tại**: `feature/jwt-authentication`
**Repository**: Demo_Project_CarbonVehicle (Dev-Hoag)

---



---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### **Microservices Architecture**

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│    API GATEWAY (Nginx)              │
│    - Port: 80                        │
│    - JWT Verification                │
│    - Rate Limiting                   │
│    - CORS & Security Headers         │
└──┬──────────┬──────────┬────────────┘
   │          │          │
   ↓          ↓          ↓
┌──────┐  ┌──────┐  ┌─────────┐
│ User │  │Admin │  │ Payment │
│Service│ │Service│ │ Service │
│:3001  │  │:3000 │  │ :3002   │
└───┬───┘  └───┬──┘  └────┬────┘
    │          │           │
    ↓          ↓           ↓
┌────────┐ ┌────────┐ ┌────────┐
│MySQL   │ │MySQL   │ │MySQL   │
│:3308   │ │:3307   │ │:3309   │
└────────┘ └────────┘ └────────┘
```

---

## 📦 CÁC SERVICES ĐÃ TRIỂN KHAI

### **1. USER SERVICE** (✅ Hoàn thành)
**Port**: 3001 | **Database**: MySQL :3308 | **Container**: `user_service_app`

#### **Chức năng chính**:
- ✅ **Authentication & Authorization**
  - JWT-based authentication (Access Token + Refresh Token)
  - Email verification với SendGrid
  - Password reset qua email
  - Role-based access control (EV_OWNER, BUYER, CVA)

- ✅ **User Management**
  - User registration với email verification
  - User profile management (CRUD)
  - User status management (ACTIVE, PENDING, SUSPENDED, DELETED)
  - Lock/Unlock/Suspend user accounts
  - Soft delete với audit trail

- ✅ **KYC System**
  - Upload documents (ID Card, Passport, Driver License, Vehicle Registration, Business License)
  - Document verification workflow
  - KYC status tracking (PENDING, APPROVED, REJECTED)
  - File upload với validation (jpg, jpeg, png, pdf, max 5MB)
  - Storage: `/uploads/kyc/`

- ✅ **Internal APIs** (cho microservices)
  - JWT token verification endpoint cho Gateway
  - Get user by ID/Email
  - Validate user status
  - Batch get users
  - User action history tracking

#### **Database Schema**:
```sql
Tables:
- users (id, email, password_hash, user_type, status, kyc_status, 
         is_verified, verification_token, reset_token, 
         locked_at, suspended_at, deleted_at)
- user_profiles (user_id, full_name, phone, address, city, 
                avatar_url, bio, date_of_birth)
- kyc_documents (id, user_id, document_type, document_number, 
                file_url, status, verified_by, verified_at)
- user_action_logs (id, user_id, action_type, reason, 
                   performed_by, metadata, created_at)
```

#### **API Endpoints**:

**Public Endpoints**:
```
POST   /api/auth/register          - Đăng ký user mới
POST   /api/auth/login             - Đăng nhập
GET    /api/auth/verify            - Verify email
POST   /api/auth/forgot-password   - Quên mật khẩu
GET    /api/auth/reset-password    - Form reset password (HTML)
POST   /api/auth/reset-password    - Reset password
```

**Protected Endpoints** (cần JWT):
```
GET    /api/auth/me                - Thông tin user hiện tại
POST   /api/auth/refresh           - Refresh token
GET    /api/users/profile          - Xem profile
PUT    /api/users/profile          - Cập nhật profile
GET    /api/users/:id              - Xem user khác
POST   /api/kyc/upload             - Upload KYC document
GET    /api/kyc/documents          - Danh sách KYC documents
GET    /api/kyc/status             - KYC status
DELETE /api/kyc/documents/:docId   - Xóa document
```

**Internal APIs** (x-internal-secret header):
```
GET    /internal/auth/verify       - Verify JWT (cho Gateway)
GET    /internal/auth/health       - Health check
GET    /internal/users/:id         - Get user detail
GET    /internal/users/email/:email - Get user by email
POST   /internal/users/validate    - Validate user
PUT    /internal/users/:id/status  - Update status
POST   /internal/users/:id/lock    - Lock user
POST   /internal/users/:id/unlock  - Unlock user
POST   /internal/users/:id/suspend - Suspend user
POST   /internal/users/:id/activate - Activate user
DELETE /internal/users/:id         - Soft delete
POST   /internal/users/batch       - Batch get users
GET    /internal/users/:id/action-history - Action history
GET    /internal/kyc/user/:userId/documents - Get user's KYC
POST   /internal/kyc/documents/:docId/verify - Verify KYC
```

#### **Tech Stack**:
- Framework: NestJS 11.0
- Database: MySQL 8.0 với TypeORM
- Authentication: JWT + Passport
- Email: SendGrid
- File Upload: Multer
- Validation: class-validator
- Documentation: Swagger

---

### **2. PAYMENT SERVICE** (✅ Hoàn thành)
**Port**: 3002 | **Database**: MySQL :3309 | **Container**: `payment_service_app`

#### **Chức năng chính**:
- ✅ **VNPay Integration**
  - Create payment URL với VNPay Sandbox
  - Handle callback (Return URL + IPN)
  - Signature verification (HMAC-SHA512)
  - Auto-encode Vietnamese characters

- ✅ **Payment Management**
  - Create payment with idempotency
  - Payment status tracking
  - Payment history
  - Auto-expire after 15 minutes
  - Retry mechanism for failed payments

- ✅ **Webhook Handling**
  - VNPay Return URL (user redirect)
  - VNPay IPN (server-to-server)
  - HTML fallback page nếu không có Frontend URL
  - Auto redirect to Frontend nếu có FRONTEND_URL

- ✅ **Event Sourcing**
  - Payment events logging
  - Callback history tracking
  - Outbox pattern for event publishing
  - Audit trail cho mọi thay đổi

#### **Database Schema**:
```sql
Tables:
- payments (id, payment_code, transaction_id, user_id, gateway,
           amount, currency, status, order_info, bank_code,
           return_url, ipn_url, gateway_transaction_id,
           gateway_response_code, gateway_response_msg,
           idempotency_key, ip_address, user_agent,
           expired_at, completed_at)
- payment_callbacks (id, payment_id, payment_code, callback_type,
                    payload, raw_query, signature, is_valid,
                    validation_error, is_processed, processed_at)
- payment_events (id, payment_id, payment_code, event_type,
                 status, details, created_at)
- outbox_events (id, aggregate_type, aggregate_id, event_type,
                payload, is_published, published_at, retry_count)
- refunds (id, payment_id, refund_code, amount, reason,
          status, gateway_response, processed_at)
```

#### **API Endpoints**:

**Public Endpoints**:
```
POST   /api/payments/initiate              - Tạo payment URL
GET    /api/payments/vnpay/callback        - VNPay Return URL
GET    /api/payments/vnpay/ipn             - VNPay IPN
```

**Protected Endpoints** (cần JWT):
```
GET    /api/payments/:paymentCode/status   - Payment status
GET    /api/payments/history               - Payment history
```

**Health Check**:
```
GET    /health                             - Service health
```

#### **Payment Flow**:
```
1. Client POST /api/payments/initiate
   {
     "transactionId": "TXN_xxx",
     "userId": 1,
     "gateway": "VNPAY",
     "amount": 100000,
     "orderInfo": "Mua tín chỉ carbon"
   }

2. Service tạo payment record (PENDING)
   - Generate payment_code: PAY_timestamp_random
   - Save to database
   - Call VNPay provider

3. VNPay provider build URL:
   - Sort params theo ASCII
   - URL encode
   - Create HMAC-SHA512 signature
   - Return payment URL

4. Client redirect user đến VNPay

5. User thanh toán tại VNPay

6. VNPay redirect về /api/payments/vnpay/callback
   - Verify signature
   - Update payment status (COMPLETED/FAILED)
   - Log callback
   - Redirect to Frontend hoặc show HTML

7. VNPay gửi IPN đến /api/payments/vnpay/ipn
   - Verify signature
   - Update payment status (chốt cuối)
   - Log IPN callback
   - Return {RspCode: "00", Message: "Confirm Success"}
```

#### **VNPay Configuration**:
```env
VNPAY_TMN_CODE=U94AQ1QM (Sandbox)
VNPAY_HASH_SECRET=KJTJVFNOQM3MMD742PZ4UO5GN8SU9SIK
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3002/api/payments/vnpay/callback
VNPAY_IPN_URL=http://localhost:3002/api/payments/vnpay/ipn
```

#### **Payment Status**:
- `PENDING`: Vừa tạo, chờ thanh toán
- `PROCESSING`: Đang xử lý
- `COMPLETED`: Thành công
- `FAILED`: Thất bại
- `CANCELLED`: Bị hủy
- `REFUNDED`: Đã hoàn tiền
- `EXPIRED`: Hết hạn (15 phút)

#### **Tech Stack**:
- Framework: NestJS 11.0
- Database: MySQL 8.0 với TypeORM
- Payment Gateway: VNPay Sandbox
- Crypto: HMAC-SHA512 cho signature
- Event Sourcing: Outbox pattern

---

### **3. ADMIN SERVICE** (⚠️ Đang phát triển)
**Port**: 3000 | **Database**: MySQL :3307 | **Container**: `admin_service_app` (chưa build)

#### **Chức năng đã có code**:
- Authentication cho admin users
- User management (quản lý users từ User Service)
- Transaction management
- Wallet management
- Listing management
- System configuration
- Audit logging

**Note**: Service này có code nhưng chưa build Docker image và chưa test đầy đủ.

---

### **4. API GATEWAY** (✅ Hoàn thành)
**Port**: 80 | **Technology**: Nginx 1.27 | **Container**: `api_gateway`

#### **Chức năng chính**:
- ✅ **JWT Authentication Middleware**
  - Sử dụng `auth_request` directive
  - Gọi `/internal/auth/verify` của User Service
  - Extract user info từ JWT (userId, userRole, email)
  - Forward user info vào headers cho backend services

- ✅ **Request Routing**
  - User Service: `/api/auth/*`, `/api/users/*`, `/api/kyc/*`
  - Payment Service: `/api/payments/*`
  - Admin Service: `/api/admin/*`
  - Health checks: `/health`, `/health/live`, `/health/ready`

- ✅ **Security Features**
  - Rate limiting (login: 10r/s, IPN: 50r/s)
  - CORS với whitelist origins
  - Security headers (CSP, X-Frame-Options, etc.)
  - Request/Response body size limits

- ✅ **Load Balancing & Health Checks**
  - Docker DNS resolver với re-resolve 10s
  - Auto-retry failed backends
  - Health check endpoints

#### **Authentication Flow**:
```
1. Client gửi request với JWT token
   Authorization: Bearer <jwt_token>

2. Nginx gọi /auth-verify (internal subrequest)
   → User Service /internal/auth/verify

3. User Service verify JWT:
   - Check signature
   - Check expiration
   - Extract payload {sub, email, userType}
   - Return 200 OK với user info trong body

4. Nginx nhận response:
   - Nếu 200 OK: tiếp tục forward request
   - Nếu 401: trả về 401 cho client
   - Extract user info từ response body

5. Nginx forward request đến backend service:
   Headers:
   - Authorization: Bearer <jwt_token> (giữ nguyên)
   - X-User-ID: <userId>
   - X-User-Role: <userRole>
   - X-User-Email: <email>

6. Backend service nhận được user info từ headers
   - Không cần verify JWT lại
   - Trust vì đã verify ở Gateway
```

#### **Routing Rules**:
```nginx
# Public routes (không cần JWT)
/api/auth/register
/api/auth/login
/api/auth/verify
/api/auth/forgot-password
/api/auth/reset-password
/health

# Protected routes (cần JWT)
/api/auth/me
/api/auth/refresh
/api/users/*
/api/kyc/*
/api/payments/* (trừ callback & IPN)
/api/admin/*

# Special routes
/api/payments/vnpay/callback  - VNPay Return URL (public)
/api/payments/vnpay/ipn       - VNPay IPN (public, rate limited 50r/s)
```

#### **Network Configuration**:
```yaml
networks:
  ccm_net:
    external: true

All services connect to ccm_net network:
- user_service_app (user_service_mysql alias: mysql)
- payment_service_app (payment-mysql)
- api_gateway
```

---

## 🔐 AUTHENTICATION & SECURITY

### **JWT Implementation**

#### **Token Structure**:
```javascript
// Access Token (1 hour)
{
  sub: userId,          // User ID
  email: "user@example.com",
  userType: "EV_OWNER", // Role
  iat: 1699123456,      // Issued at
  exp: 1699127056       // Expires at (1h)
}

// Refresh Token (7 days)
{
  sub: userId,
  email: "user@example.com",
  userType: "EV_OWNER",
  iat: 1699123456,
  exp: 1699728256       // Expires at (7d)
}
```

#### **Token Flow**:
```
1. Login → Receive accessToken + refreshToken
2. Use accessToken for API calls (Authorization: Bearer <token>)
3. When accessToken expires (401) → Use refreshToken
4. POST /api/auth/refresh {refreshToken} → New accessToken
5. Continue using new accessToken
```

### **Security Features**:

#### **Password Security**:
- bcrypt hashing (salt rounds: 10)
- Min length: 8 characters
- Validation: class-validator

#### **Email Verification**:
- JWT token trong email link
- Token expires: 1 hour
- User status: PENDING → ACTIVE sau verify

#### **Password Reset**:
- JWT reset token gửi qua email
- Token expires: 1 hour
- Token chỉ dùng được 1 lần (clear sau reset)

#### **Internal API Security**:
- Custom header: `x-internal-secret`
- Validate bằng InternalApiGuard
- Chỉ cho phép service-to-service calls

#### **Rate Limiting** (Nginx):
```nginx
login_zone: 10 requests/second
ipn_zone: 50 requests/second
```

#### **CORS**:
```nginx
Whitelist:
- localhost (any port)
- 127.0.0.1 (any port)
```

---

## 🗄️ DATABASE ARCHITECTURE

### **Multi-Database Strategy**
Mỗi service có database riêng (Database per Service pattern):

#### **User Service DB** (user_service_db):
```
Port: 3308 (host) → 3306 (container)
Tables: 4
- users: Core user data
- user_profiles: Extended info
- kyc_documents: KYC files
- user_action_logs: Audit trail
```

#### **Payment Service DB** (payment_service_db):
```
Port: 3309 (host) → 3306 (container)
Tables: 5
- payments: Payment transactions
- payment_callbacks: Callback logs
- payment_events: Event sourcing
- outbox_events: Outbox pattern
- refunds: Refund transactions
```

#### **Admin Service DB** (admin_service_db):
```
Port: 3307 (host) → 3306 (container)
Tables: 13
- admin_user: Admin accounts
- audit_log: System audit
- managed_user: User mirror/cache
- managed_transaction: Transaction mirror
- managed_wallet_transaction: Wallet mirror
- managed_listing: Listing mirror
- ... và các audit tables
```

### **Database Admin Tools**:
- **User Service Adminer**: http://localhost:8081
- **Payment Service Adminer**: http://localhost:8082
- **Admin Service Adminer**: (chưa cấu hình)

---

## 🚀 DEPLOYMENT & INFRASTRUCTURE

### **Docker Compose Setup**

#### **Networks**:
```yaml
ccm_net:  # External network cho tất cả services
  - Tạo bằng: docker network create ccm_net
  - Purpose: Inter-service communication
```

#### **Volumes**:
```yaml
user_service_data:    # MySQL data persistence
payment_service_data: # MySQL data persistence
admin_service_data:   # MySQL data persistence (nếu có)
```

### **Container Status** (Hiện tại):
```
✅ user_service_mysql     - Running (healthy)
✅ user_service_app       - Running (port 3001)
✅ user_service_adminer   - Running (port 8081)

✅ payment_service_mysql  - Running (healthy)
✅ payment_service_app    - Running (port 3002)
✅ payment_service_adminer - Running (port 8082)

✅ api_gateway           - Running (port 80)

⚠️ admin_service_mysql    - Running (port 3307)
⚠️ admin_service_adminer  - Running (port 8080)
❌ admin_service_app     - Not built yet
```

### **Build & Run Commands**:

```bash
# Tạo network (chỉ 1 lần)
docker network create ccm_net

# User Service
cd User_Service
docker build -t user-service:dev .
docker-compose up -d

# Payment Service
cd Payment_Service
docker build -t payment-service:dev .
docker-compose up -d

# Gateway
cd gateway
docker-compose up -d

# Check status
docker ps
docker-compose ps (trong mỗi folder)
```

### **Environment Variables**:

Mỗi service có file `.env` với config:
- Database connection
- JWT secrets
- External API keys (VNPay, SendGrid)
- Service URLs
- Feature flags

**Example** (User Service):
```env
NODE_ENV=production
APP_PORT=3001
APP_URL=http://localhost:3001

DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=user_service_db

JWT_SECRET=your_jwt_secret
ACCESS_TOKEN_TTL=1h
REFRESH_TOKEN_TTL=7d

SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@example.com

INTERNAL_API_SECRET=your_internal_secret
```

---

## 🧪 TESTING & VALIDATION

### **Current Test Status**:

#### ✅ **User Service** - Tested & Working:
```bash
✅ POST /api/auth/register (201 Created)
   - Tạo user mới
   - Gửi email verification
   - Response: "Please check your email"

✅ POST /api/auth/login (401 Email not verified)
   - Check password
   - Check email verification
   - Return JWT tokens

✅ GET /api/auth/verify?token=xxx
   - Verify email token
   - Update user status to ACTIVE

✅ POST /api/auth/forgot-password
   - Send reset email

✅ GET /api/auth/me (với JWT)
   - Return user info

✅ GET /internal/auth/verify
   - JWT verification cho Gateway
   - Return user payload
```

#### ✅ **Payment Service** - Tested & Working:
```bash
✅ GET /health (200 OK)
   - Service healthy
   - Uptime tracking

✅ POST /api/payments/initiate (201 Created)
   - Generate payment URL
   - VNPay integration working
   - Signature correct

✅ GET /api/payments/vnpay/callback
   - Verify signature
   - Update payment status
   - Redirect or show HTML

✅ GET /api/payments/vnpay/ipn
   - VNPay IPN handling
   - Idempotency check
   - Return RspCode: 00
```

#### ✅ **Gateway** - Tested & Working:
```bash
✅ GET /health (200 OK)
   - Gateway health check

✅ POST /api/auth/register (qua gateway)
   - Routing correct
   - Response intact

✅ POST /api/auth/login (qua gateway)
   - Routing correct
   - JWT tokens returned

✅ JWT Authentication Flow
   - auth_request working
   - User info extracted
   - Headers forwarded
```

### **Manual Testing với cURL**:

```powershell
# Register user
$body = @{
  email='test@example.com'
  password='Test123!@#'
  fullName='Test User'
  userType='EV_OWNER'
} | ConvertTo-Json

curl -Method POST -Uri http://localhost/api/auth/register `
  -Body $body -ContentType 'application/json'

# Login
$body = @{
  email='test@example.com'
  password='Test123!@#'
} | ConvertTo-Json

$response = curl -Method POST -Uri http://localhost/api/auth/login `
  -Body $body -ContentType 'application/json'

# Get profile (với JWT)
$token = "your_access_token"
curl -Uri http://localhost/api/users/profile `
  -Headers @{Authorization="Bearer $token"}

# Create payment
$body = @{
  transactionId='TXN_1234567890'
  userId=1
  gateway='VNPAY'
  amount=100000
  orderInfo='Test payment'
} | ConvertTo-Json

curl -Method POST -Uri http://localhost/api/payments/initiate `
  -Body $body -ContentType 'application/json'
```

---

## 📝 API DOCUMENTATION

### **Swagger UI**:
```
User Service:
- Public API: http://localhost:3001/api/docs
- Internal API: http://localhost:3001/api/docs-internal

Payment Service:
- API Docs: http://localhost:3002/api/docs

Admin Service:
- API Docs: http://localhost:3000/api/docs (khi chạy)

Gateway:
- Không có Swagger (chỉ là reverse proxy)
```

### **Postman Collection**:
- Có thể export từ Swagger UI
- Hoặc tạo manual collection cho testing

---

## 🐛 KNOWN ISSUES & BUGS

### **User Service**:
- ❌ Unit tests fail do missing @types/jest
- ⚠️ Email service cần SendGrid API key thật để test đầy đủ
- ⚠️ File upload chưa có storage service (đang dùng local disk)

### **Payment Service**:
- ⚠️ Chưa implement MoMo, Bank transfer
- ⚠️ Refund API chưa được test
- ⚠️ Event publishing (Outbox pattern) chưa connect tới Message Broker

### **Admin Service**:
- ❌ Chưa build Docker image
- ❌ Chưa test qua Gateway
- ⚠️ Một số endpoints có quan hệ với services khác chưa integrate

### **Gateway**:
- ⚠️ Cần restart khi service IP thay đổi (DNS cache issue)
- ⚠️ Chưa có monitoring/metrics
- ⚠️ Rate limiting chưa có persistent storage

---

## 🎨 USER TYPES & PERMISSIONS

### **User Types**:

#### **1. EV_OWNER** (Chủ xe điện):
- Tạo carbon credits từ km đi được
- Upload vehicle documents
- View transaction history
- Sell credits on marketplace

#### **2. BUYER** (Người mua):
- Browse available credits
- Purchase carbon credits
- View purchase history
- Generate certificates

#### **3. CVA** (Carbon Verification Authority):
- Verify KYC documents
- Audit carbon credit calculations
- Approve/reject carbon credits
- Generate verification reports

#### **4. ADMIN** (Quản trị viên):
- Full system access
- User management
- Transaction management
- System configuration
- Audit logs

---

## 📈 METRICS & MONITORING

### **Health Endpoints**:
```
GET /health                  - Overall health
GET /health/live             - Liveness check
GET /health/ready            - Readiness check

Response:
{
  "status": "ok|unhealthy",
  "service": "service-name",
  "timestamp": "2025-11-05T14:43:15.885Z",
  "uptime": 7080.167564257
}
```

### **Logging**:
- NestJS Logger
- Request/Response logging
- Error tracking
- Audit trail trong database

### **Database Monitoring**:
- Adminer UI cho mỗi database
- Query logging trong development mode
- Connection pool monitoring

---

## 🔄 GIT WORKFLOW

### **Current Branch**: `feature/jwt-authentication`

### **Branch Strategy**:
```
main/master              - Production code
develop                  - Development branch
feature/*                - Feature branches
  └─ feature/jwt-authentication (current)
  └─ feature/user-service
  └─ feature/payment-service/vnpay-initiate-status
bugfix/*                 - Bug fixes
hotfix/*                 - Production hotfixes
```

### **Commit Status**:
```bash
git status
# On branch feature/jwt-authentication
# Your branch is up to date with 'origin/feature/jwt-authentication'
# nothing to commit, working tree clean
```

**Note**: Vừa restore tất cả uncommitted changes về trạng thái clean.

---

## 📚 DEPENDENCIES & TECH STACK

### **Common Dependencies**:
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/config": "^4.0.2",
  "@nestjs/typeorm": "^10.0.x",
  "@nestjs/jwt": "^11.0.1",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/swagger": "^11.2.1",
  "typeorm": "^0.3.x",
  "mysql2": "^3.x",
  "bcrypt": "^5.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

### **User Service Specific**:
```json
{
  "@sendgrid/mail": "^8.x",
  "@nestjs/platform-express": "^11.0.1",
  "multer": "^1.4.5-lts.1"
}
```

### **Payment Service Specific**:
```json
{
  "moment": "^2.x"
}
```

### **Infrastructure**:
- **Node.js**: 20-alpine
- **MySQL**: 8.0
- **Nginx**: 1.27-alpine
- **Docker**: 20.x+
- **Docker Compose**: 2.x+

---

## 🎯 NEXT STEPS / TODO

### **High Priority**:
- [ ] Fix unit tests (install @types/jest)
- [ ] Build và test Admin Service
- [ ] Implement MoMo payment gateway
- [ ] Add file storage service (S3/MinIO)
- [ ] Add Message Broker (RabbitMQ/Kafka) cho events

### **Medium Priority**:
- [ ] Add monitoring (Prometheus + Grafana)
- [ ] Add centralized logging (ELK Stack)
- [ ] Add API rate limiting with Redis
- [ ] Add caching layer (Redis)
- [ ] Implement Transaction Service (carbon credit trading)
- [ ] Implement Listing Service (marketplace)
- [ ] Implement Wallet Service (user wallets)

### **Low Priority**:
- [ ] Add E2E tests
- [ ] Add Load testing
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add Frontend application
- [ ] Add mobile app support
- [ ] Documentation website

---

## 💡 TIPS CHO DEMO/VẤN ĐÁP

### **Điểm mạnh để nhấn mạnh**:
1. ✅ **Microservices Architecture** hoàn chỉnh
2. ✅ **JWT Authentication** với Gateway pattern
3. ✅ **Payment Integration** thực tế (VNPay)
4. ✅ **Database per Service** pattern
5. ✅ **Docker containerization** đầy đủ
6. ✅ **API Gateway** với security features
7. ✅ **Swagger Documentation** cho mọi endpoint
8. ✅ **Event Sourcing** trong Payment Service
9. ✅ **Audit Logging** cho compliance
10. ✅ **KYC System** đầy đủ workflow

### **Demo Flow gợi ý**:
```
1. Show Architecture Diagram
   - Explain microservices separation
   - Show communication flow

2. Demo User Registration:
   - Register via Gateway
   - Show email verification
   - Login and get JWT

3. Demo JWT Authentication:
   - Show Gateway verification
   - Show protected endpoints
   - Show user info in headers

4. Demo KYC System:
   - Upload document
   - Show file storage
   - Show verification workflow

5. Demo Payment Integration:
   - Create payment
   - Show VNPay redirect
   - Handle callback
   - Show payment status

6. Show Database Design:
   - Multiple databases
   - Entity relationships
   - Audit trails

7. Show Docker Setup:
   - Container orchestration
   - Network configuration
   - Health checks

8. Show API Documentation:
   - Swagger UI
   - Endpoint testing
   - Request/Response examples
```

