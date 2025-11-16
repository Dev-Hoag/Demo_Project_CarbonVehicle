CREATE DATABASE IF NOT EXISTS notification_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE notification_service_db;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    type ENUM('TRIP_VERIFIED', 'LISTING_CREATED', 'LISTING_SOLD', 'PAYMENT_COMPLETED', 'CREDIT_ISSUED', 'WITHDRAWAL_APPROVED', 'SYSTEM_ALERT') NOT NULL,
    channel ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    status ENUM('PENDING', 'SENT', 'FAILED', 'READ') DEFAULT 'PENDING',
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(100) NOT NULL UNIQUE,
    channel ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP') NOT NULL,
    title_template VARCHAR(255),
    content_template TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type)
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    event_preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

-- FCM device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    device_type ENUM('ANDROID', 'IOS', 'WEB') NOT NULL,
    device_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
);

-- Notification logs for tracking delivery
CREATE TABLE IF NOT EXISTS notification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL,
    status ENUM('QUEUED', 'SENDING', 'SENT', 'FAILED', 'DELIVERED') NOT NULL,
    error_message TEXT,
    metadata JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    INDEX idx_notification_id (notification_id),
    INDEX idx_status (status)
);

-- Insert default notification templates
INSERT INTO notification_templates (event_type, channel, title_template, content_template, variables) VALUES
('TRIP_VERIFIED', 'PUSH', 'Trip Verified ✅', 'Your trip has been verified! You earned {{credits}} kg CO₂ credits.', '["credits"]'),
('TRIP_VERIFIED', 'IN_APP', 'Trip Verified', 'Your trip has been verified and {{credits}} kg CO₂ credits have been added to your wallet.', '["credits"]'),
('LISTING_CREATED', 'PUSH', 'Listing Created 📝', 'Your listing for {{amount}} kg CO₂ at {{price}}₫/kg is now live!', '["amount", "price"]'),
('LISTING_SOLD', 'PUSH', 'Listing Sold 💰', 'Congratulations! Your listing was sold for {{total}}₫', '["total"]'),
('PAYMENT_COMPLETED', 'PUSH', 'Payment Completed ✅', 'Payment of {{amount}}₫ has been processed successfully.', '["amount"]'),
('CREDIT_ISSUED', 'PUSH', 'Credits Issued 🎉', 'You received {{credits}} kg CO₂ credits from your recent trip.', '["credits"]'),
('WITHDRAWAL_APPROVED', 'PUSH', 'Withdrawal Approved 💸', 'Your withdrawal request of {{amount}}₫ has been approved.', '["amount"]'),
('SYSTEM_ALERT', 'IN_APP', 'System Notification', '{{message}}', '["message"]');
