# 📮 Postman Guide - Transaction Service API

## 🚀 Cách Import Collection vào Postman

### Bước 1: Tạo Collection mới
1. Mở Postman
2. Click **"Collections"** → **"+"** (New Collection)
3. Đặt tên: `Transaction Service API`
4. Click **"Create"**

### Bước 2: Tạo Environment
1. Click **"Environments"** → **"+"** (New Environment)
2. Đặt tên: `Transaction Service Dev`
3. Thêm biến:
   - **Key**: `base_url` | **Value**: `http://localhost:3006`
   - **Key**: `transaction_id` | **Value**: `1`
   - **Key**: `buyer_id` | **Value**: `2`
   - **Key**: `seller_id` | **Value**: `3`
   - **Key**: `dispute_id` | **Value**: `1`
4. Click **"Save"**

### Bước 3: Chọn Environment
- Góc phải trên Postman, chọn **"Transaction Service Dev"**

---

## 📝 API Requests

### 1️⃣ Health Check
```
GET {{base_url}}/health
```
**Response:**
```json
{
  "status": "OK",
  "service": "transaction-service",
  "timestamp": "2025-11-10T10:30:00Z"
}
```

---

### 2️⃣ Tạo Transaction
```
POST {{base_url}}/api/transactions
Content-Type: application/json

{
  "listing_id": 1,
  "buyer_id": 2,
  "seller_id": 3,
  "credit_amount": 100,
  "price_per_credit": 50,
  "total_price": 5000,
  "currency": "VND"
}
```

**Response:**
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
    "created_at": "2025-11-10T10:30:00Z",
    "updated_at": "2025-11-10T10:30:00Z"
  },
  "message": "Transaction created successfully"
}
```

---

### 3️⃣ Lấy Chi Tiết Transaction
```
GET {{base_url}}/api/transactions/{{transaction_id}}
```

**Response:**
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
    "created_at": "2025-11-10T10:30:00Z",
    "updated_at": "2025-11-10T10:30:00Z"
  }
}
```

---

### 4️⃣ Lấy Transaction Summary
```
GET {{base_url}}/api/transactions/{{transaction_id}}/summary
```

**Response:**
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
    "created_at": "2025-11-10T10:30:00Z",
    "updated_at": "2025-11-10T10:30:00Z"
  }
}
```

---

### 5️⃣ Cập Nhật Status Transaction
```
PUT {{base_url}}/api/transactions/{{transaction_id}}/status
Content-Type: application/json

{
  "status": "PAYMENT_PENDING",
  "reason": "Payment initiated"
}
```

**Valid Status Transitions:**
- PENDING → PAYMENT_PENDING, CANCELLED, DISPUTED
- PAYMENT_PENDING → PAYMENT_COMPLETED, CANCELLED
- PAYMENT_COMPLETED → CREDIT_TRANSFERRED, CANCELLED
- CREDIT_TRANSFERRED → COMPLETED, CANCELLED
- COMPLETED → (no transitions)
- CANCELLED → (no transitions)
- DISPUTED → (no transitions)

---

### 6️⃣ Hủy Transaction
```
POST {{base_url}}/api/transactions/{{transaction_id}}/cancel
Content-Type: application/json

{
  "reason": "Buyer requested cancellation"
}
```

---

### 7️⃣ Lấy Giao Dịch Mua
```
GET {{base_url}}/api/transactions/buyer/{{buyer_id}}?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 8️⃣ Lấy Giao Dịch Bán
```
GET {{base_url}}/api/transactions/seller/{{seller_id}}?limit=20&offset=0
```

---

### 9️⃣ Xử Lý Payment Completed
```
POST {{base_url}}/api/transactions/payment/completed
Content-Type: application/json

{
  "transaction_id": 1
}
```

---

### 🔟 Xử Lý Payment Failed
```
POST {{base_url}}/api/transactions/payment/failed
Content-Type: application/json

{
  "transaction_id": 1
}
```

---

### 1️⃣1️⃣ Tạo Dispute
```
POST {{base_url}}/api/disputes
Content-Type: application/json

{
  "transaction_id": 1,
  "raised_by": 2,
  "reason": "Credit not received",
  "description": "Buyer claims credit was not transferred after payment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transaction_id": 1,
    "raised_by": 2,
    "reason": "Credit not received",
    "description": "Buyer claims credit was not transferred after payment",
    "status": "OPEN",
    "resolution": null,
    "resolved_by": null,
    "created_at": "2025-11-10T10:35:00Z",
    "resolved_at": null,
    "updated_at": "2025-11-10T10:35:00Z"
  },
  "message": "Dispute created successfully"
}
```

---

### 1️⃣2️⃣ Lấy Chi Tiết Dispute
```
GET {{base_url}}/api/disputes/{{dispute_id}}
```

---

### 1️⃣3️⃣ Giải Quyết Dispute
```
POST {{base_url}}/api/disputes/{{dispute_id}}/resolve
Content-Type: application/json

{
  "resolution": "Refund buyer 5000 VND due to credit transfer failure",
  "resolved_by": 1
}
```

---

### 1️⃣4️⃣ Đóng Dispute
```
POST {{base_url}}/api/disputes/{{dispute_id}}/close
```

---

### 1️⃣5️⃣ Lấy Dispute Mở
```
GET {{base_url}}/api/disputes/status/open?limit=20&offset=0
```

---

## 🧪 Test Workflow

### Quy Trình Giao Dịch Hoàn Chỉnh:

1. **Tạo Transaction**
   - POST /api/transactions
   - Lưu `transaction_id` từ response

2. **Cập Nhật sang PAYMENT_PENDING**
   - PUT /api/transactions/{{transaction_id}}/status
   - Status: "PAYMENT_PENDING"

3. **Xử Lý Payment Completed**
   - POST /api/transactions/payment/completed
   - Transaction chuyển sang PAYMENT_COMPLETED

4. **Cập Nhật sang CREDIT_TRANSFERRED**
   - PUT /api/transactions/{{transaction_id}}/status
   - Status: "CREDIT_TRANSFERRED"

5. **Cập Nhật sang COMPLETED**
   - PUT /api/transactions/{{transaction_id}}/status
   - Status: "COMPLETED"

6. **Lấy Summary**
   - GET /api/transactions/{{transaction_id}}/summary

---

## 🔍 Error Handling

### Common Errors:

**400 - Bad Request**
```json
{
  "success": false,
  "message": "Buyer and seller cannot be the same"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Transaction not found"
}
```

**422 - Invalid State Transition**
```json
{
  "success": false,
  "message": "Invalid state transition from COMPLETED to PENDING"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 💡 Tips

1. **Lưu Variables**: Sau khi tạo transaction, lưu ID vào environment variable
2. **Pre-request Script**: Dùng để generate dynamic data
3. **Tests**: Viết tests để validate responses
4. **Collections**: Organize requests thành folders
5. **Documentation**: Mỗi request có description

---

## 📚 Postman Collection JSON

Bạn có thể import file này vào Postman:

```json
{
  "info": {
    "name": "Transaction Service API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Create Transaction",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/transactions",
        "body": {
          "mode": "raw",
          "raw": "{\"listing_id\": 1, \"buyer_id\": 2, \"seller_id\": 3, \"credit_amount\": 100, \"price_per_credit\": 50, \"total_price\": 5000, \"currency\": \"VND\"}"
        }
      }
    }
  ]
}
```

---

## 🎯 Bước Tiếp Theo

1. ✅ Import collection vào Postman
2. ✅ Setup environment variables
3. ✅ Chạy health check
4. ✅ Test tạo transaction
5. ✅ Test workflow hoàn chỉnh
6. ✅ Viết tests cho responses

