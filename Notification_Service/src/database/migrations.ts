import pool from "../config/database";
import logger from "../config/logger";

const migrations = [
  // Main notifications table
  `CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    channel ENUM('EMAIL', 'IN_APP') NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    status ENUM('PENDING', 'SENT', 'FAILED', 'READ') DEFAULT 'PENDING',
    priority ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_user_status (user_id, status),
    INDEX idx_type (type),
    INDEX idx_channel (channel),
    INDEX idx_priority (priority)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Notification templates
  `CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(100) NOT NULL,
    channel ENUM('EMAIL', 'IN_APP') NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    placeholders JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_event_channel (event_type, channel),
    INDEX idx_event_type (event_type),
    INDEX idx_is_active (is_active),
    INDEX idx_channel (channel)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Notification logs
  `CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    notification_id BIGINT NOT NULL,
    status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_log FOREIGN KEY (notification_id) 
        REFERENCES notifications(id) ON DELETE CASCADE,
    
    INDEX idx_notification_id (notification_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_retry_count (retry_count)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Notification metadata
  `CREATE TABLE IF NOT EXISTS notification_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    notification_id BIGINT NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    value TEXT,
    
    CONSTRAINT fk_notification_metadata FOREIGN KEY (notification_id) 
        REFERENCES notifications(id) ON DELETE CASCADE,
    
    INDEX idx_notification_id (notification_id),
    INDEX idx_key_name (key_name),
    INDEX idx_notification_key (notification_id, key_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // View for unread notifications
  `CREATE OR REPLACE VIEW v_unread_notifications AS
   SELECT
     n.id,
     n.user_id,
     n.type,
     n.channel,
     n.subject,
     n.content,
     n.priority,
     n.created_at
   FROM notifications n
   WHERE n.status IN ('PENDING', 'SENT')
     AND n.channel = 'IN_APP'
   ORDER BY n.created_at DESC`,

  // View for notification summary
  `CREATE OR REPLACE VIEW v_notification_summary AS
   SELECT
     n.id,
     n.user_id,
     n.type,
     n.channel,
     n.subject,
     n.status,
     n.priority,
     n.created_at,
     n.sent_at,
     n.read_at,
     (SELECT COUNT(*) FROM notification_logs nl WHERE nl.notification_id = n.id) as log_count,
     (SELECT MAX(retry_count) FROM notification_logs nl WHERE nl.notification_id = n.id) as max_retries
   FROM notifications n`,
];

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    logger.info("Starting database migrations...");

    for (const migration of migrations) {
      try {
        await connection.execute(migration);
        logger.info("Migration executed successfully");
      } catch (error) {
        logger.error("Migration error", { error });
      }
    }

    logger.info("All migrations completed");
  } finally {
    connection.release();
  }
}

runMigrations().catch((error) => {
  logger.error("Fatal migration error", { error });
  process.exit(1);
});
