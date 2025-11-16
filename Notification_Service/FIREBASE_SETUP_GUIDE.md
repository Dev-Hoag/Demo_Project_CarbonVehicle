# 🔥 Firebase FCM Setup Guide - Quick Start

## Tổng quan
Hướng dẫn chi tiết từng bước để setup Firebase Cloud Messaging cho Notification Service.

---

## 📋 Checklist

- [ ] Tạo Firebase Project
- [ ] Enable Cloud Messaging API
- [ ] Download Service Account Key JSON
- [ ] Đặt file JSON vào `config/firebase-service-account.json`
- [ ] Verify setup bằng cách chạy service
- [ ] Test gửi push notification

---

## 🚀 Bước 1: Tạo Firebase Project

### 1.1 Truy cập Firebase Console
- Mở trình duyệt: https://console.firebase.google.com
- Đăng nhập bằng Google Account

### 1.2 Tạo Project mới
1. Click nút **"Add project"** (hoặc **"Create a project"**)
2. Nhập tên project: `carbon-credit-marketplace`
3. Click **"Continue"**
4. Tắt Google Analytics (không cần thiết): Toggle OFF
   - Hoặc giữ ON nếu muốn tracking
5. Click **"Create project"**
6. Đợi 30-60 giây để Firebase tạo project
7. Click **"Continue"** khi thấy "Your new project is ready"

✅ **Checkpoint**: Bạn đang ở Dashboard của project `carbon-credit-marketplace`

---

## 🔥 Bước 2: Enable Cloud Messaging

### 2.1 Vào Project Settings
1. Click vào biểu tượng **⚙️ (Settings)** bên cạnh "Project Overview"
2. Chọn **"Project settings"**

### 2.2 Chuyển sang tab Cloud Messaging
1. Click tab **"Cloud Messaging"** (thanh tab phía trên)
2. Scroll xuống phần **"Cloud Messaging API (Legacy)"**
3. Nếu thấy **"Enable"**, click để bật
4. Nếu thấy **"Enabled"** → Đã sẵn sàng

✅ **Checkpoint**: Tab Cloud Messaging hiển thị "Cloud Messaging API (Legacy): Enabled"

---

## 🔑 Bước 3: Tạo Service Account Key (QUAN TRỌNG NHẤT!)

### 3.1 Truy cập Service Accounts
1. Vẫn ở tab **"Project settings"**
2. Click tab **"Service accounts"** (thanh tab phía trên)
3. Bạn sẽ thấy section "Firebase Admin SDK"

### 3.2 Generate Private Key
1. Trong section "Firebase Admin SDK", tìm nút **"Generate new private key"**
2. Click nút đó
3. Popup sẽ hiện ra: **"Generate new private key?"**
   - ⚠️ Cảnh báo: Key này có quyền admin đầy đủ, cần bảo mật
4. Click **"Generate key"**
5. File JSON sẽ tự động download về máy
   - Tên file dạng: `carbon-credit-marketplace-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
   - File này chứa private key, **TUYỆT ĐỐI KHÔNG public lên internet**

✅ **Checkpoint**: File JSON đã được download vào thư mục Downloads

---

## 📁 Bước 4: Đặt Service Account Key vào Project

### 4.1 Di chuyển file JSON
```powershell
# 1. Mở PowerShell trong thư mục Notification_Service
cd C:\Study\BuildAppOOP\CreditCarbonMarket\Notification_Service

# 2. Kiểm tra thư mục config tồn tại
if (!(Test-Path "config")) { New-Item -ItemType Directory -Path "config" }

# 3. Copy file từ Downloads (thay YOUR_USERNAME và FILE_NAME)
Copy-Item "C:\Users\YOUR_USERNAME\Downloads\carbon-credit-marketplace-firebase-adminsdk-*.json" -Destination "config\firebase-service-account.json"

# 4. Verify file đã copy thành công
if (Test-Path "config\firebase-service-account.json") {
    Write-Host "✅ Firebase service account key đã được đặt đúng vị trí!" -ForegroundColor Green
    Get-Item "config\firebase-service-account.json" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "❌ File không tìm thấy, kiểm tra lại đường dẫn!" -ForegroundColor Red
}
```

### 4.2 Kiểm tra nội dung file (Optional)
```powershell
# Xem 5 dòng đầu của file để verify (KHÔNG share nội dung này!)
Get-Content "config\firebase-service-account.json" -TotalCount 5
```

Nội dung phải có dạng:
```json
{
  "type": "service_account",
  "project_id": "carbon-credit-marketplace",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
```

✅ **Checkpoint**: File `config/firebase-service-account.json` tồn tại và có định dạng đúng

---

## ✅ Bước 5: Verify Setup

### 5.1 Kiểm tra cấu hình .env
```powershell
# Xem các biến môi trường Firebase
Get-Content .env | Select-String "FIREBASE"
```

Output mong đợi:
```
FIREBASE_PROJECT_ID=carbon-credit-marketplace
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

Nếu `FIREBASE_PROJECT_ID` khác, sửa lại cho khớp với tên project Firebase của bạn.

### 5.2 Chạy service
```powershell
npm run start:dev
```

### 5.3 Kiểm tra logs
Tìm trong console output:

✅ **Thành công**:
```
✅ Firebase Admin SDK initialized
🚀 Notification Service is running on http://localhost:3010
📬 RabbitMQ consumers are active
```

❌ **Thất bại**:
```
❌ Firebase service account file not found at: ./config/firebase-service-account.json
```

Nếu thấy lỗi, quay lại Bước 4 và kiểm tra đường dẫn file.

---

## 🧪 Bước 6: Test Push Notification

### 6.1 Đăng ký Device Token (giả lập)
```powershell
# Tạo fake FCM token để test
$testToken = "fKz9_XrN0E4:APA91bH-example-token-xxxxxxxxxxxxxxxxxxxxx"

# Register device
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/register-device" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    userId = "test-user-123"
    token = $testToken
    deviceType = "ANDROID"
    deviceName = "Test Device"
  } | ConvertTo-Json)
```

### 6.2 Gửi Test Notification
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/notifications/test" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    userId = "test-user-123"
    type = "SYSTEM_ALERT"
    channel = "PUSH"
    title = "🔥 Firebase FCM Test"
    message = "Push notification is working!"
    data = @{
      screen = "home"
      action = "open"
    }
  } | ConvertTo-Json)
```

### 6.3 Kiểm tra logs
Service sẽ log:
```
Handling event: trip.verified {"userId":"test-user-123",...}
✅ Notification sent for event: trip.verified to user: test-user-123
```

✅ **Checkpoint**: API trả về `200 OK` và không có lỗi trong logs

---

## 🎯 Bước 7: Setup Mobile/Web App (Optional)

### Android App (React Native)
```bash
# 1. Download google-services.json từ Firebase Console
# Project Settings → Add app → Android → Download config file

# 2. Đặt vào android/app/google-services.json

# 3. Cài package
npm install @react-native-firebase/app @react-native-firebase/messaging

# 4. Get token trong app
import messaging from '@react-native-firebase/messaging';

async function getFCMToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  
  // Send to backend
  await fetch('http://YOUR_SERVER:3010/api/notifications/register-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      token: token,
      deviceType: 'ANDROID',
      deviceName: 'User Phone',
    }),
  });
}
```

### iOS App
Tương tự Android, download `GoogleService-Info.plist` và setup.

### Web App
```javascript
// firebase-messaging-sw.js (service worker)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Config từ Firebase Console
  apiKey: "...",
  projectId: "carbon-credit-marketplace",
  messagingSenderId: "...",
  appId: "...",
});

const messaging = firebase.messaging();
```

---

## 🐛 Troubleshooting

### Lỗi: "Firebase service account file not found"
**Giải pháp:**
1. Kiểm tra file tồn tại: `Test-Path "config\firebase-service-account.json"`
2. Kiểm tra đường dẫn trong `.env`
3. Kiểm tra quyền đọc file: `icacls "config\firebase-service-account.json"`

### Lỗi: "Invalid service account"
**Giải pháp:**
1. File JSON bị hỏng → Download lại từ Firebase Console
2. Copy nhầm file → Kiểm tra nội dung file có `"type": "service_account"`

### Lỗi: "Requested entity was not found"
**Giải pháp:**
1. Project ID trong `.env` không khớp với Firebase project
2. Cập nhật `FIREBASE_PROJECT_ID` cho đúng

### Push notification không nhận được
**Giải pháp:**
1. Token không hợp lệ → Lấy token mới từ mobile app
2. App không chạy foreground → Check background message handler
3. Firebase quota exceeded → Check Firebase Console → Usage

---

## 📚 Tài liệu tham khảo

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)

---

## ✅ Hoàn thành!

Nếu tất cả các bước đều thành công, Firebase FCM đã sẵn sàng gửi push notifications!

**Next Steps:**
1. Tích hợp mobile app để nhận push
2. Test với real device
3. Setup event consumers từ các services khác
4. Deploy lên production

🎉 **Chúc mừng! Firebase Cloud Messaging đã hoạt động!**
