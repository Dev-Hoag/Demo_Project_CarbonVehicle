USE verification_db;

-- ============================================
-- Bảng verifications (Tối ưu - 9 fields)
-- ============================================
DROP TABLE IF EXISTS verifications;

CREATE TABLE verifications (
    -- Primary & Foreign Keys
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID của verification',
    trip_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'Link đến Trip trong MRV Service',
    user_id VARCHAR(36) NOT NULL COMMENT 'EV Owner ID',
    verifier_id VARCHAR(36) DEFAULT NULL COMMENT 'CVA ID (người xác minh)',
    
    -- CO2 & Credits Data
    co2_saved_kg DECIMAL(15, 4) NOT NULL COMMENT 'Lượng CO2 giảm (kg)',
    credits_suggested DECIMAL(15, 4) NOT NULL COMMENT 'Tín chỉ đề xuất (tonnes CO2e)',
    
    -- Verification Status & Results
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' NOT NULL COMMENT 'Trạng thái',
    remarks TEXT DEFAULT NULL COMMENT 'Ghi chú CVA (approve/reject reason)',
    
    -- Digital Signature
    signature_hash VARCHAR(255) DEFAULT NULL COMMENT 'Chữ ký số SHA256',
    signed_at TIMESTAMP NULL COMMENT 'Thời gian ký',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Indexes
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_verifier_id (verifier_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_created_at (created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bảng xác minh tín chỉ carbon';


-- ============================================
-- Bảng verification_events (Optional - Outbox Pattern)
-- ============================================
DROP TABLE IF EXISTS verification_events;

CREATE TABLE verification_events (
    id VARCHAR(36) PRIMARY KEY,
    verification_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(50) NOT NULL COMMENT 'APPROVED, REJECTED',
    payload TEXT NOT NULL COMMENT 'JSON data',
    published BOOLEAN DEFAULT FALSE COMMENT 'Đã publish qua Kafka chưa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    
    INDEX idx_published (published),
    INDEX idx_verification_id (verification_id),
    
    FOREIGN KEY (verification_id) REFERENCES verifications(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Outbox pattern for Kafka events';


-- ============================================
-- Sample Data (để test)
-- ============================================

INSERT INTO verifications (
    id, 
    trip_id, 
    user_id, 
    co2_saved_kg, 
    credits_suggested, 
    status
) VALUES 
-- Record 1: PENDING - chờ CVA duyệt
(
    'verif-001', 
    'trip-001', 
    'user-001', 
    2.5000, 
    0.0025, 
    'PENDING'
),

-- Record 2: PENDING - chờ CVA duyệt
(
    'verif-002', 
    'trip-002', 
    'user-001', 
    3.2000, 
    0.0032, 
    'PENDING'
),

-- Record 3: APPROVED - đã duyệt (có signature)
(
    'verif-003', 
    'trip-003', 
    'user-002', 
    5.5000, 
    0.0055, 
    'APPROVED'
),

-- Record 4: REJECTED - bị từ chối
(
    'verif-004', 
    'trip-004', 
    'user-002', 
    1.8000, 
    0.0018, 
    'REJECTED'
)
ON DUPLICATE KEY UPDATE id=id;

-- Update record APPROVED với signature
UPDATE verifications 
SET 
    verifier_id = 'cva-001',
    remarks = 'Data verified and approved',
    signature_hash = 'abc123def456...',
    signed_at = NOW()
WHERE id = 'verif-003';

-- Update record REJECTED với remarks
UPDATE verifications 
SET 
    verifier_id = 'cva-001',
    remarks = 'GPS data inconsistent, distance calculation error'
WHERE id = 'verif-004';


-- Seed sample data for verification_events (linked to existing records)
INSERT INTO verification_events (
    id,
    verification_id,
    event_type,
    payload,
    published,
    created_at,
    published_at
) VALUES
(
    'event-003',
    'verif-003',
    'APPROVED',
    JSON_OBJECT('verification_id', 'verif-003', 'status', 'APPROVED'),
    FALSE,
    NOW(),
    NULL
),
(
    'event-004',
    'verif-004',
    'REJECTED',
    JSON_OBJECT('verification_id', 'verif-004', 'status', 'REJECTED'),
    FALSE,
    NOW(),
    NULL
)
ON DUPLICATE KEY UPDATE id = id;

-- ============================================
-- Views (Optional - để query dễ hơn)
-- ============================================

-- View: Pending verifications
CREATE OR REPLACE VIEW pending_verifications AS
SELECT 
    id,
    trip_id,
    user_id,
    co2_saved_kg,
    credits_suggested,
    created_at
FROM verifications
WHERE status = 'PENDING'
ORDER BY created_at ASC;

-- View: Statistics by user
CREATE OR REPLACE VIEW user_verification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_verifications,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
    SUM(CASE WHEN status = 'APPROVED' THEN co2_saved_kg ELSE 0 END) as total_co2_saved,
    SUM(CASE WHEN status = 'APPROVED' THEN credits_suggested ELSE 0 END) as total_credits
FROM verifications
GROUP BY user_id;