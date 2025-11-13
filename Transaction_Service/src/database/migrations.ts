import pool from '../config/database';
import logger from '../config/logger';

const migrations = [
  // Main transactions table
  `CREATE TABLE IF NOT EXISTS transactions (
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
    
    CONSTRAINT chk_price_positive CHECK (total_price > 0),
    CONSTRAINT chk_credit_amount_positive CHECK (credit_amount > 0),
    CONSTRAINT chk_buyer_not_seller CHECK (buyer_id != seller_id),
    
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_listing_id (listing_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_buyer_status (buyer_id, status),
    INDEX idx_seller_status (seller_id, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction payments
  `CREATE TABLE IF NOT EXISTS transaction_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    payment_id BIGINT NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') 
                   DEFAULT 'PENDING',
    amount DECIMAL(18,2) NOT NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_payment FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    
    INDEX idx_payment_id (payment_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_paid_at (paid_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction credits
  `CREATE TABLE IF NOT EXISTS transaction_credits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    credit_transfer_id BIGINT NOT NULL,
    credit_status ENUM('PENDING', 'TRANSFERRED', 'FAILED') 
                  DEFAULT 'PENDING',
    transferred_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_credit FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE,
    
    INDEX idx_credit_transfer_id (credit_transfer_id),
    INDEX idx_credit_status (credit_status),
    INDEX idx_transferred_at (transferred_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction wallets
  `CREATE TABLE IF NOT EXISTS transaction_wallets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    buyer_wallet_reserve_id BIGINT NOT NULL,
    seller_settlement_id BIGINT NOT NULL,
    wallet_status ENUM('PENDING', 'RESERVED', 'SETTLED', 'REFUNDED') 
                  DEFAULT 'PENDING',
    reserved_at TIMESTAMP NULL,
    settled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_wallet FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE,
    
    INDEX idx_buyer_wallet_reserve_id (buyer_wallet_reserve_id),
    INDEX idx_seller_settlement_id (seller_settlement_id),
    INDEX idx_wallet_status (wallet_status),
    INDEX idx_reserved_at (reserved_at),
    INDEX idx_settled_at (settled_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction escrows
  `CREATE TABLE IF NOT EXISTS transaction_escrows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    amount_held DECIMAL(18,2) NOT NULL,
    held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    release_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_escrow FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_escrow_amount CHECK (amount_held > 0),
    
    INDEX idx_released_at (released_at),
    INDEX idx_held_at (held_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction disputes
  `CREATE TABLE IF NOT EXISTS transaction_disputes (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_dispute FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_active_dispute (transaction_id, status),
    INDEX idx_status (status),
    INDEX idx_raised_by (raised_by),
    INDEX idx_created_at (created_at),
    INDEX idx_resolved_at (resolved_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction settlements
  `CREATE TABLE IF NOT EXISTS transaction_settlements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL UNIQUE,
    seller_amount DECIMAL(18,2) NOT NULL,
    platform_fee DECIMAL(18,2) NOT NULL,
    buyer_refund DECIMAL(18,2) DEFAULT 0,
    settlement_status ENUM('PENDING', 'COMPLETED', 'FAILED') 
                      DEFAULT 'PENDING',
    settled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_settlement FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_seller_amount CHECK (seller_amount >= 0),
    CONSTRAINT chk_platform_fee CHECK (platform_fee >= 0),
    CONSTRAINT chk_buyer_refund CHECK (buyer_refund >= 0),
    
    INDEX idx_settlement_status (settlement_status),
    INDEX idx_settled_at (settled_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction history
  `CREATE TABLE IF NOT EXISTS transaction_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT,
    reason VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_history FOREIGN KEY (transaction_id)
        REFERENCES transactions(id) ON DELETE CASCADE,

    INDEX idx_transaction_id (transaction_id),
    INDEX idx_changed_at (changed_at),
    INDEX idx_new_status (new_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Transaction summary view
  `CREATE OR REPLACE VIEW v_transaction_summary AS
   SELECT
     t.id,
     t.listing_id,
     t.buyer_id,
     t.seller_id,
     t.credit_amount,
     t.total_price,
     t.status,
     tp.payment_status,
     tc.credit_status,
     tw.wallet_status,
     te.amount_held as escrow_amount,
     ts.seller_amount,
     ts.platform_fee,
     t.created_at,
     t.updated_at
   FROM transactions t
   LEFT JOIN transaction_payments tp ON t.id = tp.transaction_id
   LEFT JOIN transaction_credits tc ON t.id = tc.transaction_id
   LEFT JOIN transaction_wallets tw ON t.id = tw.transaction_id
   LEFT JOIN transaction_escrows te ON t.id = te.transaction_id
   LEFT JOIN transaction_settlements ts ON t.id = ts.transaction_id`,

  // Active disputes view
  `CREATE OR REPLACE VIEW v_active_disputes AS
   SELECT
     d.id,
     d.transaction_id,
     d.raised_by,
     d.reason,
     d.description,
     d.status,
     d.created_at,
     d.updated_at
   FROM transaction_disputes d
   WHERE d.status IN ('OPEN', 'IN_REVIEW')`
];

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    logger.info('Starting database migrations...');
    
    for (const migration of migrations) {
      try {
        await connection.execute(migration);
        logger.info('Migration executed successfully');
      } catch (error) {
        logger.error('Migration error', { error });
      }
    }
    
    logger.info('All migrations completed');
  } finally {
    connection.release();
  }
}

runMigrations().catch(error => {
  logger.error('Fatal migration error', { error });
  process.exit(1);
});

