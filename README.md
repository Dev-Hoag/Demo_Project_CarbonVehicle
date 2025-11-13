
# Certificate Service

Service quản lý và phát hành **Carbon Credit Certificates** cho nền tảng Carbon Credit Marketplace.

## 🚀 Features
- 🧾 Tạo và lưu trữ chứng chỉ carbon (PDF + Hash)
- ✅ Xác minh và cập nhật trạng thái chứng chỉ
- 🔄 Gửi và nhận sự kiện qua RabbitMQ
- 📡 RESTful API với Swagger UI

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python 3.11)
- **Database**: MySQL 8.0 + SQLAlchemy
- **Messaging**: RabbitMQ
- **Deployment**: Docker Compose

## ⚙️ Quick Start
```bash
# Clone repo
git clone <repo-url>
cd certificate-service

# Run with Docker
docker compose up -d

# Access API docs
http://localhost:8005/docs


certificate-service/
├── app/
│   ├── main.py
│   ├── api/
│   ├── models/
│   ├── services/
│   └── messaging/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt

## 📘 API Overview

### 🔹 Certificate Management
- `POST /api/v1/certificates` — Tạo chứng chỉ carbon mới  
- `GET /api/v1/certificates` — Danh sách tất cả chứng chỉ  
- `GET /api/v1/certificates/{id}` — Xem chi tiết chứng chỉ  
- `DELETE /api/v1/certificates/{id}` — Xóa chứng chỉ  

### 🔹 Verification & Status
- `POST /api/v1/certificates/{id}/verify` — Xác minh chứng chỉ  
- `POST /api/v1/certificates/{id}/revoke` — Thu hồi chứng chỉ  
- `GET /api/v1/certificates/{id}/status` — Kiểm tra trạng thái  

### 🔹 Downloads & Files
- `GET /api/v1/certificates/{id}/download` — Tải file PDF chứng chỉ  
- `GET /api/v1/certificates/{id}/hash` — Lấy mã băm (hash) xác thực  

### 🔹 Events (RabbitMQ Integration)
- `certificate.generated` — Khi chứng chỉ được tạo  
- `certificate.verified` — Khi chứng chỉ được xác minh  
- `certificate.downloaded` — Khi người dùng tải chứng chỉ  

### 🔹 Utility
- `GET /health` — Kiểm tra tình trạng service  
- `GET /` — Thông tin service & liên kết tài liệu API  

