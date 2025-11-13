# 🚀 Quick Start - Transaction Service

## ⚡ Chạy trong 5 phút

### 📋 Yêu Cầu
- Node.js 18+
- npm hoặc yarn
- Git

---

## 🔧 Bước 1: Clone/Setup Project

```bash
# Vào thư mục project
cd d:\xddahdt_AN

# Cài đặt dependencies
npm install
```

**Thời gian**: ~2 phút

---

## 🗄️ Bước 2: Cấu Hình Database

File `.env` đã được cấu hình sẵn với Railway MySQL:

```env
DB_HOST=shinkansen.proxy.rlwy.net
DB_PORT=48385
DB_USER=root
DB_PASSWORD=duvwKOLfvxyBsbACyXSzxaihbwWWNmMG
DB_NAME=railway
PORT=3006
```

✅ **Không cần thay đổi gì!**

---

## 📊 Bước 3: Tạo Database Tables

```bash
npm run migrate
```

**Output:**
```
2025-11-10 10:19:45 [info]: Starting database migrations...
2025-11-10 10:19:45 [info]: Migration executed successfully
...
2025-11-10 10:19:45 [info]: All migrations completed
```

**Thời gian**: ~30 giây

---

## ▶️ Bước 4: Chạy Service

### Development Mode (Với Hot Reload)

```bash
npm run dev
```

**Hoặc:**

```bash
npx ts-node src/index.ts
```

**Output:**
```
2025-11-10 10:22:22 [info]: Transaction Service running on port 3006
2025-11-10 10:22:22 [info]: Environment: development
```

✅ **Service đã chạy!**

---

## ✅ Bước 5: Test API

### Terminal mới - Test Health Check

```bash
curl http://localhost:3006/health
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

## 🧪 Bước 6: Test Tạo Transaction

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

## 📮 Bước 7: Sử Dụng Postman (Optional)

1. Mở Postman
2. Import collection từ `POSTMAN_GUIDE.md`
3. Setup environment: `http://localhost:3006`
4. Bắt đầu test!

Xem chi tiết: [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)

---

## 📁 Cấu Trúc Project

```
d:\xddahdt_AN/
├── src/
│   ├── config/              # Database, Logger
│   ├── types/               # TypeScript types
│   ├── repositories/        # Data access
│   ├── services/            # Business logic
│   ├── controllers/         # Request handlers
│   ├── routes/              # API routes
│   ├── database/            # Migrations
│   └── index.ts             # Entry point
├── dist/                    # Compiled JS
├── logs/                    # Application logs
├── package.json             # Dependencies
├── .env                     # Configuration
└── README.md                # Documentation
```

---

## 🔍 Xem Logs

```bash
# Xem logs real-time
tail -f logs/combined.log

# Xem chỉ lỗi
tail -f logs/error.log
```

---

## 🛑 Dừng Service

```bash
# Ctrl + C trong terminal chạy service
```

---

## 🔄 Restart Service

```bash
# Dừng service (Ctrl + C)
# Chạy lại
npm run dev
```

---

## 🐛 Troubleshooting

### 1. Port 3006 đang được sử dụng

```bash
# Windows
netstat -ano | findstr :3006
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3006 | xargs kill -9
```

### 2. Database connection error

```
Error: connect ECONNREFUSED
```

**Giải pháp:**
- Kiểm tra `.env` file
- Kiểm tra internet connection
- Kiểm tra firewall

### 3. Migration error

```bash
# Clear và chạy lại
npm run migrate
```

### 4. TypeScript error

```bash
# Clear cache
rm -rf dist/
npm run build
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/transactions` | Tạo transaction |
| GET | `/api/transactions/:id` | Lấy transaction |
| GET | `/api/transactions/:id/summary` | Lấy summary |
| PUT | `/api/transactions/:id/status` | Cập nhật status |
| POST | `/api/transactions/:id/cancel` | Hủy transaction |
| GET | `/api/transactions/buyer/:buyer_id` | Giao dịch mua |
| GET | `/api/transactions/seller/:seller_id` | Giao dịch bán |
| POST | `/api/disputes` | Tạo dispute |
| GET | `/api/disputes/:id` | Lấy dispute |
| POST | `/api/disputes/:id/resolve` | Giải quyết dispute |
| POST | `/api/disputes/:id/close` | Đóng dispute |

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3006 | Server port |
| NODE_ENV | development | Environment |
| DB_HOST | localhost | Database host |
| DB_PORT | 3306 | Database port |
| DB_USER | root | Database user |
| DB_PASSWORD | - | Database password |
| DB_NAME | transaction_service_db | Database name |
| LOG_LEVEL | info | Logging level |

---

## 🎯 Next Steps

1. ✅ Setup project
2. ✅ Chạy migrations
3. ✅ Khởi động service
4. ✅ Test API
5. ⏳ Integrate với Payment Service
6. ⏳ Integrate với Credit Service
7. ⏳ Deploy to production

---

## 📚 Tài Liệu Liên Quan

- [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) - Hướng dẫn Postman
- [TRANSACTION_SERVICE_DESIGN.md](./TRANSACTION_SERVICE_DESIGN.md) - Thiết kế chi tiết
- [transaction_service_schema.sql](./transaction_service_schema.sql) - SQL schema

---

## 💬 Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `logs/error.log`
2. Xem troubleshooting section
3. Kiểm tra `.env` configuration

---

## ✨ Chúc mừng!

Service của bạn đã sẵn sàng! 🎉

**Bây giờ bạn có thể:**
- ✅ Tạo transactions
- ✅ Quản lý disputes
- ✅ Theo dõi trạng thái
- ✅ Tính toán phí platform
- ✅ Quản lý escrow

**Hãy bắt đầu test!** 🚀

