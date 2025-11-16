# ⚡ Quick Start - 5 Minutes Setup

Hướng dẫn nhanh để chạy Notification Service trong 5 phút!

---

## 📋 Prerequisites

- [x] Node.js 18+ installed
- [x] MySQL 8.0 running
- [x] RabbitMQ running (hoặc dùng Docker)
- [ ] Firebase account (Gmail account)

---

## 🚀 Setup trong 5 phút

### Minute 1: Firebase Setup

```powershell
Start-Process "https://console.firebase.google.com"

# 2. Làm theo:
#    → Add project → Tên: "carbon-credit-marketplace"
#    → Project Settings → Service Accounts
#    → Generate new private key → Download JSON
#    → Save file

# 3. Đổi tên và copy vào project
#    File download: carbon-credit-marketplace-firebase-adminsdk-xxxxx.json
#    → Đổi tên: firebase-service-account.json
#    → Copy vào: Notification_Service\config\

# Verify
if (Test-Path "config\firebase-service-account.json") {
    Write-Host "✅ Firebase key OK!" -ForegroundColor Green
} else {
    Write-Host "❌ Chưa có Firebase key!" -ForegroundColor Red
    Write-Host "   Đọc: FIREBASE_SETUP_GUIDE.md" -ForegroundColor Yellow
}
```

### Minute 2: Database Setup

```powershell
# Option A: Nếu đã có MySQL
mysql -u root -p notification_service_db < notification_service_schema.sql

# Option B: Docker MySQL (nhanh nhất)
docker run -d --name notification-mysql `
  -e MYSQL_ROOT_PASSWORD=rootpassword `
  -e MYSQL_DATABASE=notification_service_db `
  -p 3316:3306 mysql:8.0

Start-Sleep -Seconds 30  # Đợi MySQL ready

Get-Content notification_service_schema.sql | docker exec -i notification-mysql mysql -uroot -prootpassword notification_service_db

# Verify
Write-Host "✅ Database tables created!" -ForegroundColor Green
```

### Minute 3: RabbitMQ Setup

```powershell
# Option A: Nếu đã có RabbitMQ
# → Skip bước này

# Option B: Docker RabbitMQ
docker run -d --name notification-rabbitmq `
  -p 5672:5672 -p 15672:15672 `
  -e RABBITMQ_DEFAULT_USER=guest `
  -e RABBITMQ_DEFAULT_PASS=guest `
  rabbitmq:3-management-alpine

Write-Host "✅ RabbitMQ started!" -ForegroundColor Green
Write-Host "   Management: http://localhost:15672 (guest/guest)" -ForegroundColor Gray
```

### Minute 4: Install & Build

```powershell
# Dependencies đã có trong package.json (576 packages)
npm install

# Build TypeScript
npm run build

Write-Host "✅ Build completed!" -ForegroundColor Green
```

### Minute 5: Run & Test

```powershell
# Start service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"

# Đợi 10 giây service khởi động
Start-Sleep -Seconds 10

# Run test
.\test-api.ps1

# Nếu thấy:
# ✅ Service is running!
# ✅ Device registered
# ✅ Notification sent
# → SUCCESS! 🎉
```

---

## ✅ Verification

Service đang chạy nếu thấy:

```
✅ Firebase Admin SDK initialized
✅ Connected to RabbitMQ
📬 Listening to trip.verified events
📬 Listening to listing.created events
🚀 Notification Service is running on http://localhost:3010
```

Test API:

```powershell
# Get notifications
Invoke-RestMethod "http://localhost:3010/api/notifications?userId=test&page=1&limit=5"

# Check unread
Invoke-RestMethod "http://localhost:3010/api/notifications/unread?userId=test"
```

---

## 🐛 Nếu có lỗi

### Lỗi: "Firebase service account file not found"

```powershell
# Check file tồn tại
Test-Path "config\firebase-service-account.json"

# Nếu false → Quay lại Minute 1
```

### Lỗi: "Database connection failed"

```powershell
# Check MySQL running
docker ps | Select-String "mysql"

# Test connection
mysql -u root -p -e "SELECT 1"

# Check credentials trong .env
Get-Content .env | Select-String "DB_"
```

### Lỗi: "RabbitMQ connection failed"

```powershell
# Check RabbitMQ running
docker ps | Select-String "rabbitmq"

# Test connection
curl -u guest:guest http://localhost:15672/api/overview

# Restart RabbitMQ
docker restart notification-rabbitmq
```

### Lỗi: "Port 3010 already in use"

```powershell
# Find process using port 3010
netstat -ano | findstr :3010

# Kill process (thay <PID> bằng số từ command trên)
taskkill /PID <PID> /F
```

---

## 🎯 Next Steps

### 1. Test Push Notification (Real Device)

**Android App:**
```javascript
// Get FCM token
import messaging from '@react-native-firebase/messaging';
const token = await messaging().getToken();

// Register với service
fetch('http://YOUR_SERVER:3010/api/notifications/register-device', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    token: token,
    deviceType: 'ANDROID',
    deviceName: 'My Phone',
  }),
});
```

**Send Test Push:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/test" `
  -Method POST -ContentType "application/json" `
  -Body (@{
    userId = "user123"
    type = "SYSTEM_ALERT"
    channel = "PUSH"
    title = "🔥 Test"
    message = "Firebase working!"
  } | ConvertTo-Json)
```

### 2. Integrate với Services khác

**Từ Trip Service (ví dụ):**
```typescript
// Publish event khi trip verified
await rabbitMQ.publish('events', 'trip.verified', {
  userId: 'user123',
  tripId: 'trip456',
  distance: '120 km',
  credits: '50',
});

// Notification Service tự động:
// 1. Nhận event
// 2. Tìm template TRIP_VERIFIED
// 3. Render message: "Your trip earned 50 credits!"
// 4. Gửi push notification
```

### 3. Deploy Production

```powershell
# Build Docker image
docker build -t notification-service:latest .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f notification-service
```

Đọc thêm: `DEPLOYMENT_GUIDE.md`

---

## 📚 Documentation

- **README.md** - Full documentation
- **FIREBASE_SETUP_GUIDE.md** - Chi tiết Firebase setup
- **DEPLOYMENT_GUIDE.md** - Production deployment
- **PROJECT_SUMMARY.md** - Tổng quan project

---

## 🎉 Done!

Service đã sẵn sàng gửi notifications! 🚀

**API Endpoints:**
- GET `/api/notifications` - List notifications
- GET `/api/notifications/unread` - Unread count
- PUT `/api/notifications/:id/read` - Mark read
- POST `/api/notifications/register-device` - Register FCM token
- POST `/api/notifications/test` - Test notification
- ... và 5 endpoints khác

**Features:**
- ✅ Firebase Push Notifications
- ✅ Multi-channel (Email, SMS, Push, In-App)
- ✅ Template-based messages
- ✅ User preferences
- ✅ Event-driven (RabbitMQ)
- ✅ Device management
- ✅ Notification history

Chúc mừng! 🎊
