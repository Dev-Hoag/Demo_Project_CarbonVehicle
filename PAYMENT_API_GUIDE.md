# Payment Service API Guide

## 📋 Overview

Payment Service cung cấp các API để xử lý thanh toán qua VNPay gateway với đầy đủ filter và pagination.

---

## 🔐 Authentication

Hầu hết endpoints yêu cầu JWT token trong header:
```http
Authorization: Bearer <your_jwt_token>
```

Gateway sẽ tự động forward `X-User-ID` header sau khi verify token.

---

## 📍 Endpoints

### 1. **Initiate Payment** (Khởi tạo thanh toán)

```http
POST /api/payments/initiate
Content-Type: application/json
```

**Request Body:**
```json
{
  "transactionId": "TXN_1234567890",
  "userId": 34,
  "gateway": "VNPAY",
  "amount": 100000,
  "orderInfo": "Deposit 100000 VND",
  "bankCode": "NCB",
  "returnUrl": "http://localhost:5173/payment-result"
}
```

**Response:**
```json
{
  "paymentCode": "PAY_1763010618560_H8743A",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/...",
  "status": "PENDING",
  "amount": 100000,
  "transactionId": "TXN_1234567890",
  "expiredAt": "2025-11-13T06:11:18.560Z"
}
```

---

### 2. **Get Payment Status** (Kiểm tra trạng thái)

```http
GET /api/payments/:paymentCode/status
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/payments/PAY_1763010618560_H8743A/status
```

**Response:**
```json
{
  "paymentCode": "PAY_1763010618560_H8743A",
  "status": "COMPLETED",
  "amount": 100000,
  "transactionId": "TXN_1234567890",
  "gatewayResponseCode": "00",
  "gatewayResponseMsg": "Giao dịch thành công",
  "completedAt": "2025-11-13T05:11:32.918Z"
}
```

---

### 3. **Get Payment History** (Lịch sử thanh toán với filter)

```http
GET /api/payments/history?page=1&limit=20&status=COMPLETED&fromDate=2025-01-01&toDate=2025-12-31&gateway=VNPAY&sortOrder=desc
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 20 | Items per page (min: 1, max: 100) |
| `status` | enum | No | - | Filter by status: `PENDING`, `COMPLETED`, `FAILED`, `EXPIRED` |
| `fromDate` | string | No | - | Start date (YYYY-MM-DD) |
| `toDate` | string | No | - | End date (YYYY-MM-DD) |
| `gateway` | enum | No | - | Filter by gateway: `VNPAY`, `MOMO` |
| `sortOrder` | enum | No | desc | Sort order: `asc` or `desc` |

**Example Requests:**

```bash
# Get all payments (default: page 1, limit 20, desc order)
GET /api/payments/history

# Get completed payments only
GET /api/payments/history?status=COMPLETED

# Get payments in date range
GET /api/payments/history?fromDate=2025-11-01&toDate=2025-11-30

# Get page 2 with 50 items, sorted ascending
GET /api/payments/history?page=2&limit=50&sortOrder=asc

# Combined filters
GET /api/payments/history?status=COMPLETED&gateway=VNPAY&fromDate=2025-11-01&page=1&limit=10
```

**Response:**
```json
{
  "payments": [
    {
      "id": 11,
      "userId": 34,
      "amount": 20000000,
      "currency": "VND",
      "status": "COMPLETED",
      "paymentMethod": "VNPAY",
      "transactionId": "f1cb32fb-5fb3-46bc-85ed-c006bed86cc7",
      "description": "Deposit 20000000 VND for user 34",
      "paymentCode": "PAY_1763010618560_H8743A",
      "createdAt": "2025-11-13T05:10:18.581Z",
      "updatedAt": "2025-11-13T05:11:40.126Z",
      "completedAt": "2025-11-13T05:11:32.918Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 4. **Get Payment Details** (Chi tiết thanh toán)

```http
GET /api/payments/:id
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/payments/11
```

**Response:**
```json
{
  "id": 11,
  "userId": 34,
  "amount": 20000000,
  "currency": "VND",
  "status": "COMPLETED",
  "paymentMethod": "VNPAY",
  "transactionId": "f1cb32fb-5fb3-46bc-85ed-c006bed86cc7",
  "description": "Deposit 20000000 VND for user 34",
  "paymentCode": "PAY_1763010618560_H8743A",
  "gatewayResponseCode": "00",
  "gatewayResponseMsg": "Giao dịch thành công",
  "createdAt": "2025-11-13T05:10:18.581Z",
  "updatedAt": "2025-11-13T05:11:40.126Z",
  "completedAt": "2025-11-13T05:11:32.918Z",
  "expiredAt": "2025-11-13T06:11:18.560Z"
}
```

---

## 🔄 Webhook Endpoints (VNPay callbacks)

### VNPay Return URL
```http
GET /api/payments/vnpay/callback
```
User được redirect về đây sau khi thanh toán trên VNPay.

### VNPay IPN (Instant Payment Notification)
```http
GET /api/payments/vnpay/ipn
```
VNPay server-to-server notification để confirm payment status.

---

## 📊 Payment Status Flow

```
PENDING → COMPLETED (success)
        → FAILED (failed)
        → EXPIRED (timeout)
```

**Status Enum:**
- `PENDING`: Đang chờ thanh toán
- `COMPLETED`: Thanh toán thành công
- `FAILED`: Thanh toán thất bại
- `EXPIRED`: Hết hạn (timeout 15 phút)

---

## 🎯 Frontend Integration Examples

### React/Vue Example - Initiate Payment

```typescript
const initiatePayment = async (amount: number) => {
  try {
    const response = await axios.post('/api/payments/initiate', {
      transactionId: `TXN_${Date.now()}`,
      userId: currentUser.id,
      gateway: 'VNPAY',
      amount: amount,
      orderInfo: `Deposit ${amount} VND`,
      returnUrl: `${window.location.origin}/payment-result`
    });

    // Redirect to VNPay
    window.location.href = response.data.paymentUrl;
  } catch (error) {
    console.error('Payment initiation failed:', error);
  }
};
```

### Get Payment History with Filters

```typescript
const fetchPaymentHistory = async (filters: {
  page?: number;
  limit?: number;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
  fromDate?: string;
  toDate?: string;
}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);

  const response = await axios.get(`/api/payments/history?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};
```

### Check Payment Status

```typescript
const checkPaymentStatus = async (paymentCode: string) => {
  const response = await axios.get(`/api/payments/${paymentCode}/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

---

## 🛠️ Testing with cURL

```bash
# Initiate payment
curl -X POST http://localhost/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN_TEST_123",
    "userId": 34,
    "gateway": "VNPAY",
    "amount": 100000,
    "orderInfo": "Test payment"
  }'

# Get payment history (with token)
curl -X GET "http://localhost/api/payments/history?page=1&limit=10&status=COMPLETED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get payment details
curl -X GET http://localhost/api/payments/11 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Notes

1. **Pagination**: Max 100 items per page
2. **Date Format**: Use `YYYY-MM-DD` for date filters
3. **Security**: UserId is automatically filtered from JWT token
4. **Timeout**: VNPay payments expire after 15 minutes
5. **Gateway**: Currently supports VNPay (MOMO coming soon)

---

## 🚀 New Features Added

✅ **Filter by status** - Get only completed/failed/pending payments  
✅ **Date range filter** - Get payments in specific time period  
✅ **Gateway filter** - Filter by payment method  
✅ **Pagination** - Handle large payment lists efficiently  
✅ **Sort order** - Ascending or descending order  
✅ **Payment details** - Get full payment information by ID  

---

## 🔗 Related Services

- **Wallet Service**: Receives payment completion events to credit user wallet
- **User Service**: Provides user authentication and verification
- **Gateway**: Routes and authenticates all requests

---

**Last Updated**: November 13, 2025  
**Version**: 1.0.0
