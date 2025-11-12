# Admin Withdrawal Management Guide

## 📋 Overview

Hệ thống withdrawal của Wallet Service hoạt động theo mô hình **2-step approval**:
1. **User tạo withdrawal request** → Status: `PENDING`
2. **Admin review và approve/reject** → Status: `APPROVED` hoặc `REJECTED`
3. **Nếu approved**: Tiền sẽ được trừ khỏi wallet và tạo transaction

---

## 🔐 Authentication

Tất cả admin APIs yêu cầu JWT token trong header:
```
Authorization: Bearer <admin_jwt_token>
```

---

## 📡 Admin APIs

### 1. Xem danh sách withdrawal đang chờ duyệt

**Endpoint:** `GET http://localhost/api/admin/withdrawals/pending`

**Response:**
```json
[
  {
    "id": "a78a38e7-272a-4770-918a-0a33f3c510ea",
    "userId": "34",
    "walletId": "e250f4a9-4a30-45b3-ac31-79f80b7e30bb",
    "amount": 1000000,
    "fee": 5000,
    "netAmount": 995000,
    "bankAccountName": "LE HUYNH HUY HOANG",
    "bankAccountNumber": "0373282032",
    "bankName": "TP Bank",
    "status": "PENDING",
    "createdAt": "2025-11-12T12:00:00.000Z"
  }
]
```

### 2. Xem tất cả withdrawals (có filter)

**Endpoint:** `GET http://localhost/api/admin/withdrawals?status=PENDING`

**Query Parameters:**
- `status` (optional): `PENDING`, `APPROVED`, `REJECTED`

### 3. Duyệt withdrawal (APPROVE)

**Endpoint:** `POST http://localhost/api/admin/withdrawals/:id/approve`

**Request Body:**
```json
{
  "adminNote": "Approved by admin"
}
```

**Response:**
```json
{
  "message": "Withdrawal approved and processed successfully",
  "withdrawal": {
    "id": "a78a38e7-272a-4770-918a-0a33f3c510ea",
    "status": "APPROVED",
    "approvedBy": "admin_user_id",
    "approvedAt": "2025-11-12T12:05:00.000Z",
    "processedAt": "2025-11-12T12:05:00.000Z"
  },
  "transaction": {
    "id": "431f7872-03bf-4961-b515-744abb20587e",
    "type": "WITHDRAWAL",
    "amount": 1000000,
    "balanceBefore": 2000000,
    "balanceAfter": 1000000,
    "status": "COMPLETED"
  },
  "newBalance": 1000000
}
```

**Khi approve:**
- ✅ Trừ tiền từ wallet balance
- ✅ Tạo transaction type `WITHDRAWAL`
- ✅ Update withdrawal status thành `APPROVED`
- ✅ Lưu admin ID và timestamp

### 4. Từ chối withdrawal (REJECT)

**Endpoint:** `POST http://localhost/api/admin/withdrawals/:id/reject`

**Request Body:**
```json
{
  "reason": "Invalid bank account information"
}
```

**Response:**
```json
{
  "message": "Withdrawal rejected",
  "withdrawal": {
    "id": "a78a38e7-272a-4770-918a-0a33f3c510ea",
    "status": "REJECTED",
    "rejectionReason": "Invalid bank account information",
    "approvedBy": "admin_user_id",
    "processedAt": "2025-11-12T12:05:00.000Z"
  }
}
```

**Khi reject:**
- ❌ KHÔNG trừ tiền
- ✅ Update status thành `REJECTED`
- ✅ Lưu lý do reject

---

## 🧪 Testing với cURL/PowerShell

### Bước 1: Login as Admin
```powershell
$adminToken = (curl -X POST "http://localhost/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"admin123"}' | ConvertFrom-Json).token
```

### Bước 2: Xem danh sách withdrawal chờ duyệt
```powershell
curl -X GET "http://localhost/api/admin/withdrawals/pending" `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### Bước 3: Approve một withdrawal
```powershell
$withdrawalId = "a78a38e7-272a-4770-918a-0a33f3c510ea"

curl -X POST "http://localhost/api/admin/withdrawals/$withdrawalId/approve" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"adminNote":"Approved"}' | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### Bước 4: Hoặc reject
```powershell
curl -X POST "http://localhost/api/admin/withdrawals/$withdrawalId/reject" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"reason":"Invalid bank info"}' | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 📊 Withdrawal Status Flow

```
USER tạo request
    ↓
┌─────────────┐
│   PENDING   │ ← User chờ admin duyệt
└─────────────┘
    ↓
    ↓ Admin review
    ↓
┌─────────────┬─────────────┐
│  APPROVED   │  REJECTED   │
│  (Trừ tiền) │ (Không trừ) │
└─────────────┴─────────────┘
```

---

## ⚠️ Business Rules

1. **Withdrawal Limits:**
   - Minimum: 50,000 VND
   - Maximum: 50,000,000 VND per request
   - Daily limit: 100,000,000 VND

2. **Fee:**
   - 0.5% phí rút tiền
   - Net amount = amount - fee

3. **Balance Check:**
   - Kiểm tra balance khi user tạo request
   - Kiểm tra lại khi admin approve (đề phòng balance thay đổi)

4. **Idempotency:**
   - Chỉ có thể approve/reject withdrawal có status `PENDING`
   - Không thể thay đổi withdrawal đã `APPROVED` hoặc `REJECTED`

---

## 🎯 Next Steps

1. **Tạo Admin Frontend** để hiển thị danh sách và approve/reject
2. **Thêm notification** cho user khi withdrawal được approve/reject
3. **Add audit logging** cho tất cả admin actions
4. **Implement rate limiting** để tránh spam withdrawal requests

---

## 📝 Notes

- Tất cả admin actions đều được log trong database
- `approvedBy` field lưu admin user ID
- `approvedAt` và `processedAt` timestamps được tự động set
- Transaction được tạo với `referenceType: 'withdrawal'` và `referenceId: withdrawal.id`
