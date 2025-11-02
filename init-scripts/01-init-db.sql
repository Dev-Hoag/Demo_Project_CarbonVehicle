-- Database đã được tạo tự động từ docker-compose.yml
USE verification_db;

-- Tạo bảng verifications
CREATE TABLE IF NOT EXISTS verifications (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    cva_id VARCHAR(36) DEFAULT NULL,
    
    co2_saved_kg DECIMAL(15, 4) NOT NULL,
    credits_suggested DECIMAL(15, 4) NOT NULL,
    trip_distance_km DECIMAL(10, 2) NOT NULL,
    trip_date TIMESTAMP NOT NULL,
    
    status ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    
    verified_co2_kg DECIMAL(15, 4) NULL,
    verified_credits DECIMAL(15, 4) NULL,
    verifier_remarks TEXT NULL,
    
    signature_hash VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample data
INSERT INTO verifications (id, trip_id, user_id, co2_saved_kg, credits_suggested, trip_distance_km, trip_date) 
VALUES 
('test-001', 'trip-001', 'user-001', 2.5, 0.0025, 15.5, NOW()),
('test-002', 'trip-002', 'user-001', 3.2, 0.0032, 20.0, NOW())
ON DUPLICATE KEY UPDATE id=id;