# 🌱 Carbon Credit Certificate - Complete System Workflow

## 📋 Overview

Tài liệu này mô tả chi tiết **luồng hoạt động của hệ thống** sau khi certificate được tạo, bao gồm các use case chính và quy trình xử lý.

---

## 🔄 Certificate Creation Flow (Hiện tại đã hoàn thành)

### 1. **Marketplace Purchase Flow** ✅
```
User mua credit từ Marketplace
   ↓
Transaction Service tạo transaction COMPLETED
   ↓
Publish event "credit.purchased" lên RabbitMQ
   ↓
Certificate Service consumer nhận event
   ↓
Tự động tạo Certificate với PDF (ReportLab)
   ↓
User thấy certificate trong Certificates page
   ↓
User có thể download PDF certificate
```

### 2. **Trip Verification Flow** ✅
```
User hoàn thành trip với phương tiện xanh
   ↓
CVA (Carbon Verification Authority) xác nhận trip
   ↓
Publish event "trip.verified" lên RabbitMQ
   ↓
Certificate Service consumer nhận event
   ↓
Tạo Certificate với verification_id
   ↓
Certificate cần CVA approval trước khi valid
```

---

## 🎯 Các Use Case Tiếp Theo (Recommended Implementation)

### **Use Case 1: Certificate Verification System** 🔍

**Mô tả**: Cho phép bên thứ 3 verify tính hợp lệ của certificate

**Flow**:
1. User share certificate hash với auditor/partner
2. Auditor nhập hash vào verification portal
3. System query database bằng cert_hash
4. Trả về thông tin certificate (nếu valid):
   - Certificate ID
   - Credit amount
   - Issue date
   - Status (valid/revoked)
   - PDF URL (nếu có)

**API Endpoint** (đã có sẵn):
```typescript
GET /api/certificates/verify/{cert_hash}
Response:
{
  "valid": true,
  "certificate": {
    "id": 19,
    "credit_amount": 10.5,
    "issue_date": "2025-11-17",
    "status": "valid"
  }
}
```

**Frontend Implementation**:
- Tạo page `/verify-certificate`
- Input field nhập hash
- Hiển thị kết quả verify với badge (Valid ✓ / Invalid ✗)
- Link download PDF nếu valid

---

### **Use Case 2: Certificate Trading/Transfer** 💱

**Mô tả**: User có thể trade/transfer certificate cho user khác

**Flow**:
1. User A muốn transfer certificate cho User B
2. Tạo transfer request:
   - Certificate ID
   - Recipient User ID
   - Transfer reason (optional)
3. Certificate Service update ownership:
   - Set user_id = User B
   - Create transfer history record
   - Generate new PDF với owner mới
4. Notify cả 2 users (email/notification)

**Database Change**:
```sql
-- Add transfer history table
CREATE TABLE certificate_transfers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  certificate_id INT,
  from_user_id BIGINT,
  to_user_id BIGINT,
  transfer_date TIMESTAMP,
  reason VARCHAR(500),
  status ENUM('pending', 'completed', 'cancelled')
);
```

**API Endpoints**:
```typescript
POST /api/certificates/{id}/transfer
Body: { recipient_user_id, reason }

GET /api/certificates/{id}/transfer-history
Response: [ { from, to, date, status } ]
```

---

### **Use Case 3: Certificate Revocation** ❌

**Mô tả**: Admin có thể revoke certificate nếu phát hiện gian lận

**Flow**:
1. Admin/CVA phát hiện certificate không hợp lệ
2. Tạo revocation request với lý do
3. Certificate Service:
   - Update status = 'revoked'
   - Lưu revocation reason và timestamp
   - Notify certificate holder
4. Certificate không thể sử dụng cho reporting

**Database Change**:
```sql
ALTER TABLE certificates 
ADD COLUMN revoked_at TIMESTAMP NULL,
ADD COLUMN revocation_reason VARCHAR(500) NULL,
ADD COLUMN revoked_by INT NULL; -- Admin ID
```

**API Endpoints**:
```typescript
POST /api/certificates/{id}/revoke
Body: { reason, revoked_by }

GET /api/certificates/revoked
Response: [ { id, reason, revoked_at } ]
```

---

### **Use Case 4: Corporate Environmental Reporting** 📊

**Mô tả**: Doanh nghiệp tổng hợp certificates để report giảm phát thải

**Flow**:
1. Corporate user login vào dashboard
2. View tất cả certificates của organization
3. Filter theo:
   - Date range (Q1, Q2, yearly...)
   - Source (purchased vs trip-verified)
   - Amount
4. Generate consolidated report:
   - Total CO₂ offset: XXX kg
   - Number of certificates: YY
   - Breakdown by month/quarter
   - Export PDF/Excel report

**Frontend Components**:
```typescript
// Corporate Dashboard page
/corporate-dashboard
  - Total Credits Chart (line/bar chart)
  - Certificate Statistics
  - Monthly breakdown
  - Export buttons (PDF, CSV, Excel)
  
// API để aggregate data
GET /api/certificates/corporate/summary?from=2025-01&to=2025-12
Response: {
  total_credits: 1250.5,
  total_certificates: 45,
  by_month: [ { month: "2025-01", credits: 120.5 } ],
  by_source: { purchased: 800, trip_verified: 450.5 }
}
```

---

### **Use Case 5: Certificate Expiration & Renewal** ⏰

**Mô tả**: Certificates có thời hạn, cần renewal sau một thời gian

**Flow**:
1. Certificate có expiry_date (VD: 2 năm sau issue_date)
2. Cron job chạy hàng ngày check expiring certificates:
   - 30 days trước expiry: Warning notification
   - 7 days trước expiry: Urgent notification
   - Sau expiry: Auto update status = 'expired'
3. User có thể renew certificate:
   - Pay renewal fee
   - Re-verify trip (nếu là trip certificate)
   - Generate new certificate với expiry mới

**Database Changes**:
```sql
ALTER TABLE certificates
ADD COLUMN expiry_date DATE NULL,
ADD COLUMN renewed_from INT NULL, -- Original certificate ID
ADD COLUMN renewal_count INT DEFAULT 0;
```

**Cron Job** (trong Certificate Service):
```python
# app/jobs/expiry_checker.py
@scheduler.scheduled_job('cron', hour=0, minute=0)  # Daily midnight
def check_expiring_certificates():
    # Find certificates expiring in 30 days
    expiring = db.query(Certificate).filter(
        Certificate.expiry_date <= datetime.now() + timedelta(days=30),
        Certificate.status == 'valid'
    ).all()
    
    for cert in expiring:
        send_expiry_notification(cert.user_id, cert.id, cert.expiry_date)
```

---

### **Use Case 6: Blockchain Integration** ⛓️

**Mô tả**: Lưu certificate hash lên blockchain để immutable verification

**Flow**:
1. Khi tạo certificate, hash lên blockchain (Ethereum, Polygon)
2. Certificate PDF chứa:
   - Blockchain transaction hash
   - Smart contract address
   - QR code link đến blockchain explorer
3. Anyone có thể verify certificate trên blockchain

**Smart Contract** (Solidity):
```solidity
contract CarbonCertificateRegistry {
    struct Certificate {
        string certHash;
        uint256 creditAmount;
        uint256 issueDate;
        address holder;
    }
    
    mapping(uint256 => Certificate) public certificates;
    
    function registerCertificate(
        uint256 id,
        string memory certHash,
        uint256 creditAmount,
        address holder
    ) public onlyVerifier {
        certificates[id] = Certificate(certHash, creditAmount, block.timestamp, holder);
        emit CertificateRegistered(id, certHash, holder);
    }
}
```

**Integration**:
```python
# app/services/blockchain_service.py
from web3 import Web3

class BlockchainService:
    def register_certificate(self, cert_id, cert_hash, credit_amount, user_address):
        tx = self.contract.functions.registerCertificate(
            cert_id, cert_hash, int(credit_amount * 100), user_address
        ).transact({'from': self.admin_address})
        
        receipt = self.w3.eth.wait_for_transaction_receipt(tx)
        return receipt.transactionHash.hex()
```

---

## 🔧 Technical Improvements

### **1. PDF Enhancement** ✅ (Completed)
- ✅ Sử dụng ReportLab thay vì WeasyPrint
- ✅ Professional design với colors, borders, icons
- ✅ QR code cho quick verification (coming soon)
- ✅ Watermark "VERIFIED" (coming soon)

### **2. Caching Strategy**
```python
# Redis cache cho frequently accessed certificates
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

def get_certificate_cached(cert_id):
    cache_key = f"certificate:{cert_id}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    cert = db.query(Certificate).get(cert_id)
    redis_client.setex(cache_key, 3600, json.dumps(cert.to_dict()))
    return cert
```

### **3. Event Sourcing**
```python
# Store all certificate events for audit trail
class CertificateEvent:
    id: int
    certificate_id: int
    event_type: str  # created, transferred, revoked, renewed
    event_data: JSON
    timestamp: datetime
    triggered_by: int  # User ID
```

### **4. API Rate Limiting**
```python
# Prevent abuse của verify endpoint
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/certificates/verify/{hash}")
@limiter.limit("10/minute")
def verify_certificate(hash: str):
    # Verify logic
```

---

## 📱 Mobile App Integration

### **Features**:
1. **Scan QR Code** trên PDF để verify
2. **Push notifications** khi nhận certificate mới
3. **Wallet view** - view all certificates trong mobile
4. **Quick share** certificate via email/social media

### **API Endpoints for Mobile**:
```typescript
GET /api/v2/certificates/mobile/summary?user_id={id}
Response: {
  total_credits: 500.5,
  active_certificates: 12,
  expiring_soon: 2,
  recent: [ { id, amount, date } ]
}

POST /api/v2/certificates/mobile/share
Body: { certificate_id, share_method: "email" | "whatsapp" }
```

---

## 🎨 Frontend Enhancements

### **Certificates Page Improvements**:
```typescript
// Add filters và sorting
- Filter: Valid | Expired | Revoked
- Sort: Date | Amount | Status
- Search: By certificate ID, hash
- Bulk actions: Download multiple PDFs, Export CSV

// Certificate Card Design
<CertificateCard>
  - Status badge (Valid ✓, Expired ⏰, Revoked ❌)
  - Credit amount với icon CO₂
  - Issue date & Expiry date
  - Actions: Download, Share, Transfer, View Details
</CertificateCard>
```

---

## 📈 Analytics & Insights

### **Admin Dashboard**:
```
Total Certificates Issued: 1,234
Total CO₂ Offset: 5,678 kg
Growth Rate: +15% this month

Charts:
- Certificates issued over time (line chart)
- Credits by source (pie chart: Purchase vs Trip)
- Top users by credits (leaderboard)
- Geographic distribution (map)
```

### **User Dashboard**:
```
Your Impact:
🌱 10 Certificates earned
♻️ 250 kg CO₂ offset
🏆 Top 5% users
📊 Month-over-month: +20%
```

---

## 🔐 Security Best Practices

1. **Certificate Hash Verification**: Always verify hash trước khi accept certificate
2. **PDF Digital Signature**: Sign PDF với private key để prevent tampering
3. **Access Control**: Chỉ owner hoặc admin có thể view/download full certificate
4. **Audit Logging**: Log mọi certificate operations (view, download, transfer)
5. **Rate Limiting**: Prevent spam certificate generation

---

## 🚀 Deployment Checklist

- [x] Certificate Service với ReportLab PDF generation
- [x] RabbitMQ event-driven architecture
- [x] Frontend certificate display & download
- [ ] Certificate verification public page
- [ ] Transfer/trading functionality
- [ ] Expiry & renewal system
- [ ] Corporate reporting dashboard
- [ ] Mobile app integration
- [ ] Blockchain integration (optional)

---

## 📞 Support & Maintenance

### **Monitoring**:
- Certificate generation success rate
- PDF generation latency
- RabbitMQ queue depth
- Database query performance

### **Alerts**:
- Certificate generation failures (> 5%)
- RabbitMQ consumer down
- PDF storage reaching limit
- Expired certificates not updated

---

## 🎯 Summary

**System đã hoàn thành**:
✅ Tự động tạo certificate khi mua credit từ marketplace  
✅ PDF generation với design đẹp (ReportLab)  
✅ Frontend display & download certificates  
✅ Cryptographic hash verification  
✅ Event-driven architecture (RabbitMQ)  

**Bước tiếp theo (recommendations)**:
1. **Short-term** (1-2 weeks):
   - Public verification page
   - Certificate transfer functionality
   - Better UI/UX cho certificates page

2. **Medium-term** (1-2 months):
   - Corporate reporting dashboard
   - Certificate expiry & renewal
   - Email notifications

3. **Long-term** (3+ months):
   - Mobile app
   - Blockchain integration
   - Advanced analytics

**Current Architecture**:
```
Frontend (React) → Nginx Gateway → Certificate Service (FastAPI)
                                        ↓
                                   MySQL Database
                                        ↑
                              RabbitMQ Consumer
                                        ↑
                        Transaction/Trip Services
```

Hệ thống hiện tại đã **production-ready** cho core functionality! 🎉
