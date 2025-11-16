# Notification Service

Microservice quản lý thông báo đa kênh (Email, SMS, Push FCM, In-App) cho Carbon Credit Marketplace.

## 🚀 Tính năng

- ✅ **Firebase Cloud Messaging (FCM)**: Push notifications đến Android, iOS, Web
- ✅ **Multi-channel**: Email (SMTP), SMS (Twilio), Push (FCM), In-App (Database)
- ✅ **Template-based**: Quản lý template thông báo với biến động
- ✅ **User Preferences**: Người dùng tùy chỉnh kênh nhận thông báo
- ✅ **Event-driven**: Tự động gửi thông báo khi có sự kiện từ các service khác
- ✅ **Device Token Management**: Quản lý FCM tokens cho nhiều thiết bị
- ✅ **Notification History**: Lịch sử thông báo với phân trang

## 📋 Yêu cầu

- Node.js 18+
- MySQL 8.0
- RabbitMQ 3.x
- Firebase Project với Cloud Messaging enabled

## 🔥 Firebase Setup - QUAN TRỌNG!

### Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** hoặc chọn project có sẵn
3. Nhập tên project: `carbon-credit-marketplace`
4. Bật Google Analytics (tùy chọn)
5. Click **"Create project"**

### Bước 2: Enable Cloud Messaging

1. Trong Firebase Console, vào project vừa tạo
2. Click vào biểu tượng ⚙️ (Settings) → **Project Settings**
3. Chọn tab **"Cloud Messaging"**
4. Click **"Manage Service Accounts"**
5. Trang Google Cloud Console sẽ mở ra

### Bước 3: Download Service Account Key (CRITICAL!)

1. Trong Google Cloud Console, click **"Create Service Account"**
2. Nhập tên: `notification-service-admin`
3. Grant role: **"Firebase Admin SDK Administrator Service Agent"**
4. Click **"Done"**
5. Tìm service account vừa tạo trong danh sách
6. Click vào 3 dấu chấm (⋮) → **"Manage keys"**
7. Click **"Add Key"** → **"Create new key"**
8. Chọn **JSON** → Click **"Create"**
9. File JSON sẽ tự động download (ví dụ: `carbon-credit-marketplace-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`)

### Bước 4: Cấu hình Service Account trong Project

```bash
# 1. Tạo thư mục config nếu chưa có
mkdir -p config

# 2. Copy file JSON vào thư mục config và rename
cp ~/Downloads/carbon-credit-marketplace-firebase-adminsdk-xxxxx.json config/firebase-service-account.json

# 3. Kiểm tra file tồn tại
ls -la config/firebase-service-account.json
```

**⚠️ LƯU Ý BẢO MẬT:**
- **KHÔNG** commit file `firebase-service-account.json` lên Git
- Thêm vào `.gitignore`:
  ```
  config/firebase-service-account.json
  config/*.json
  ```

### Bước 5: Cập nhật .env (nếu cần)

File `.env` đã có sẵn cấu hình:

```env
FIREBASE_PROJECT_ID=carbon-credit-marketplace
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

Nếu project ID khác, cập nhật `FIREBASE_PROJECT_ID`.

### Bước 6: Lấy FCM Server Key (cho mobile apps)

1. Trong Firebase Console → Project Settings → Cloud Messaging
2. Copy **"Server key"** (dùng cho Android app)
3. Lưu key này để config trong mobile app

### Bước 7: Verify Setup

Chạy service và kiểm tra log:

```bash
npm run start:dev
```

Nếu thấy log: `✅ Firebase Admin SDK initialized` → Setup thành công!

Nếu lỗi: `❌ Firebase service account file not found` → Kiểm tra lại đường dẫn file JSON.

## 📦 Cài đặt

```bash
# Install dependencies
npm install

# Setup database
mysql -u root -p < notification_service_schema.sql

# Copy environment file
cp .env.example .env

# Edit .env và cập nhật thông tin database, RabbitMQ
nano .env
```

## 🏃 Chạy service

### Development mode (with hot reload)

```bash
npm run start:dev
```

### Production mode

```bash
npm run build
npm run start:prod
```

### Docker

```bash
# Build và chạy tất cả services (MySQL, RabbitMQ, App)
docker-compose up -d

# Chỉ build
docker-compose build

# Xem logs
docker-compose logs -f notification-service

# Stop
docker-compose down
```

## 📡 API Endpoints

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Lấy danh sách thông báo (paginated) |
| GET | `/api/notifications/unread` | Đếm số thông báo chưa đọc |
| PUT | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| POST | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/api/notifications/:id` | Xóa thông báo |
| GET | `/api/notifications/preferences` | Lấy cài đặt thông báo |
| PUT | `/api/notifications/preferences` | Cập nhật cài đặt thông báo |
| GET | `/api/notifications/history` | Lịch sử thông báo (30 ngày) |
| POST | `/api/notifications/register-device` | Đăng ký FCM device token |
| POST | `/api/notifications/test` | Gửi thông báo test |

### Internal Endpoints (Inter-service communication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/internal/notifications/send` | Gửi thông báo sử dụng template |

## 📝 Ví dụ sử dụng

### 1. Đăng ký Device Token (Mobile App)

```bash
curl -X POST http://localhost:3010/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "token": "fKz9_Xr...FCM_TOKEN...",
    "deviceType": "ANDROID",
    "deviceName": "Samsung Galaxy S21"
  }'
```

### 2. Gửi Test Notification

```bash
curl -X POST http://localhost:3010/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "SYSTEM_ALERT",
    "channel": "PUSH",
    "title": "Test Notification",
    "message": "This is a test push notification via FCM",
    "data": {
      "screen": "home",
      "action": "open"
    }
  }'
```

### 3. Lấy danh sách thông báo

```bash
curl "http://localhost:3010/api/notifications?userId=user123&page=1&limit=20"
```

### 4. Cập nhật preferences (Tắt Email, bật Push)

```bash
curl -X PUT "http://localhost:3010/api/notifications/preferences?userId=user123" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": false,
    "pushEnabled": true,
    "smsEnabled": false,
    "inAppEnabled": true
  }'
```

### 5. Gửi thông báo từ service khác (Internal)

```bash
curl -X POST http://localhost:3010/internal/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "templateCode": "TRIP_VERIFIED",
    "variables": {
      "tripId": "trip456",
      "distance": "120",
      "credits": "50"
    },
    "channels": ["PUSH", "IN_APP"]
  }'
```

## 🔔 Event Consumers

Service tự động lắng nghe các events sau từ RabbitMQ:

| Event | Template | Description |
|-------|----------|-------------|
| `trip.verified` | TRIP_VERIFIED | Khi chuyến đi được xác thực |
| `listing.created` | LISTING_CREATED | Khi listing mới được tạo |
| `listing.sold` | LISTING_SOLD | Khi listing được bán |
| `payment.completed` | PAYMENT_COMPLETED | Khi thanh toán thành công |
| `credit.issued` | CREDIT_ISSUED | Khi carbon credit được phát hành |
| `withdrawal.approved` | WITHDRAWAL_APPROVED | Khi rút tiền được duyệt |
| `withdrawal.rejected` | WITHDRAWAL_REJECTED | Khi rút tiền bị từ chối |
| `user.registered` | USER_REGISTERED | Khi user đăng ký mới |

### Publish Event từ Service khác

```typescript
// Từ Trip Service (ví dụ)
await rabbitMQService.publish('events', 'trip.verified', {
  userId: 'user123',
  tripId: 'trip456',
  distance: '120 km',
  credits: '50',
});
```

Notification Service sẽ tự động:
1. Nhận event
2. Tìm template tương ứng
3. Render message với variables
4. Kiểm tra user preferences
5. Gửi qua các kênh được bật (PUSH, IN_APP, EMAIL, SMS)

## 🗄️ Database Schema

5 bảng chính:

1. **notifications**: Lưu trữ thông báo
2. **notification_templates**: Templates với biến động
3. **notification_preferences**: Cài đặt người dùng
4. **device_tokens**: FCM tokens của thiết bị
5. **notification_logs**: Log trạng thái gửi

## 🔧 Cấu hình Firebase cho Mobile/Web Apps

### Android App (React Native / Native Android)

1. Download `google-services.json` từ Firebase Console:
   - Project Settings → Your apps → Add app (Android)
   - Nhập package name (vd: `com.carboncredit.app`)
   - Download `google-services.json`
   - Đặt vào `android/app/google-services.json`

2. Cài đặt FCM package:
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/messaging
   ```

3. Lấy FCM token trong app:
   ```typescript
   import messaging from '@react-native-firebase/messaging';

   const token = await messaging().getToken();
   
   // Gửi token lên Notification Service
   await fetch('http://localhost:3010/api/notifications/register-device', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: currentUser.id,
       token: token,
       deviceType: 'ANDROID',
       deviceName: 'My Phone',
     }),
   });
   ```

### iOS App

1. Download `GoogleService-Info.plist` từ Firebase Console
2. Đặt vào project XCode
3. Enable Push Notifications capability
4. Tương tự Android, lấy token và đăng ký

### Web App

1. Lấy `vapidKey` từ Firebase Console → Cloud Messaging → Web configuration
2. Initialize Firebase:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getMessaging, getToken } from 'firebase/messaging';

   const firebaseConfig = { /* config từ Firebase Console */ };
   const app = initializeApp(firebaseConfig);
   const messaging = getMessaging(app);

   const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
   
   // Register token
   await fetch('/api/notifications/register-device', {
     method: 'POST',
     body: JSON.stringify({
       userId: currentUser.id,
       token: token,
       deviceType: 'WEB',
     }),
   });
   ```

## 🧪 Testing

### Test Push Notification

```bash
# 1. Đăng ký device token từ mobile app
# 2. Gửi test notification
curl -X POST http://localhost:3010/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "type": "SYSTEM_ALERT",
    "channel": "PUSH",
    "title": "🔥 Test Push",
    "message": "Firebase FCM is working!",
    "data": {"test": "true"}
  }'

# 3. Kiểm tra device nhận được notification
```

### Test RabbitMQ Event

```bash
# Publish test event
curl -X POST http://localhost:15672/api/exchanges/%2F/events/publish \
  -u guest:guest \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {},
    "routing_key": "trip.verified",
    "payload": "{\"userId\":\"user123\",\"tripId\":\"trip456\",\"distance\":\"100\",\"credits\":\"40\"}",
    "payload_encoding": "string"
  }'
```

## 🐛 Troubleshooting

### Firebase không khởi tạo được

```
❌ Firebase service account file not found
```

**Giải pháp:**
1. Kiểm tra file tồn tại: `ls config/firebase-service-account.json`
2. Kiểm tra đường dẫn trong `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH`
3. Kiểm tra quyền đọc file: `chmod 644 config/firebase-service-account.json`

### Push notification không gửi được

**Giải pháp:**
1. Kiểm tra device token đã đăng ký: `SELECT * FROM device_tokens WHERE user_id = 'user123';`
2. Kiểm tra user preferences: `SELECT push_enabled FROM notification_preferences WHERE user_id = 'user123';`
3. Kiểm tra Firebase Console → Cloud Messaging → Check quotas
4. Kiểm tra logs: `docker-compose logs -f notification-service`

### RabbitMQ không kết nối được

```
❌ Failed to connect to RabbitMQ
```

**Giải pháp:**
1. Kiểm tra RabbitMQ chạy: `docker ps | grep rabbitmq`
2. Kiểm tra RABBITMQ_URL trong `.env`
3. Test connection: `telnet localhost 5672`

## 📚 Tech Stack

- **Framework**: NestJS 11
- **Database**: MySQL 8 + TypeORM
- **Messaging**: RabbitMQ (amqplib)
- **Push Notifications**: Firebase Admin SDK
- **Email**: (TODO) Nodemailer + SMTP
- **SMS**: (TODO) Twilio

## 🔐 Security

- Service account key phải được bảo mật
- Không commit file JSON lên Git
- Use environment variables cho sensitive data
- Enable authentication cho internal endpoints trong production

## 📄 License

MIT
