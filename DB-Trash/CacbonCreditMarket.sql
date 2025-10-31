-- MySQL 8.0 DDL
CREATE DATABASE IF NOT EXISTS `CarbonCreditMarket`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE `CarbonCreditMarket`;

-- =========================
-- Tables
-- =========================

CREATE TABLE `user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `role` ENUM ('EV_OWNER', 'BUYER', 'CVA', 'ADMIN') NOT NULL DEFAULT 'EV_OWNER',
  `kyc_status` ENUM ('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `kyc_verified_at` DATETIME,
  `cva_org_id` BIGINT,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_login_at` DATETIME,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cva_org` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `license_no` VARCHAR(100) UNIQUE,
  `accreditation_level` VARCHAR(50),
  `contact_email` VARCHAR(255),
  `contact_phone` VARCHAR(20),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `region` (
  `code` VARCHAR(16) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `country_code` VARCHAR(3) NOT NULL,
  `grid_emission_factor_g_per_kwh` DECIMAL(10,2) NOT NULL,
  `baseline_ice_g_co2_per_km` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vehicle` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `owner_id` BIGINT NOT NULL,
  `vin` VARCHAR(64) UNIQUE,
  `make` VARCHAR(64),
  `model` VARCHAR(64),
  `year` INT,
  `battery_capacity_kwh` DECIMAL(8,2),
  `efficiency_kwh_per_km` DECIMAL(8,4),
  `region_code` VARCHAR(16),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `trip` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `vehicle_id` BIGINT NOT NULL,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NOT NULL,
  `distance_km` DECIMAL(10,2) NOT NULL,
  `energy_consumed_kwh` DECIMAL(10,3),
  `source` ENUM ('DEVICE', 'FILE', 'MANUAL') NOT NULL DEFAULT 'FILE',
  `raw_data_url` VARCHAR(512),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `emission_reduction` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `trip_id` BIGINT UNIQUE NOT NULL,
  `ice_factor_g_per_km` DECIMAL(10,2) NOT NULL,
  `ev_grid_factor_g_per_km` DECIMAL(10,2) NOT NULL,
  `co2_avoided_kg` DECIMAL(12,3) NOT NULL,
  `calc_method` VARCHAR(64) NOT NULL,
  `calc_version` VARCHAR(32) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `verification_request` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `owner_id` BIGINT NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `total_trips` INT NOT NULL DEFAULT 0,
  `total_distance_km` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total_co2_avoided_kg` DECIMAL(12,3) NOT NULL,
  `status` ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  `cva_reviewer_id` BIGINT,
  `submitted_at` DATETIME,
  `reviewed_at` DATETIME,
  `remarks` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `verification_request_trip` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `verification_request_id` BIGINT NOT NULL,
  `trip_id` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `credit_issuance` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `verification_request_id` BIGINT UNIQUE NOT NULL,
  `issuance_date` DATE NOT NULL,
  `certificate_no` VARCHAR(64) UNIQUE NOT NULL,
  `total_credits_issued` DECIMAL(12,3) NOT NULL,
  `issued_by_id` BIGINT,
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `carbon_credit` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `owner_id` BIGINT NOT NULL,
  `issuance_id` BIGINT NOT NULL,
  `serial_number` VARCHAR(64) UNIQUE NOT NULL,
  `quantity_tco2e` DECIMAL(12,3) NOT NULL,
  `available_qty_tco2e` DECIMAL(12,3) NOT NULL,
  `status` ENUM ('ACTIVE', 'RESERVED', 'SOLD', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
  `vintage_year` INT,
  `project_type` VARCHAR(64),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `listing` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `seller_id` BIGINT NOT NULL,
  `credit_id` BIGINT NOT NULL,
  `type` ENUM ('FIXED', 'AUCTION') NOT NULL,
  `price_per_tco2e` DECIMAL(12,2),
  `reserve_price` DECIMAL(12,2),
  `min_qty_tco2e` DECIMAL(12,3),
  `max_qty_tco2e` DECIMAL(12,3),
  `auction_start_at` DATETIME,
  `auction_end_at` DATETIME,
  `status` ENUM ('ACTIVE', 'PAUSED', 'SOLD', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `views_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bid` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `listing_id` BIGINT NOT NULL,
  `buyer_id` BIGINT NOT NULL,
  `bid_price` DECIMAL(12,2) NOT NULL,
  `quantity_tco2e` DECIMAL(12,3) NOT NULL,
  `status` ENUM ('ACTIVE', 'OUTBID', 'WON', 'LOST', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `placed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `listing_id` BIGINT NOT NULL,
  `buyer_id` BIGINT NOT NULL,
  `seller_id` BIGINT NOT NULL,
  `quantity_tco2e` DECIMAL(12,3) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `platform_fee` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM ('PENDING', 'PAID', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME,
  `cancelled_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_item` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `credit_id` BIGINT NOT NULL,
  `quantity_tco2e` DECIMAL(12,3) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `line_total` DECIMAL(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `wallet` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT UNIQUE NOT NULL,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'VND',
  `balance` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `escrow_balance` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `wallet_txn` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `wallet_id` BIGINT NOT NULL,
  `type` ENUM ('DEPOSIT', 'WITHDRAW', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'PAYMENT', 'PAYOUT', 'REFUND', 'FEE') NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `balance_after` DECIMAL(14,2) NOT NULL,
  `ref_type` VARCHAR(32),
  `ref_id` BIGINT,
  `description` TEXT,
  `status` ENUM ('PENDING', 'POSTED', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'POSTED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payment` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `method` ENUM ('WALLET', 'BANK_TRANSFER', 'CREDIT_CARD', 'E_WALLET') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `transaction_ref` VARCHAR(128),
  `gateway_response` JSON,
  `status` ENUM ('INIT', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'INIT',
  `paid_at` DATETIME,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payout_request` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `bank_account_info` JSON NOT NULL,
  `status` ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `processed_at` DATETIME,
  `processed_by_id` BIGINT,
  `remarks` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `certificate` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_id` BIGINT UNIQUE NOT NULL,
  `serial_no` VARCHAR(64) UNIQUE NOT NULL,
  `buyer_id` BIGINT NOT NULL,
  `quantity_tco2e` DECIMAL(12,3) NOT NULL,
  `file_url` VARCHAR(512),
  `metadata` JSON,
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `retired` BOOLEAN NOT NULL DEFAULT FALSE,
  `retired_at` DATETIME,
  `retirement_reason` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dispute` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_id` BIGINT UNIQUE NOT NULL,
  `opened_by_id` BIGINT NOT NULL,
  `reason` TEXT NOT NULL,
  `evidence_urls` JSON,
  `status` ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `assigned_to_id` BIGINT,
  `resolution_notes` TEXT,
  `opened_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `market_price_history` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `avg_price` DECIMAL(12,2) NOT NULL,
  `min_price` DECIMAL(12,2),
  `max_price` DECIMAL(12,2),
  `volume_tco2e` DECIMAL(12,3),
  `transaction_count` INT,
  `region_code` VARCHAR(16)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `price_suggestion` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `listing_id` BIGINT NOT NULL,
  `suggested_price` DECIMAL(12,2) NOT NULL,
  `confidence_score` DECIMAL(5,4),
  `model_version` VARCHAR(32) NOT NULL,
  `features_json` JSON,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audit_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `actor_id` BIGINT,
  `action` VARCHAR(64) NOT NULL,
  `entity` VARCHAR(64) NOT NULL,
  `entity_id` BIGINT,
  `old_values` JSON,
  `new_values` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Indexes (non-duplicate)
-- =========================

CREATE UNIQUE INDEX `user_index_0` ON `user` (`email`);
CREATE INDEX `user_index_1` ON `user` (`role`);
CREATE INDEX `user_index_2` ON `user` (`kyc_status`);

CREATE INDEX `vehicle_index_3` ON `vehicle` (`owner_id`);

CREATE INDEX `trip_index_5` ON `trip` (`vehicle_id`);
CREATE INDEX `trip_index_6` ON `trip` (`started_at`);
CREATE INDEX `trip_index_7` ON `trip` (`vehicle_id`, `started_at`);

CREATE INDEX `verification_request_index_9` ON `verification_request` (`owner_id`);
CREATE INDEX `verification_request_index_10` ON `verification_request` (`status`);
CREATE INDEX `verification_request_index_11` ON `verification_request` (`cva_reviewer_id`);

CREATE UNIQUE INDEX `verification_request_trip_index_12` ON `verification_request_trip` (`verification_request_id`, `trip_id`);
CREATE INDEX `verification_request_trip_index_13` ON `verification_request_trip` (`verification_request_id`);
CREATE INDEX `verification_request_trip_index_14` ON `verification_request_trip` (`trip_id`);

CREATE INDEX `carbon_credit_index_17` ON `carbon_credit` (`owner_id`);
CREATE INDEX `carbon_credit_index_19` ON `carbon_credit` (`status`);
CREATE INDEX `carbon_credit_index_20` ON `carbon_credit` (`issuance_id`);

CREATE INDEX `listing_index_21` ON `listing` (`seller_id`);
CREATE INDEX `listing_index_22` ON `listing` (`credit_id`);
CREATE INDEX `listing_index_23` ON `listing` (`status`);
CREATE INDEX `listing_index_24` ON `listing` (`type`);

CREATE INDEX `bid_index_25` ON `bid` (`listing_id`);
CREATE INDEX `bid_index_26` ON `bid` (`buyer_id`);
CREATE INDEX `bid_index_27` ON `bid` (`status`);
CREATE INDEX `bid_index_28` ON `bid` (`placed_at`);

CREATE INDEX `order_index_29` ON `order` (`listing_id`);
CREATE INDEX `order_index_30` ON `order` (`buyer_id`);
CREATE INDEX `order_index_31` ON `order` (`seller_id`);
CREATE INDEX `order_index_32` ON `order` (`status`);
CREATE INDEX `order_index_33` ON `order` (`created_at`);

CREATE INDEX `order_item_index_34` ON `order_item` (`order_id`);
CREATE INDEX `order_item_index_35` ON `order_item` (`credit_id`);

CREATE INDEX `wallet_txn_index_37` ON `wallet_txn` (`wallet_id`);
CREATE INDEX `wallet_txn_index_38` ON `wallet_txn` (`type`);
CREATE INDEX `wallet_txn_index_39` ON `wallet_txn` (`created_at`);
CREATE INDEX `wallet_txn_index_40` ON `wallet_txn` (`ref_type`, `ref_id`);

CREATE INDEX `payment_index_41` ON `payment` (`order_id`);
CREATE INDEX `payment_index_42` ON `payment` (`status`);
CREATE INDEX `payment_index_43` ON `payment` (`transaction_ref`);

CREATE INDEX `payout_request_index_44` ON `payout_request` (`user_id`);
CREATE INDEX `payout_request_index_45` ON `payout_request` (`status`);

CREATE INDEX `certificate_index_48` ON `certificate` (`buyer_id`);
CREATE INDEX `certificate_index_49` ON `certificate` (`retired`);

CREATE INDEX `dispute_index_51` ON `dispute` (`opened_by_id`);
CREATE INDEX `dispute_index_52` ON `dispute` (`status`);

CREATE INDEX `market_price_history_index_53` ON `market_price_history` (`recorded_at`);
CREATE INDEX `market_price_history_index_54` ON `market_price_history` (`region_code`);

CREATE INDEX `price_suggestion_index_55` ON `price_suggestion` (`listing_id`);
CREATE INDEX `price_suggestion_index_56` ON `price_suggestion` (`created_at`);

CREATE INDEX `audit_log_index_57` ON `audit_log` (`actor_id`);
CREATE INDEX `audit_log_index_58` ON `audit_log` (`entity`);
CREATE INDEX `audit_log_index_59` ON `audit_log` (`entity_id`);
CREATE INDEX `audit_log_index_60` ON `audit_log` (`created_at`);

-- =========================
-- Comments
-- =========================
ALTER TABLE `user` COMMENT = 'Unified user table for all roles: EV_OWNER, BUYER, CVA, ADMIN';
ALTER TABLE `cva_org` COMMENT = 'Carbon Verification & Audit Organizations';
ALTER TABLE `region` COMMENT = 'Regional emission factors for CO₂ calculation';
ALTER TABLE `vehicle` COMMENT = 'Electric vehicles registered by EV Owners';
ALTER TABLE `trip` COMMENT = 'Individual trips made by EVs';
ALTER TABLE `emission_reduction` COMMENT = 'CO₂ emission reduction calculation for each trip';
ALTER TABLE `verification_request` COMMENT = 'Verification requests submitted by EV Owners to CVA';
ALTER TABLE `verification_request_trip` COMMENT = 'Junction table linking verification requests to trips';
ALTER TABLE `credit_issuance` COMMENT = 'Record of credit issuance after successful verification';
ALTER TABLE `carbon_credit` COMMENT = 'Individual carbon credit lots owned by users';
ALTER TABLE `listing` COMMENT = 'Listings for selling carbon credits (fixed price or auction)';
ALTER TABLE `bid` COMMENT = 'Bids placed on auction listings';
ALTER TABLE `order` COMMENT = 'Purchase orders for carbon credits';
ALTER TABLE `order_item` COMMENT = 'Line items for orders (supporting partial credit purchases)';
ALTER TABLE `wallet` COMMENT = 'User wallets for managing funds';
ALTER TABLE `wallet_txn` COMMENT = 'Wallet transaction ledger for full traceability';
ALTER TABLE `payment` COMMENT = 'Payment records for orders';
ALTER TABLE `payout_request` COMMENT = 'Withdrawal requests from sellers';
ALTER TABLE `certificate` COMMENT = 'Carbon credit certificates issued to buyers';
ALTER TABLE `dispute` COMMENT = 'Dispute management for problematic transactions';
ALTER TABLE `market_price_history` COMMENT = 'Historical market price data for AI analysis';
ALTER TABLE `price_suggestion` COMMENT = 'AI-generated price suggestions for sellers';
ALTER TABLE `audit_log` COMMENT = 'Comprehensive audit trail for all critical actions';

-- =========================
-- Foreign Keys
-- =========================
ALTER TABLE `user` ADD FOREIGN KEY (`cva_org_id`) REFERENCES `cva_org` (`id`);

ALTER TABLE `vehicle` ADD FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`);
ALTER TABLE `vehicle` ADD FOREIGN KEY (`region_code`) REFERENCES `region` (`code`);

ALTER TABLE `trip` ADD FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`id`);

ALTER TABLE `emission_reduction` ADD FOREIGN KEY (`trip_id`) REFERENCES `trip` (`id`);

ALTER TABLE `verification_request` ADD FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`);
ALTER TABLE `verification_request` ADD FOREIGN KEY (`cva_reviewer_id`) REFERENCES `user` (`id`);

ALTER TABLE `verification_request_trip` ADD FOREIGN KEY (`verification_request_id`) REFERENCES `verification_request` (`id`);
ALTER TABLE `verification_request_trip` ADD FOREIGN KEY (`trip_id`) REFERENCES `trip` (`id`);

ALTER TABLE `credit_issuance` ADD FOREIGN KEY (`verification_request_id`) REFERENCES `verification_request` (`id`);
ALTER TABLE `credit_issuance` ADD FOREIGN KEY (`issued_by_id`) REFERENCES `user` (`id`);

ALTER TABLE `carbon_credit` ADD FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`);
ALTER TABLE `carbon_credit` ADD FOREIGN KEY (`issuance_id`) REFERENCES `credit_issuance` (`id`);

ALTER TABLE `listing` ADD FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`);
ALTER TABLE `listing` ADD FOREIGN KEY (`credit_id`) REFERENCES `carbon_credit` (`id`);

ALTER TABLE `bid` ADD FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`);
ALTER TABLE `bid` ADD FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`);

ALTER TABLE `order` ADD FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`);
ALTER TABLE `order` ADD FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`);
ALTER TABLE `order` ADD FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`);

ALTER TABLE `order_item` ADD FOREIGN KEY (`order_id`) REFERENCES `order` (`id`);
ALTER TABLE `order_item` ADD FOREIGN KEY (`credit_id`) REFERENCES `carbon_credit` (`id`);

ALTER TABLE `wallet` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `wallet_txn` ADD FOREIGN KEY (`wallet_id`) REFERENCES `wallet` (`id`);

ALTER TABLE `payment` ADD FOREIGN KEY (`order_id`) REFERENCES `order` (`id`);

ALTER TABLE `payout_request` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `payout_request` ADD FOREIGN KEY (`processed_by_id`) REFERENCES `user` (`id`);

ALTER TABLE `certificate` ADD FOREIGN KEY (`order_id`) REFERENCES `order` (`id`);
ALTER TABLE `certificate` ADD FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`);

ALTER TABLE `dispute` ADD FOREIGN KEY (`order_id`) REFERENCES `order` (`id`);
ALTER TABLE `dispute` ADD FOREIGN KEY (`opened_by_id`) REFERENCES `user` (`id`);
ALTER TABLE `dispute` ADD FOREIGN KEY (`assigned_to_id`) REFERENCES `user` (`id`);

ALTER TABLE `price_suggestion` ADD FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`);

ALTER TABLE `audit_log` ADD FOREIGN KEY (`actor_id`) REFERENCES `user` (`id`);
