-- ============================================
-- Initialize Certificate Service Database
-- ============================================

CREATE DATABASE IF NOT EXISTS certificate_service_db;
USE certificate_service_db;

-- ============================================
-- Recreate user with mysql_native_password
-- ============================================
DROP USER IF EXISTS 'certuser'@'%';
CREATE USER 'certuser'@'%' IDENTIFIED WITH mysql_native_password BY 'certpassword';
GRANT ALL PRIVILEGES ON certificate_service_db.* TO 'certuser'@'%';
FLUSH PRIVILEGES;

-- ============================================
-- TABLE: certificate_templates
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    pdf_template_path VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_template_name (template_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: certificates
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    verification_id INT NOT NULL,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    credit_amount DECIMAL(10,2) NOT NULL,
    cert_hash VARCHAR(255) NOT NULL UNIQUE,
    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    pdf_url VARCHAR(255) DEFAULT NULL,
    template_id INT DEFAULT NULL,
    status ENUM('valid', 'expired', 'revoked') DEFAULT 'valid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
    INDEX idx_verification_id (verification_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_user_id (user_id),
    INDEX idx_cert_hash (cert_hash),
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: certificate_verifications
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cert_id INT NOT NULL,
    verified_by INT DEFAULT NULL,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verification_method ENUM('system', 'manual', 'public') DEFAULT 'system',
    FOREIGN KEY (cert_id) REFERENCES certificates(id) ON DELETE CASCADE,
    INDEX idx_cert_id (cert_id),
    INDEX idx_verified_at (verified_at),
    INDEX idx_verification_method (verification_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: certificate_downloads
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cert_id INT NOT NULL,
    downloaded_by INT DEFAULT NULL,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cert_id) REFERENCES certificates(id) ON DELETE CASCADE,
    INDEX idx_cert_id (cert_id),
    INDEX idx_downloaded_at (downloaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert default templates
INSERT INTO certificate_templates (template_name, pdf_template_path, description, is_active)
VALUES 
    ('Default Certificate', 'templates/default_certificate.html', 'Standard carbon credit certificate template', TRUE),
    ('Premium Certificate', 'templates/premium_certificate.html', 'Premium carbon credit certificate template', TRUE)
ON DUPLICATE KEY UPDATE template_name = template_name;

-- Insert sample certificates
INSERT INTO certificates (verification_id, trip_id, user_id, credit_amount, cert_hash, pdf_url, template_id, status)
VALUES
    (101, 501, 1001, 12.50, 'abc123hashxyz0001', '/certificates/cert_1001.pdf', 1, 'valid'),
    (102, 502, 1002, 8.75, 'abc123hashxyz0002', '/certificates/cert_1002.pdf', 1, 'valid'),
    (103, 503, 1003, 5.00, 'abc123hashxyz0003', '/certificates/cert_1003.pdf', 2, 'revoked'),
    (104, 504, 1004, 15.00, 'abc123hashxyz0004', '/certificates/cert_1004.pdf', 2, 'expired');

-- Insert sample verifications
INSERT INTO certificate_verifications (cert_id, verified_by, verified_at, verification_method)
VALUES
    (1, 2001, NOW() - INTERVAL 5 DAY, 'system'),
    (1, 2002, NOW() - INTERVAL 2 DAY, 'public'),
    (2, 2003, NOW() - INTERVAL 1 DAY, 'manual');

-- Insert sample downloads
INSERT INTO certificate_downloads (cert_id, downloaded_by, downloaded_at)
VALUES
    (1, 1001, NOW() - INTERVAL 3 DAY),
    (1, 1001, NOW() - INTERVAL 1 DAY),
    (2, 1002, NOW() - INTERVAL 2 HOUR),
    (3, 1003, NOW() - INTERVAL 5 HOUR);

-- ============================================
-- SHOW RESULTS
-- ============================================
SHOW TABLES;

SELECT * FROM certificate_templates;
SELECT * FROM certificates;
SELECT * FROM certificate_verifications;
SELECT * FROM certificate_downloads;
