# 📜 Certificate Service

**Certificate Service** cho **Carbon Credit Platform** – Phát hành và quản lý chứng chỉ **carbon credit**.

---

## 🚀 Tính năng

- ✅ Tự động tạo chứng chỉ carbon credit sau khi xác minh  
- 📄 Tạo PDF certificate với template đẹp mắt  
- 🔐 Xác minh tính toàn vẹn bằng **SHA256 hash**  
- 📊 Theo dõi lịch sử tải và xác minh  
- 🔍 API tra cứu công khai cho **QR code**  
- 📨 Tích hợp **RabbitMQ** cho event-driven architecture  
- 🐳 Hỗ trợ **Docker**  

---

## 📋 Yêu cầu

- Python `3.11+`  
- MySQL `8.0+`  
- RabbitMQ `3.12+`  
- Docker & Docker Compose *(tùy chọn)*  

---

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd certificate-service


2. Tạo virtual environment

python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate     # Windows

3. Cài đặt dependencies

pip install -r requirements.txt


4. Cấu hình .env

Tạo file .env từ mẫu:

cp .env.example .env

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=certificate_service_db

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672

5. Khởi tạo database
mysql -u root -p < init.sql

🐳 Chạy với Docker
Khởi động tất cả services
docker-compose up -d

Services sẽ chạy tại:

Certificate Service: http://localhost:3009

MySQL: localhost:3307

RabbitMQ Management: http://localhost:15673

Xem logs

docker-compose logs -f certificate-service


Dừng services
docker-compose down

🏃‍♂️ Chạy local (không dùng Docker)

Khởi động MySQL và RabbitMQ

Chạy ứng dụng:

python -m uvicorn app.main:app --host 0.0.0.0 --port 3009 --reload


Truy cập:

API Docs: http://localhost:3009/docs

Health Check: http://localhost:3009/health

📡 API Endpoints
1. Generate Certificate (Internal)

POST /api/certificates/generate
Content-Type: application/json

{
  "verification_id": 1,
  "trip_id": 123,
  "user_id": 456,
  "credit_amount": 25.50,
  "template_id": 1
}

2. List User Certificates
GET /api/certificates?user_id=456&skip=0&limit=10

3. Get Certificate Details
GET /api/certificates/1

4. Download Certificate PDF
GET /api/certificates/1/download?user_id=456

5. Verify Certificate
POST /api/certificates/1/verify?verified_by=789&method=manual

6. Public Verification (by hash)
GET /api/certificates/public/{cert_hash}

📨 RabbitMQ Events
Events Consumed — TripVerified (từ Verification Service)
{
  "event_type": "TripVerified",
  "data": {
    "verification_id": 1,
    "trip_id": 123,
    "user_id": 456,
    "credit_amount": 25.50,
    "verified_at": "2024-01-01T12:00:00"
  }
}


Events Published
CertificateGenerated
{
  "event_type": "CertificateGenerated",
  "data": {
    "certificate_id": 1,
    "user_id": 456,
    "cert_hash": "abc123...",
    "credit_amount": 25.50,
    "pdf_url": "/api/certificates/files/cert_1.pdf",
    "issue_date": "2024-01-01T12:00:00"
  }
}


CertificateVerified
{
  "event_type": "CertificateVerified",
  "data": {
    "certificate_id": 1,
    "verified_by": 789,
    "verification_method": "manual",
    "verified_at": "2024-01-01T12:00:00"
  }
}

CertificateDownloaded
{
  "event_type": "CertificateDownloaded",
  "data": {
    "certificate_id": 1,
    "downloaded_by": 456,
    "downloaded_at": "2024-01-01T12:00:00"
  }
}


🗄️ Database Schema
certificates
Trường	Mô tả
id	Primary key
verification_id	Link to verification
trip_id	Link to trip
user_id	Certificate owner
credit_amount	Carbon credits amount
cert_hash	SHA256 hash
issue_date	Issue timestamp
pdf_url	PDF file URL
template_id	Template used
status	valid / expired / revoked
certificate_templates
Trường	Mô tả
id	Primary key
template_name	Template name
pdf_template_path	Template file path
description	Template description
is_active	Active status
certificate_verifications
Trường	Mô tả
id	Primary key
cert_id	Certificate ID
verified_by	Verifier ID
verified_at	Verification timestamp
verification_method	system / manual / public
certificate_downloads
Trường	Mô tả
id	Primary key
cert_id	Certificate ID
downloaded_by	Downloader ID
downloaded_at	Download timestamp
🧪 Testing
# Chạy tests
pytest

# Với coverage
pytest --cov=app tests/

📁 Cấu trúc thư mục
certificate-service/
├── app/
│   ├── api/              # API routes
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── messaging/        # RabbitMQ
│   ├── config.py         # Configuration
│   ├── database.py       # Database setup
│   └── main.py           # FastAPI app
├── templates/            # PDF templates
├── uploads/              # Generated PDFs
├── tests/                # Test files
├── .env.example          # Environment template
├── requirements.txt      # Python dependencies
├── Dockerfile            # Docker image
├── docker-compose.yml    # Docker compose
└── README.md             # This file

🔧 Troubleshooting
Lỗi kết nối database
docker-compose ps mysql
docker-compose logs mysql

Lỗi RabbitMQ
docker-compose ps rabbitmq
# Truy cập: http://localhost:15673 (guest/guest)

Lỗi PDF generation
pip install --force-reinstall weasyprint

📝 License

MIT License

👥 Contributors

Your Name

📞 Contact

📧 Email: your.email@example.com

🐙 GitHub: @yourusername


Bạn có thể copy toàn bộ nội dung trên và dán trực tiếp vào file `README.md`.  
Khi xem trên GitHub, nó sẽ hiển thị **đầy đủ icon, code block, bảng và liên kết 