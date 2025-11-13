# 🧪 Test Cases - Transaction Service

## 📋 Chuẩn Bị

```bash
# Terminal 1: Chạy service
npm run build
npm start

# Terminal 2: Chạy tests
```

---

## ✅ TEST GROUP 1: Health Check

### Test 1.1: Health Check - SUCCESS
**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3006/health
```

**Expected Response (200):**
```json
{
  "status": "OK",
  "service": "transaction-service",
  "timestamp": "2025-11-10T10:37:03.699Z"
}
```

**Assertion:**
- ✅ Status code = 200
- ✅ response.status = "OK"
- ✅ response.service = "transaction-service"

---

## ✅ TEST GROUP 2: Create Transaction

### Test 2.1: Create Transaction - SUCCESS
**Endpoint:** `POST /api/transactions`

**Request:**
```bash
curl -X POST http://localhost:3006/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "buyer_id": 2,
    "seller_id": 3,
    "credit_amount": 100,
    "price_per_credit": 50,
    "total_price": 5000,
    "currency": "VND"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "listing_id": 1,
    "buyer_id": 2,
    "seller_id": 3,
    "credit_amount": "100.00",
    "price_per_credit": "50.00",
    "total_price": "5000.00",
    "currency": "VND",
    "status": "PENDING",
    "created_at": "2025-11-10T10:37:00Z",
    "updated_at": "2025-11-10T10:37:00Z"
  },
  "message": "Transaction created successfully"
}
```

**Assertions:**
- ✅ Status code = 201
- ✅ response.success = true
- ✅ response.data.id > 0
- ✅ response.data.status = "PENDING"
- ✅ response.data.total_price = "5000.00"

---

### Test 2.2: Create Transaction - FAIL (Buyer = Seller)
**Endpoint:** `POST /api/transactions`

**Request:**
```bash
curl -X POST http://localhost:3006/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "buyer_id": 2,
    "seller_id": 2,
    "credit_amount": 100,
    "price_per_credit": 50,
    "total_price": 5000,
    "currency": "VND"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Buyer and seller cannot be the same"
}
```

**Assertions:**
- ✅ Status code = 400
- ✅ response.success = false
- ✅ response.message contains "Buyer and seller cannot be the same"

---

### Test 2.3: Create Transaction - FAIL (Missing Field)
**Endpoint:** `POST /api/transactions`

**Request:**
```bash
curl -X POST http://localhost:3006/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "buyer_id": 2,
    "credit_amount": 100
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Validation error: seller_id is required"
}
```

**Assertions:**
- ✅ Status code = 400
- ✅ response.success = false

---

## ✅ TEST GROUP 3: Get Transaction

### Test 3.1: Get Transaction - SUCCESS
**Endpoint:** `GET /api/transactions/:id`

**Request:**
```bash
curl http://localhost:3006/api/transactions/1
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "listing_id": 1,
    "buyer_id": 2,
    "seller_id": 3,
    "credit_amount": "100.00",
    "price_per_credit": "50.00",
    "total_price": "5000.00",
    "currency": "VND",
    "status": "PENDING",
    "created_at": "2025-11-10T10:37:00Z",
    "updated_at": "2025-11-10T10:37:00Z"
  }
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true
- ✅ response.data.id = 1

---

### Test 3.2: Get Transaction - FAIL (Not Found)
**Endpoint:** `GET /api/transactions/:id`

**Request:**
```bash
curl http://localhost:3006/api/transactions/999
```

**Expected Response (404):**
```json
{
  "success": false,
  "message": "Transaction not found"
}
```

**Assertions:**
- ✅ Status code = 404
- ✅ response.success = false
- ✅ response.message = "Transaction not found"

---

## ✅ TEST GROUP 4: Get Transaction Summary

### Test 4.1: Get Transaction Summary - SUCCESS
**Endpoint:** `GET /api/transactions/:id/summary`

**Request:**
```bash
curl http://localhost:3006/api/transactions/1/summary
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "listing_id": 1,
    "buyer_id": 2,
    "seller_id": 3,
    "credit_amount": "100.00",
    "total_price": "5000.00",
    "status": "PENDING",
    "payment_status": null,
    "credit_status": "PENDING",
    "wallet_status": "PENDING",
    "escrow_amount": "5000.00",
    "seller_amount": "4750.00",
    "platform_fee": "250.00",
    "created_at": "2025-11-10T10:37:00Z",
    "updated_at": "2025-11-10T10:37:00Z"
  }
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.data.escrow_amount = "5000.00"
- ✅ response.data.platform_fee = "250.00" (5% of 5000)
- ✅ response.data.seller_amount = "4750.00" (5000 - 250)

---

## ✅ TEST GROUP 5: Update Transaction Status

### Test 5.1: Update Status - SUCCESS (PENDING → PAYMENT_PENDING)
**Endpoint:** `PUT /api/transactions/:id/status`

**Request:**
```bash
curl -X PUT http://localhost:3006/api/transactions/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAYMENT_PENDING",
    "reason": "Payment initiated"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Transaction status updated successfully"
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true

---

### Test 5.2: Update Status - FAIL (Invalid Transition)
**Endpoint:** `PUT /api/transactions/:id/status`

**Request:**
```bash
curl -X PUT http://localhost:3006/api/transactions/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING",
    "reason": "Try to go back"
  }'
```

**Expected Response (422):**
```json
{
  "success": false,
  "message": "Invalid state transition from PAYMENT_PENDING to PENDING"
}
```

**Assertions:**
- ✅ Status code = 422
- ✅ response.success = false
- ✅ response.message contains "Invalid state transition"

---

## ✅ TEST GROUP 6: Cancel Transaction

### Test 6.1: Cancel Transaction - SUCCESS
**Endpoint:** `POST /api/transactions/:id/cancel`

**Request:**
```bash
curl -X POST http://localhost:3006/api/transactions/2/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Buyer requested cancellation"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Transaction cancelled successfully"
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true

---

### Test 6.2: Cancel Transaction - FAIL (Already Cancelled)
**Endpoint:** `POST /api/transactions/:id/cancel`

**Request:**
```bash
curl -X POST http://localhost:3006/api/transactions/2/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Try to cancel again"
  }'
```

**Expected Response (422):**
```json
{
  "success": false,
  "message": "Invalid state transition from CANCELLED to CANCELLED"
}
```

**Assertions:**
- ✅ Status code = 422
- ✅ response.success = false

---

## ✅ TEST GROUP 7: Get Buyer Transactions

### Test 7.1: Get Buyer Transactions - SUCCESS
**Endpoint:** `GET /api/transactions/buyer/:buyer_id`

**Request:**
```bash
curl "http://localhost:3006/api/transactions/buyer/2?limit=20&offset=0"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "listing_id": 1,
        "buyer_id": 2,
        "seller_id": 3,
        "credit_amount": "100.00",
        "price_per_credit": "50.00",
        "total_price": "5000.00",
        "currency": "VND",
        "status": "PAYMENT_PENDING",
        "created_at": "2025-11-10T10:37:00Z",
        "updated_at": "2025-11-10T10:37:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true
- ✅ response.data.transactions is array
- ✅ response.data.total >= 0

---

## ✅ TEST GROUP 8: Get Seller Transactions

### Test 8.1: Get Seller Transactions - SUCCESS
**Endpoint:** `GET /api/transactions/seller/:seller_id`

**Request:**
```bash
curl "http://localhost:3006/api/transactions/seller/3?limit=20&offset=0"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true

---

## ✅ TEST GROUP 9: Disputes

### Test 9.1: Create Dispute - SUCCESS
**Endpoint:** `POST /api/disputes`

**Request:**
```bash
curl -X POST http://localhost:3006/api/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": 1,
    "raised_by": 2,
    "reason": "Credit not received",
    "description": "Buyer claims credit was not transferred"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transaction_id": 1,
    "raised_by": 2,
    "reason": "Credit not received",
    "description": "Buyer claims credit was not transferred",
    "status": "OPEN",
    "resolution": null,
    "resolved_by": null,
    "created_at": "2025-11-10T10:37:00Z",
    "resolved_at": null,
    "updated_at": "2025-11-10T10:37:00Z"
  },
  "message": "Dispute created successfully"
}
```

**Assertions:**
- ✅ Status code = 201
- ✅ response.success = true
- ✅ response.data.status = "OPEN"

---

### Test 9.2: Get Dispute - SUCCESS
**Endpoint:** `GET /api/disputes/:id`

**Request:**
```bash
curl http://localhost:3006/api/disputes/1
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transaction_id": 1,
    "raised_by": 2,
    "reason": "Credit not received",
    "status": "OPEN",
    "created_at": "2025-11-10T10:37:00Z"
  }
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true

---

### Test 9.3: Resolve Dispute - SUCCESS
**Endpoint:** `POST /api/disputes/:id/resolve`

**Request:**
```bash
curl -X POST http://localhost:3006/api/disputes/1/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Refund buyer 5000 VND",
    "resolved_by": 1
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Dispute resolved successfully"
}
```

**Assertions:**
- ✅ Status code = 200
- ✅ response.success = true

---

### Test 9.4: Get Dispute - FAIL (Not Found)
**Endpoint:** `GET /api/disputes/:id`

**Request:**
```bash
curl http://localhost:3006/api/disputes/999
```

**Expected Response (404):**
```json
{
  "success": false,
  "message": "Dispute not found"
}
```

**Assertions:**
- ✅ Status code = 404
- ✅ response.success = false

---

## 📊 Test Summary

| Group | Test | Status | Expected |
|-------|------|--------|----------|
| 1 | Health Check | ✅ | 200 OK |
| 2.1 | Create Transaction | ✅ | 201 Created |
| 2.2 | Create (Buyer=Seller) | ✅ | 400 Bad Request |
| 2.3 | Create (Missing Field) | ✅ | 400 Bad Request |
| 3.1 | Get Transaction | ✅ | 200 OK |
| 3.2 | Get Transaction (Not Found) | ✅ | 404 Not Found |
| 4.1 | Get Summary | ✅ | 200 OK |
| 5.1 | Update Status | ✅ | 200 OK |
| 5.2 | Update Status (Invalid) | ✅ | 422 Unprocessable |
| 6.1 | Cancel Transaction | ✅ | 200 OK |
| 6.2 | Cancel (Already Cancelled) | ✅ | 422 Unprocessable |
| 7.1 | Get Buyer Transactions | ✅ | 200 OK |
| 8.1 | Get Seller Transactions | ✅ | 200 OK |
| 9.1 | Create Dispute | ✅ | 201 Created |
| 9.2 | Get Dispute | ✅ | 200 OK |
| 9.3 | Resolve Dispute | ✅ | 200 OK |
| 9.4 | Get Dispute (Not Found) | ✅ | 404 Not Found |

**Total: 17 Test Cases**
**All: ✅ PASSED**

---

## 🚀 Chạy Tất Cả Tests

```bash
# Chạy từng test theo thứ tự
# Hoặc import vào Postman từ POSTMAN_GUIDE.md
```

---

## 💡 Notes

- Mỗi test phải chạy theo thứ tự (vì có dependency)
- Lưu transaction_id từ test 2.1 để dùng cho các test sau
- Lưu dispute_id từ test 9.1 để dùng cho các test sau
- Kiểm tra logs: `logs/combined.log`

