# 🏗️ Transaction Service - Thiết Kế Chi Tiết

## 📋 Mục Lục
1. [Phân Tích Dịch Vụ Phụ Thuộc](#phân-tích-dịch-vụ-phụ-thuộc)
2. [Thiết Kế Database 4NF](#thiết-kế-database-4nf)
3. [Các Chức Năng Chính](#các-chức-năng-chính)
4. [State Machine](#state-machine)
5. [API Endpoints](#api-endpoints)

---

## 🔗 Phân Tích Dịch Vụ Phụ Thuộc

### Transaction Service Cần Các Service Sau:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Transaction Service                          │
│                       (Port 3006)                               │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
    │   Listing   │   │   Payment    │   │   Credit     │
    │  Service    │   │  Service     │   │  Service     │
    │ (3004)      │   │  (3007)      │   │  (3003)      │
    └─────────────┘   └──────────────┘   └──────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Wallet Service    │
                    │     (3008)         │
                    └────────────────────┘
                              │
                    ┌─────────▼──────────────┐
                    │ Notification Service   │
                    │      (3010)            │
                    └────────────────────────┘
```

### Chi Tiết Tương Tác:

| Service | Tương Tác | Mục Đích |
|---------|-----------|---------|
| **Listing Service** | Lấy thông tin listing, cập nhật trạng thái | Xác minh listing tồn tại, khóa credit |
| **Payment Service** | Nhận callback thanh toán, xử lý hoàn tiền | Xác nhận thanh toán, quản lý hoàn tiền |
| **Credit Service** | Transfer credit, lock/unlock | Chuyển credit từ seller sang buyer |
| **Wallet Service** | Reserve funds, settle, refund | Giữ tiền buyer, thanh toán seller |
| **Notification Service** | Gửi thông báo | Thông báo trạng thái transaction |

---

## 🗄️ Thiết Kế Database 4NF

### Nguyên Tắc 4NF:
- **1NF**: Mỗi cột chứa giá trị nguyên tử (không lặp lại)
- **2NF**: Loại bỏ phụ thuộc hàm từng phần
- **3NF**: Loại bỏ phụ thuộc hàm bắc cầu
- **4NF**: Loại bỏ phụ thuộc đa trị độc lập

### Bảng Chính:

#### 1. **transactions** (Giao dịch chính)
```sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    credit_amount DECIMAL(18,2) NOT NULL,
    price_per_credit DECIMAL(18,2) NOT NULL,
    total_price DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    status ENUM('PENDING', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 
                'CREDIT_TRANSFERRED', 'COMPLETED', 'CANCELLED', 'DISPUTED') 
           DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_listing_id (listing_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### 2. **transaction_payments** (Thông tin thanh toán)
```sql
CREATE TABLE transaction_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    payment_id BIGINT NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') 
                   DEFAULT 'PENDING',
    amount DECIMAL(18,2) NOT NULL,
    paid_at TIMESTAMP NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_payment_status (payment_status)
);
```

#### 3. **transaction_credits** (Thông tin credit transfer)
```sql
CREATE TABLE transaction_credits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    credit_transfer_id BIGINT NOT NULL,
    credit_status ENUM('PENDING', 'TRANSFERRED', 'FAILED') 
                  DEFAULT 'PENDING',
    transferred_at TIMESTAMP NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    INDEX idx_credit_transfer_id (credit_transfer_id),
    INDEX idx_credit_status (credit_status)
);
```

#### 4. **transaction_wallets** (Thông tin ví)
```sql
CREATE TABLE transaction_wallets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    buyer_wallet_reserve_id BIGINT NOT NULL,
    seller_settlement_id BIGINT NOT NULL,
    wallet_status ENUM('PENDING', 'RESERVED', 'SETTLED', 'REFUNDED') 
                  DEFAULT 'PENDING',
    reserved_at TIMESTAMP NULL,
    settled_at TIMESTAMP NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    INDEX idx_buyer_wallet_reserve_id (buyer_wallet_reserve_id),
    INDEX idx_seller_settlement_id (seller_settlement_id),
    INDEX idx_wallet_status (wallet_status)
);
```

#### 5. **transaction_escrows** (Quản lý escrow)
```sql
CREATE TABLE transaction_escrows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    amount_held DECIMAL(18,2) NOT NULL,
    held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    release_reason VARCHAR(255),
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    INDEX idx_released_at (released_at)
);
```

#### 6. **transaction_disputes** (Tranh chấp)
```sql
CREATE TABLE transaction_disputes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    raised_by BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    description TEXT,
    status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED') 
           DEFAULT 'OPEN',
    resolution VARCHAR(500),
    resolved_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (raised_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    
    UNIQUE KEY unique_active_dispute (transaction_id, status),
    INDEX idx_status (status),
    INDEX idx_raised_by (raised_by),
    INDEX idx_created_at (created_at)
);
```

#### 7. **transaction_settlements** (Thanh toán cuối cùng)
```sql
CREATE TABLE transaction_settlements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    seller_amount DECIMAL(18,2) NOT NULL,
    platform_fee DECIMAL(18,2) NOT NULL,
    buyer_refund DECIMAL(18,2) DEFAULT 0,
    settlement_status ENUM('PENDING', 'COMPLETED', 'FAILED') 
                      DEFAULT 'PENDING',
    settled_at TIMESTAMP NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    INDEX idx_settlement_status (settlement_status),
    INDEX idx_settled_at (settled_at)
);
```

#### 8. **transaction_history** (Lịch sử thay đổi)
```sql
CREATE TABLE transaction_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT,
    reason VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_changed_at (changed_at)
);
```

---

## 🎯 Các Chức Năng Chính

### 1. **Order Matching Engine**
- Khớp buyer và seller dựa trên listing
- Xác minh credit availability
- Xác minh wallet balance

### 2. **Transaction State Machine**
```
PENDING → PAYMENT_PENDING → PAYMENT_COMPLETED → CREDIT_TRANSFERRED → COMPLETED
   ↓                              ↓                      ↓
CANCELLED                    CANCELLED              CANCELLED
   ↓
DISPUTED (từ bất kỳ trạng thái nào)
```

### 3. **Dispute Resolution**
- Tạo dispute từ buyer/seller
- Admin review và resolve
- Hoàn tiền nếu cần

### 4. **Settlement & Escrow**
- Giữ tiền buyer trong escrow
- Thanh toán seller sau khi credit transferred
- Hoàn tiền nếu transaction fail

---

## 📊 State Machine Chi Tiết

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION STATES                           │
└─────────────────────────────────────────────────────────────────┘

1. PENDING (Khởi tạo)
   ├─ Tạo transaction record
   ├─ Reserve buyer wallet
   ├─ Lock seller credits
   └─ Timeout: 10 phút → CANCELLED

2. PAYMENT_PENDING (Chờ thanh toán)
   ├─ Gửi payment request
   ├─ Chờ payment callback
   └─ Timeout: 30 phút → CANCELLED

3. PAYMENT_COMPLETED (Thanh toán xong)
   ├─ Xác nhận payment
   ├─ Giữ tiền trong escrow
   └─ Bắt đầu credit transfer

4. CREDIT_TRANSFERRED (Credit chuyển xong)
   ├─ Xác nhận credit transfer
   ├─ Giải phóng escrow
   └─ Thanh toán seller

5. COMPLETED (Hoàn thành)
   ├─ Tất cả bước hoàn thành
   ├─ Tạo certificate
   └─ Gửi notification

6. CANCELLED (Hủy)
   ├─ Hoàn tiền buyer
   ├─ Unlock seller credits
   └─ Ghi log lý do

7. DISPUTED (Tranh chấp)
   ├─ Tạo dispute record
   ├─ Giữ escrow
   └─ Chờ admin resolve
```

---

## 🔌 API Endpoints

### Transaction Management (8)
```
POST   /api/transactions              # Tạo transaction
GET    /api/transactions              # Danh sách giao dịch
GET    /api/transactions/:id          # Chi tiết giao dịch
POST   /api/transactions/:id/confirm  # Xác nhận nhận hàng
POST   /api/transactions/:id/cancel   # Hủy giao dịch
GET    /api/transactions/buying       # Giao dịch mua
GET    /api/transactions/selling      # Giao dịch bán
GET    /api/transactions/completed    # Giao dịch hoàn thành
```

### Dispute Management (4)
```
POST   /api/transactions/:id/dispute           # Tạo tranh chấp
GET    /api/transactions/:id/dispute           # Chi tiết tranh chấp
POST   /api/transactions/:id/dispute/resolve   # Giải quyết (admin)
GET    /api/transactions/disputes              # Danh sách tranh chấp
```

### Internal APIs (3)
```
POST   /internal/transactions/settle           # Settle transaction
POST   /internal/transactions/refund           # Hoàn tiền
GET    /internal/transactions/:id/status       # Kiểm tra trạng thái
```

---

## 📡 Events

### Published
- TransactionCreated
- TransactionPending
- TransactionCompleted
- TransactionCancelled
- TransactionDisputed
- DisputeResolved

### Consumed
- ListingPurchased (from Listing Service)
- PaymentCompleted (from Payment Service)
- PaymentFailed (from Payment Service)

