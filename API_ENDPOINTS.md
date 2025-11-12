# Complete API Endpoints Reference

## 📘 User Service (Port 3001)

### Authentication (`/api/auth`)
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login with email/password
POST   /api/auth/refresh            - Refresh access token
GET    /api/auth/me                 - Get current user info [Auth Required]
GET    /api/auth/verify?token=xxx   - Verify email
POST   /api/auth/forgot-password    - Request password reset
GET    /api/auth/reset-password?token=xxx - Show reset password form
POST   /api/auth/reset-password     - Submit new password
```

### User Profile (`/api/users`)
```
GET    /api/users/profile           - Get my profile [Auth Required]
PUT    /api/users/profile           - Update my profile [Auth Required]
GET    /api/users/:id               - Get user by ID (public info)
```

### KYC (`/api/kyc`)
```
POST   /api/kyc/upload              - Upload KYC document [Auth Required]
GET    /api/kyc/documents           - Get my KYC documents [Auth Required]
GET    /api/kyc/status              - Get KYC status [Auth Required]
DELETE /api/kyc/documents/:docId    - Delete KYC document [Auth Required]
```

### Internal APIs (`/internal`)
```
GET    /internal/auth/verify        - Verify JWT token (used by Gateway)
GET    /internal/users/:id          - Get user by ID
GET    /internal/users/email/:email - Get user by email
POST   /internal/users/validate     - Validate user credentials
PUT    /internal/users/:id/status   - Update user status
POST   /internal/users/:id/lock     - Lock user account
POST   /internal/users/:id/unlock   - Unlock user account
POST   /internal/users/:id/suspend  - Suspend user
POST   /internal/users/:id/activate - Activate user
DELETE /internal/users/:id          - Delete user
POST   /internal/users/batch        - Batch user operations
GET    /internal/users/:id/action-history - Get user action history
GET    /internal/kyc/user/:userId/documents - Get user's KYC documents
POST   /internal/kyc/documents/:docId/verify - Verify KYC document
```

---

## 💳 Payment Service (Port 3002)

### Payments (`/api/payments`)
```
POST   /api/payments/initiate                - Initiate payment (VNPay)
GET    /api/payments/:paymentCode/status     - Get payment status [Auth Required]
GET    /api/payments/my-payments             - Get my payment history [Auth Required]
GET    /api/payments                         - List payments (admin) [Auth Required]
```

### Webhooks (`/api/payments/vnpay`)
```
GET    /api/payments/vnpay/callback          - VNPay return URL (browser redirect)
POST   /api/payments/vnpay/ipn               - VNPay IPN webhook
```

### Internal APIs (`/internal/payments`)
```
GET    /internal/payments/:paymentCode       - Get payment details
PUT    /internal/payments/:paymentCode/status - Update payment status
GET    /internal/payments/user/:userId       - Get user's payments
POST   /internal/payments/:paymentCode/refund - Process refund
```

### Health
```
GET    /health                               - Service health check
```

---

## 💰 Wallet Service (Port 3008)

### Wallets (`/api/wallets`)
```
GET    /api/wallets                          - Get my wallet [Auth Required]
GET    /api/wallets/summary                  - Get wallet summary [Auth Required]
POST   /api/wallets/deposit                  - Initiate deposit [Auth Required]
GET    /api/wallets/limits                   - Get withdrawal limits [Auth Required]
```

### Transactions (`/api/transactions`)
```
GET    /api/transactions                     - Get my transactions [Auth Required]
GET    /api/transactions/:id                 - Get transaction details [Auth Required]
GET    /api/transactions/export              - Export transactions [Auth Required]
```

### Withdrawals (`/api/withdrawals`)
```
POST   /api/withdrawals                      - Request withdrawal [Auth Required]
GET    /api/withdrawals                      - Get my withdrawals [Auth Required]
GET    /api/withdrawals/:id                  - Get withdrawal details [Auth Required]
PUT    /api/withdrawals/:id/cancel           - Cancel withdrawal [Auth Required]
```

### Admin Operations (`/api/admin/wallets`)
```
GET    /api/admin/wallets                    - List all wallets [Admin Auth]
GET    /api/admin/wallets/:id                - Get wallet details [Admin Auth]
PUT    /api/admin/wallets/:id/adjust         - Adjust wallet balance [Admin Auth]
POST   /api/admin/wallets/:id/freeze         - Freeze wallet [Admin Auth]
POST   /api/admin/wallets/:id/unfreeze       - Unfreeze wallet [Admin Auth]
GET    /api/admin/transactions               - List all transactions [Admin Auth]
PUT    /api/admin/withdrawals/:id/approve    - Approve withdrawal [Admin Auth]
PUT    /api/admin/withdrawals/:id/reject     - Reject withdrawal [Admin Auth]
```

### Internal APIs (`/internal/wallets`)
```
GET    /internal/wallets/user/:userId        - Get user's wallet
POST   /internal/wallets/:walletId/credit    - Credit wallet
POST   /internal/wallets/:walletId/debit     - Debit wallet
POST   /internal/wallets/:walletId/reserve   - Reserve amount
POST   /internal/wallets/:walletId/release   - Release reserved amount
GET    /internal/wallets/:walletId/balance   - Get wallet balance
```

### Health
```
GET    /health                               - Service health check
```

---

## 🛡️ Admin Service (Port 3000)

### Admin Authentication (`/api/admin/auth`)
```
POST   /api/admin/auth/login                 - Admin login
POST   /api/admin/auth/refresh               - Refresh admin token
GET    /api/admin/auth/me                    - Get current admin info
POST   /api/admin/auth/change-password       - Change admin password
```

### User Management (`/api/admin/users`)
```
GET    /api/admin/users                      - List all users [Admin Auth]
GET    /api/admin/users/:id                  - Get user details [Admin Auth]
POST   /api/admin/users                      - Create user [Admin Auth]
PUT    /api/admin/users/:id                  - Update user [Admin Auth]
DELETE /api/admin/users/:id                  - Delete user [Admin Auth]
POST   /api/admin/users/:id/lock             - Lock user [Admin Auth]
POST   /api/admin/users/:id/unlock           - Unlock user [Admin Auth]
POST   /api/admin/users/:id/suspend          - Suspend user [Admin Auth]
POST   /api/admin/users/:id/activate         - Activate user [Admin Auth]
GET    /api/admin/users/:id/action-history   - Get user action history [Admin Auth]
POST   /api/admin/users/batch                - Batch operations [Admin Auth]
```

### Wallet Management (`/api/admin/wallets`)
```
GET    /api/admin/wallets                    - List all wallets [Admin Auth]
GET    /api/admin/wallets/:id                - Get wallet details [Admin Auth]
PUT    /api/admin/wallets/:id/adjust         - Adjust balance [Admin Auth]
POST   /api/admin/wallets/:id/freeze         - Freeze wallet [Admin Auth]
POST   /api/admin/wallets/:id/unfreeze       - Unfreeze wallet [Admin Auth]
```

### Transaction Management (`/api/admin/transactions`)
```
GET    /api/admin/transactions               - List all transactions [Admin Auth]
GET    /api/admin/transactions/:id           - Get transaction details [Admin Auth]
PUT    /api/admin/transactions/:id/review    - Review transaction [Admin Auth]
POST   /api/admin/transactions/:id/flag      - Flag suspicious transaction [Admin Auth]
```

### Reports (`/api/admin/reports`)
```
GET    /api/admin/reports/financial          - Financial report [Admin Auth]
GET    /api/admin/reports/transactions       - Transaction report [Admin Auth]
GET    /api/admin/reports/wallets            - Wallet summary report [Admin Auth]
GET    /api/admin/reports/users              - User statistics [Admin Auth]
POST   /api/admin/reports/export             - Export report [Admin Auth]
```

### Audit Logs (`/api/admin/audit-logs`)
```
GET    /api/admin/audit-logs                 - List audit logs [Admin Auth]
GET    /api/admin/audit-logs/:id             - Get audit log details [Admin Auth]
GET    /api/admin/audit-logs/user/:userId    - Get user's audit logs [Admin Auth]
```

### Override Requests (`/api/admin/override-requests`)
```
GET    /api/admin/override-requests          - List override requests [Admin Auth]
GET    /api/admin/override-requests/:id      - Get request details [Admin Auth]
POST   /api/admin/override-requests          - Create override request [Admin Auth]
PUT    /api/admin/override-requests/:id/approve - Approve request [Admin Auth]
PUT    /api/admin/override-requests/:id/reject  - Reject request [Admin Auth]
```

### Listing Management (`/api/admin/listings`)
```
GET    /api/admin/listings                   - List all listings [Admin Auth]
GET    /api/admin/listings/:id               - Get listing details [Admin Auth]
PUT    /api/admin/listings/:id/approve       - Approve listing [Admin Auth]
PUT    /api/admin/listings/:id/reject        - Reject listing [Admin Auth]
PUT    /api/admin/listings/:id/feature       - Feature listing [Admin Auth]
```

### Health
```
GET    /health                               - Service health check
```

---

## 🌐 API Gateway (Port 80)

All requests through gateway are prefixed with the service routes:

### Public Routes (No Auth)
```
POST   /api/auth/register                    → User Service
POST   /api/auth/login                       → User Service
GET    /api/auth/verify                      → User Service
POST   /api/auth/forgot-password             → User Service
GET    /api/auth/reset-password              → User Service
POST   /api/auth/reset-password              → User Service
POST   /api/payments/vnpay/ipn               → Payment Service (webhook)
GET    /health/*                             → All Services
```

### Protected Routes (Auth Required)
```
/api/users/*                                 → User Service
/api/kyc/*                                   → User Service
/api/auth/me                                 → User Service
/api/auth/refresh                            → User Service
/api/payments/*                              → Payment Service
/api/wallets/*                               → Wallet Service
/api/transactions/*                          → Wallet Service
/api/withdrawals/*                           → Wallet Service
/api/admin/*                                 → Admin Service (Admin role required)
```

---

## 🐰 RabbitMQ Management (Port 15672)

```
GET    http://localhost:15672                - Management UI
Credentials: ccm_admin / ccm_password_2024
Virtual Host: ccm_vhost
```

---

## 📊 Adminer (Database Management)

```
Admin Service:   http://localhost:8080
User Service:    http://localhost:8081
Payment Service: http://localhost:8082

Server:   mysql
Username: root
Password: root
```

---

## 📚 Swagger Documentation

```
User Service:    http://localhost:3001/api/docs
                 http://localhost:3001/api/docs-internal

Payment Service: http://localhost:3002/api/docs

Wallet Service:  http://localhost:3008/docs (if configured)

Admin Service:   Not configured
```

---

## 🔑 Authentication Flow

1. **Register**: `POST /api/auth/register`
2. **Verify Email**: `GET /api/auth/verify?token=xxx` (from email)
3. **Login**: `POST /api/auth/login` → Get `accessToken` & `refreshToken`
4. **Use Token**: Include `Authorization: Bearer <accessToken>` header
5. **Refresh**: `POST /api/auth/refresh` when token expires

---

## 📝 Example Requests

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "fullName": "John Doe",
    "phoneNumber": "0901234567",
    "userType": "EV_OWNER"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Get Profile (Authenticated)
```bash
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Initiate Payment
```bash
curl -X POST http://localhost:3002/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "amount": 500000,
    "paymentMethod": "VNPAY",
    "orderInfo": "Deposit to wallet",
    "language": "vn"
  }'
```

### Get Wallet Balance
```bash
curl -X GET http://localhost:3008/api/wallets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
