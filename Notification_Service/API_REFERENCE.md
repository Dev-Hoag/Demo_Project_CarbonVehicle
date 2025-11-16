# 📡 API Reference - Notification Service

Base URL: `http://localhost:3010`  
Gateway URL: `http://localhost/api/notifications` (qua Nginx)

---

## 🔐 Authentication

Hầu hết endpoints yêu cầu `userId` trong query string hoặc body.  
Trong production, nên thêm JWT authentication middleware.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 📬 User Endpoints

### 1. Get Notifications (List)

**GET** `/api/notifications`

Lấy danh sách thông báo của user (có phân trang).

**Query Parameters:**
- `userId` (required) - User ID
- `page` (optional, default: 1) - Số trang
- `limit` (optional, default: 20) - Số items per page

**Example:**
```powershell
curl "http://localhost:3010/api/notifications?userId=user123&page=1&limit=10"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "userId": "user123",
      "type": "TRIP_VERIFIED",
      "channel": "PUSH",
      "title": "Trip Verified",
      "message": "Your trip earned 50 carbon credits!",
      "data": {
        "tripId": "trip456",
        "credits": "50"
      },
      "status": "SENT",
      "sentAt": "2025-11-16T10:30:00.000Z",
      "readAt": null,
      "createdAt": "2025-11-16T10:29:55.000Z",
      "updatedAt": "2025-11-16T10:30:01.000Z"
    }
  ],
  "total": 25
}
```

---

### 2. Get Unread Count

**GET** `/api/notifications/unread`

Đếm số thông báo chưa đọc.

**Query Parameters:**
- `userId` (required) - User ID

**Example:**
```powershell
Invoke-RestMethod "http://localhost:3010/api/notifications/unread?userId=user123"
```

**Response:**
```json
{
  "count": 5
}
```

---

### 3. Mark as Read

**PUT** `/api/notifications/:id/read`

Đánh dấu một thông báo là đã đọc.

**Path Parameters:**
- `id` (required) - Notification ID

**Query Parameters:**
- `userId` (required) - User ID

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/42/read?userId=user123" -Method PUT
```

**Response:**
```json
{
  "id": 42,
  "userId": "user123",
  "status": "READ",
  "readAt": "2025-11-16T11:00:00.000Z",
  ...
}
```

---

### 4. Mark All as Read

**POST** `/api/notifications/read-all`

Đánh dấu tất cả thông báo của user là đã đọc.

**Body:**
```json
{
  "userId": "user123"
}
```

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/read-all" `
  -Method POST -ContentType "application/json" `
  -Body '{"userId":"user123"}'
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

---

### 5. Delete Notification

**DELETE** `/api/notifications/:id`

Xóa một thông báo.

**Path Parameters:**
- `id` (required) - Notification ID

**Query Parameters:**
- `userId` (required) - User ID

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/42?userId=user123" -Method DELETE
```

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

---

### 6. Get User Preferences

**GET** `/api/notifications/preferences`

Lấy cài đặt thông báo của user.

**Query Parameters:**
- `userId` (required) - User ID

**Example:**
```powershell
Invoke-RestMethod "http://localhost:3010/api/notifications/preferences?userId=user123"
```

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true,
  "eventPreferences": {
    "TRIP_VERIFIED": true,
    "LISTING_SOLD": true,
    "PAYMENT_COMPLETED": false
  },
  "createdAt": "2025-11-15T08:00:00.000Z",
  "updatedAt": "2025-11-16T10:00:00.000Z"
}
```

---

### 7. Update User Preferences

**PUT** `/api/notifications/preferences`

Cập nhật cài đặt thông báo.

**Query Parameters:**
- `userId` (required) - User ID

**Body:**
```json
{
  "emailEnabled": false,
  "smsEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true,
  "eventPreferences": {
    "TRIP_VERIFIED": true,
    "LISTING_SOLD": false
  }
}
```

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/preferences?userId=user123" `
  -Method PUT -ContentType "application/json" `
  -Body (@{
    emailEnabled = $false
    pushEnabled = $true
  } | ConvertTo-Json)
```

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "emailEnabled": false,
  "pushEnabled": true,
  ...
}
```

---

### 8. Get Notification History

**GET** `/api/notifications/history`

Lấy lịch sử thông báo (mặc định 30 ngày gần nhất).

**Query Parameters:**
- `userId` (required) - User ID
- `days` (optional, default: 30) - Số ngày lịch sử

**Example:**
```powershell
Invoke-RestMethod "http://localhost:3010/api/notifications/history?userId=user123&days=7"
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": "user123",
    "type": "TRIP_VERIFIED",
    "channel": "PUSH",
    "title": "Trip Verified",
    "status": "SENT",
    "createdAt": "2025-11-15T10:00:00.000Z"
  },
  ...
]
```

---

### 9. Register Device Token

**POST** `/api/notifications/register-device`

Đăng ký FCM device token để nhận push notifications.

**Body:**
```json
{
  "userId": "user123",
  "token": "fKz9_XrN0E4:APA91bH-...",
  "deviceType": "ANDROID",
  "deviceName": "Samsung Galaxy S21"
}
```

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/register-device" `
  -Method POST -ContentType "application/json" `
  -Body (@{
    userId = "user123"
    token = "fKz9_XrN0E4:APA91bH-example-token"
    deviceType = "ANDROID"
    deviceName = "My Phone"
  } | ConvertTo-Json)
```

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "token": "fKz9_XrN0E4:APA91bH-...",
  "deviceType": "ANDROID",
  "deviceName": "Samsung Galaxy S21",
  "isActive": true,
  "lastUsedAt": "2025-11-16T11:00:00.000Z",
  "createdAt": "2025-11-16T11:00:00.000Z",
  "updatedAt": "2025-11-16T11:00:00.000Z"
}
```

**Device Types:**
- `ANDROID` - Android devices
- `IOS` - iOS devices
- `WEB` - Web browsers (PWA)

---

### 10. Send Test Notification

**POST** `/api/notifications/test`

Gửi thông báo test (development only).

**Body:**
```json
{
  "userId": "user123",
  "type": "SYSTEM_ALERT",
  "channel": "PUSH",
  "title": "Test Notification",
  "message": "This is a test message",
  "data": {
    "screen": "home",
    "action": "open"
  }
}
```

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/test" `
  -Method POST -ContentType "application/json" `
  -Body (@{
    userId = "user123"
    type = "SYSTEM_ALERT"
    channel = "PUSH"
    title = "🔥 Test"
    message = "Firebase FCM is working!"
    data = @{ test = "true" }
  } | ConvertTo-Json)
```

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "type": "SYSTEM_ALERT",
  "channel": "PUSH",
  "title": "🔥 Test",
  "message": "Firebase FCM is working!",
  "status": "SENT",
  "sentAt": "2025-11-16T11:05:00.000Z",
  ...
}
```

**Notification Types:**
- `TRIP_VERIFIED`
- `LISTING_CREATED`
- `LISTING_SOLD`
- `PAYMENT_COMPLETED`
- `CREDIT_ISSUED`
- `WITHDRAWAL_APPROVED`
- `SYSTEM_ALERT`

**Channels:**
- `EMAIL` - Email notifications (requires SMTP config)
- `SMS` - SMS notifications (requires Twilio config)
- `PUSH` - Firebase Cloud Messaging
- `IN_APP` - In-app notifications (stored in database)

---

## 🔧 Internal Endpoints

### Send Notification (Internal)

**POST** `/internal/notifications/send`

Gửi thông báo sử dụng template (dành cho inter-service communication).

**Body:**
```json
{
  "userId": "user123",
  "templateCode": "TRIP_VERIFIED",
  "variables": {
    "tripId": "trip456",
    "distance": "120",
    "credits": "50"
  },
  "channels": ["PUSH", "IN_APP"]
}
```

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/internal/notifications/send" `
  -Method POST -ContentType "application/json" `
  -Body (@{
    userId = "user123"
    templateCode = "TRIP_VERIFIED"
    variables = @{
      tripId = "trip456"
      distance = "120"
      credits = "50"
    }
    channels = @("PUSH", "IN_APP")
  } | ConvertTo-Json)
```

**Response:**
```json
[
  {
    "id": 1,
    "channel": "PUSH",
    "status": "SENT",
    ...
  },
  {
    "id": 2,
    "channel": "IN_APP",
    "status": "SENT",
    ...
  }
]
```

**Template Codes:**
- `TRIP_VERIFIED` - Trip verification notification
- `LISTING_CREATED` - New listing notification
- `LISTING_SOLD` - Listing sold notification
- `PAYMENT_COMPLETED` - Payment success notification
- `CREDIT_ISSUED` - Carbon credit issued
- `WITHDRAWAL_APPROVED` - Withdrawal approved
- `WITHDRAWAL_REJECTED` - Withdrawal rejected
- `USER_REGISTERED` - Welcome new user

---

## 🔄 Event-Driven Notifications (RabbitMQ)

Service tự động lắng nghe các events từ RabbitMQ exchange `events`.

### Publish Event từ Service khác

**Example (từ Trip Service):**
```typescript
import * as amqp from 'amqplib';

const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
const channel = await connection.createChannel();

await channel.assertExchange('events', 'topic', { durable: true });

// Publish event
channel.publish(
  'events',
  'trip.verified',
  Buffer.from(JSON.stringify({
    userId: 'user123',
    tripId: 'trip456',
    distance: '120 km',
    credits: '50',
  }))
);
```

**Events được lắng nghe:**

| Event Name | Template | Notification |
|------------|----------|--------------|
| `trip.verified` | TRIP_VERIFIED | "Your trip earned {credits} carbon credits!" |
| `listing.created` | LISTING_CREATED | "New listing: {title}" |
| `listing.sold` | LISTING_SOLD | "Your listing {title} has been sold!" |
| `payment.completed` | PAYMENT_COMPLETED | "Payment of ${amount} completed" |
| `credit.issued` | CREDIT_ISSUED | "{credits} carbon credits issued" |
| `withdrawal.approved` | WITHDRAWAL_APPROVED | "Withdrawal of ${amount} approved" |
| `withdrawal.rejected` | WITHDRAWAL_REJECTED | "Withdrawal rejected: {reason}" |
| `user.registered` | USER_REGISTERED | "Welcome to Carbon Credit Marketplace!" |

**Event Data Format:**
```json
{
  "userId": "user123",
  "variableName1": "value1",
  "variableName2": "value2",
  ...
}
```

**Note:** `userId` field là bắt buộc trong event data.

---

## 🎨 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 404 | Not Found (notification or template) |
| 500 | Internal Server Error |

---

## 🔍 Validation Rules

### SendNotificationDto
- `userId`: required, string
- `type`: required, enum (NotificationType)
- `channel`: required, enum (NotificationChannel)
- `title`: required, string
- `message`: required, string
- `data`: optional, object

### UpdatePreferencesDto
- `emailEnabled`: optional, boolean
- `smsEnabled`: optional, boolean
- `pushEnabled`: optional, boolean
- `inAppEnabled`: optional, boolean
- `eventPreferences`: optional, object

### RegisterDeviceDto
- `userId`: required, string
- `token`: required, string
- `deviceType`: required, enum ('ANDROID' | 'IOS' | 'WEB')
- `deviceName`: optional, string

### SendInternalNotificationDto
- `userId`: required, string
- `templateCode`: required, string (must exist in database)
- `variables`: optional, object
- `channels`: optional, array of NotificationChannel

---

## 🧪 Testing with cURL

### Get Notifications
```bash
curl -X GET "http://localhost:3010/api/notifications?userId=user123&page=1&limit=10"
```

### Register Device
```bash
curl -X POST http://localhost:3010/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "token": "fKz9_example_token",
    "deviceType": "ANDROID",
    "deviceName": "Test Device"
  }'
```

### Send Test Notification
```bash
curl -X POST http://localhost:3010/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "SYSTEM_ALERT",
    "channel": "PUSH",
    "title": "Test",
    "message": "Hello World"
  }'
```

### Update Preferences
```bash
curl -X PUT "http://localhost:3010/api/notifications/preferences?userId=user123" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": false,
    "pushEnabled": true
  }'
```

### Mark as Read
```bash
curl -X PUT "http://localhost:3010/api/notifications/42/read?userId=user123"
```

### Delete Notification
```bash
curl -X DELETE "http://localhost:3010/api/notifications/42?userId=user123"
```

---

## 📊 Rate Limiting (Production)

Nên thêm rate limiting trong production:

```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=notification_limit:10m rate=10r/s;

location /api/notifications {
  limit_req zone=notification_limit burst=20 nodelay;
  proxy_pass http://notification-service:3010;
}
```

---

## 🔒 Security Best Practices

1. **Authentication**: Thêm JWT middleware trong production
2. **Authorization**: Verify userId matches JWT subject
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: class-validator đã enable
5. **CORS**: Chỉ allow trusted origins
6. **HTTPS**: Enforce SSL/TLS
7. **Internal Endpoints**: Restrict to VPC/internal network

---

## 📚 Related Documentation

- [README.md](README.md) - Full documentation
- [FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md) - Firebase setup
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment
- [QUICK_START.md](QUICK_START.md) - Quick setup

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-16
