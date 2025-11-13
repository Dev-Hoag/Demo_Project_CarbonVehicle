# 🚀 Setup Guide - Carbon Credit Marketplace

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Git với submodule support
- Node.js 20+ (optional - chỉ cần nếu develop)
- 8GB RAM minimum
- 20GB disk space

---

## 🔧 Quick Start - Clone & Run

### Step 1: Clone Repository với Submodules

```bash
# Clone toàn bộ project bao gồm tất cả submodules
git clone --recurse-submodules https://github.com/Dev-Hoag/Demo_Project_CarbonVehicle.git

# Hoặc nếu đã clone rồi nhưng thiếu submodules
cd Demo_Project_CarbonVehicle
git submodule update --init --recursive

# Checkout nhánh stable
git checkout release/stable-v1.0
git submodule update --remote --merge
```

### Step 2: Tạo Docker Network

```bash
# Tạo network cho các services giao tiếp
docker network create ccm_net
```

### Step 3: Setup Environment Variables

Tạo file `.env` cho mỗi service (hoặc dùng mẫu có sẵn):

**User Service** (`User_Service/.env`):
```env
NODE_ENV=production
APP_PORT=3001
APP_URL=http://localhost:3001

DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root_password_123
DB_DATABASE=user_service_db

JWT_SECRET=your_jwt_secret_key_here_change_in_production
ACCESS_TOKEN_TTL=1h
REFRESH_TOKEN_TTL=7d

SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@carbonmarket.com
SENDGRID_FROM_NAME=Carbon Credit Marketplace

INTERNAL_API_SECRET=internal_secret_123
FRONTEND_URL=http://localhost:5173
```

**Payment Service** (`Payment_Service/.env`):
```env
NODE_ENV=production
APP_PORT=3002
APP_URL=http://localhost:3002

DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root_password_123
DB_DATABASE=payment_service_db

JWT_SECRET=your_jwt_secret_key_here_change_in_production

# VNPay Sandbox
VNPAY_TMN_CODE=U94AQ1QM
VNPAY_HASH_SECRET=KJTJVFNOQM3MMD742PZ4UO5GN8SU9SIK
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3002/api/payments/vnpay/callback
VNPAY_IPN_URL=http://localhost:3002/api/payments/vnpay/ipn

BACKEND_PUBLIC_URL=http://localhost:3002
FRONTEND_URL=http://localhost:5173
```

**Wallet Service** (`Wallet_Service/.env`):
```env
NODE_ENV=production
APP_PORT=3008

DB_HOST=wallet-mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root_password_123
DB_DATABASE=wallet_service_db

JWT_SECRET=your_jwt_secret_key_here_change_in_production

INTERNAL_API_KEY=wallet_internal_key_123

ADMIN_WITHDRAWAL_APPROVAL_REQUIRED=true
MIN_WITHDRAWAL_AMOUNT=50000
MAX_WITHDRAWAL_AMOUNT=50000000
WITHDRAWAL_FEE_PERCENTAGE=0
WITHDRAWAL_PROCESSING_TIME_HOURS=24
```

### Step 4: Build & Run Services

```bash
# User Service
cd User_Service
docker compose up -d --build
# Đợi ~60 giây cho service khởi động và migration chạy

# Payment Service
cd ../Payment_Service
docker compose up -d --build
# Đợi ~60 giây

# Wallet Service
cd ../Wallet_Service
docker compose up -d --build
# Đợi ~60 giây

# Gateway (Nginx)
cd ../gateway
docker compose up -d
```

### Step 5: Verify Services

```bash
# Check tất cả containers đang chạy
docker ps

# Expected containers:
# - user_service_app (port 3001)
# - user_service_mysql (port 3308)
# - payment_service-payment-service-1 (port 3002)
# - payment_service-mysql-1 (port 3309)
# - ccm_wallet_service (port 3008)
# - wallet-mysql (port 3310)
# - api_gateway (port 80)

# Test health endpoints
curl http://localhost/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3008/health
```

### Step 6: Access Applications

**API Gateway**: http://localhost  
**User Service Swagger**: http://localhost:3001/api/docs  
**Payment Service Swagger**: http://localhost:3002/api/docs  
**Wallet Service Swagger**: http://localhost:3008/api/docs

**Database Admin Tools**:
- User Service Adminer: http://localhost:8081
- Payment Service Adminer: http://localhost:8082
- Wallet Service Adminer: http://localhost:8083

**Credentials**: root / root_password_123

---

## 🧪 Testing the System

### 1. Register a User
```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User",
    "userType": "EV_OWNER"
  }'
```

### 2. Verify Email (check logs or database)
```bash
# Get verification token from user_service_app logs
docker logs user_service_app | grep "verification"

# Or check database
# Connect to Adminer: http://localhost:8081
# Database: user_service_db, Table: users
# Copy verification_token

# Verify
curl "http://localhost/api/auth/verify?token=YOUR_TOKEN"
```

### 3. Login
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Response sẽ có `accessToken` - lưu lại để dùng cho các request sau.

### 4. Get User Profile
```bash
curl http://localhost/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create Payment (VNPay)
```bash
curl -X POST http://localhost/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN_'$(date +%s)'",
    "userId": 1,
    "gateway": "VNPAY",
    "amount": 100000,
    "orderInfo": "Nạp tiền vào ví"
  }'
```

Response sẽ có `paymentUrl` - mở link này để thanh toán test với VNPay Sandbox.

---

## 📁 Project Structure

```
CreditCarbonMarket/
├── User_Service/          # Authentication & User Management
│   ├── src/
│   ├── docker-compose.yml
│   └── Dockerfile
├── Payment_Service/       # Payment Gateway Integration
│   ├── src/
│   ├── docker-compose.yml
│   └── Dockerfile
├── Wallet_Service/        # Wallet & Transaction Management
│   ├── src/
│   ├── docker-compose.yml
│   └── Dockerfile
├── Admin_Service/         # Admin Dashboard (in development)
├── gateway/              # Nginx API Gateway
│   ├── nginx.conf
│   └── docker-compose.yml
├── CCM-Frontend/         # React Frontend (separate repo/folder)
├── libs/                 # Shared libraries
│   └── events/          # Event definitions
└── SETUP_GUIDE.md       # This file
```

---

## 🔒 Admin Login

**Default Admin Credentials**:
- Email: `admin@carbonmarket.com`
- Password: `Admin@123456`

Create admin user manually via SQL:
```sql
-- Connect to user_service_db via Adminer
INSERT INTO users (email, password_hash, user_type, status, is_verified, created_at, updated_at)
VALUES (
  'admin@carbonmarket.com',
  '$2b$10$rVrHvFQa8K/ExjQQP7dXf.oYFH3qmVQP5yKLBbYYqQOmJXmZJyVYe',  -- Admin@123456
  'ADMIN',
  'ACTIVE',
  1,
  NOW(),
  NOW()
);
```

---

## 🛠️ Troubleshooting

### Services không kết nối được với nhau
```bash
# Restart gateway để refresh DNS
cd gateway
docker compose restart

# Check network
docker network inspect ccm_net
```

### Database connection failed
```bash
# Check MySQL containers
docker ps | grep mysql

# Check logs
docker logs user_service_mysql
docker logs payment_service-mysql-1
docker logs wallet-mysql

# Restart MySQL nếu cần
cd User_Service
docker compose restart mysql
```

### Port conflicts
```bash
# Check ports đang dùng
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3008
netstat -ano | findstr :80

# Stop services khác đang dùng ports hoặc đổi ports trong docker-compose.yml
```

### Gateway 502 Bad Gateway
```bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3008/health

# Restart gateway
cd gateway
docker compose restart
```

### Clean restart (nếu gặp vấn đề nghiêm trọng)
```bash
# Stop tất cả
docker compose down # trong mỗi service folder

# Remove volumes (⚠️ MẤT DỮ LIỆU)
docker volume ls | grep user_service
docker volume rm user_service_data
# Repeat cho các services khác

# Rebuild from scratch
docker compose up -d --build
```

---

## 📊 Database Schema

### User Service
- `users` - User accounts
- `user_profiles` - Extended user info
- `kyc_documents` - KYC verification files
- `user_action_logs` - Audit trail

### Payment Service
- `payments` - Payment transactions
- `payment_callbacks` - VNPay callbacks
- `payment_events` - Event sourcing
- `outbox_events` - Outbox pattern for messaging

### Wallet Service
- `wallets` - User wallets
- `wallet_transactions` - All transactions
- `withdrawals` - Withdrawal requests
- `reserves` - Reserved balances
- `refunds` - Refund records

---

## 🎯 Next Steps

1. **Frontend Setup**: Clone CCM-Frontend và setup theo hướng dẫn riêng
2. **SMS/Email**: Configure SendGrid API key cho email notifications
3. **Production**: Change tất cả secrets, passwords, API keys
4. **Monitoring**: Setup logging và monitoring tools (optional)
5. **Backup**: Setup automated database backups

---

## 📞 Support

- GitHub Issues: https://github.com/Dev-Hoag/Demo_Project_CarbonVehicle/issues
- Documentation: See README.md in each service folder

---

## 📝 License

This project is for educational purposes.

---

**Version**: 1.0.0  
**Last Updated**: November 12, 2025  
**Branch**: release/stable-v1.0
