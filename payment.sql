-- Adminer 5.4.0 MySQL 8.0.43 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DELIMITER ;;

DROP PROCEDURE IF EXISTS `sp_create_payment`;;
CREATE PROCEDURE `sp_create_payment` (IN `p_paymentCode` varchar(64), IN `p_transactionId` varchar(100), IN `p_userId` bigint, IN `p_gateway` varchar(20), IN `p_amount` decimal(15,2), IN `p_idempotencyKey` varchar(100), OUT `p_payment_id` bigint, OUT `p_is_duplicate` tinyint)
;;

DELIMITER ;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `gateway_configs`;
CREATE TABLE `gateway_configs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `environment` enum('SANDBOX','PRODUCTION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SANDBOX',
  `apiKey` text COLLATE utf8mb4_unicode_ci COMMENT 'API Key/TMN Code',
  `secretKey` text COLLATE utf8mb4_unicode_ci COMMENT 'Secret/Hash Key',
  `apiUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Base API URL',
  `webhookUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `returnUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipnUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IPN URL',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `minAmount` decimal(15,2) DEFAULT '10000.00',
  `maxAmount` decimal(15,2) DEFAULT '50000000.00',
  `rateLimit` int DEFAULT '100' COMMENT 'Max requests per minute',
  `config` json DEFAULT NULL COMMENT 'Cấu hình bổ sung theo gateway',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway` (`gateway`),
  KEY `idx_gateway` (`gateway`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cấu hình các payment gateway';

INSERT INTO `gateway_configs` (`id`, `gateway`, `environment`, `apiKey`, `secretKey`, `apiUrl`, `webhookUrl`, `returnUrl`, `ipnUrl`, `enabled`, `minAmount`, `maxAmount`, `rateLimit`, `config`, `createdAt`, `updatedAt`) VALUES
(1,	'VNPAY',	'SANDBOX',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	1,	10000.00,	50000000.00,	100,	'{\"vnp_Locale\": \"vn\", \"vnp_Command\": \"pay\", \"vnp_Version\": \"2.1.0\", \"vnp_CurrCode\": \"VND\"}',	'2025-10-29 14:01:20',	'2025-10-29 14:01:20'),
(2,	'MOMO',	'SANDBOX',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	0,	10000.00,	50000000.00,	100,	'{\"partnerCode\": \"\", \"requestType\": \"captureWallet\"}',	'2025-10-29 14:01:20',	'2025-10-29 14:01:20'),
(3,	'TEST',	'SANDBOX',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	1,	10000.00,	50000000.00,	100,	'{\"autoSuccess\": true, \"delaySeconds\": 3}',	'2025-10-29 14:01:20',	'2025-10-29 14:01:20');

DROP TABLE IF EXISTS `outbox_events`;
CREATE TABLE `outbox_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `eventId` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID cho event',
  `aggregateType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Payment/Refund',
  `aggregateId` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'paymentCode/refundCode',
  `eventType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PaymentInitiated/PaymentCompleted/PaymentFailed/RefundProcessed',
  `payload` json NOT NULL,
  `routingKey` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RabbitMQ/Kafka routing key',
  `exchange` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RabbitMQ exchange',
  `topic` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kafka topic',
  `status` enum('PENDING','PUBLISHED','FAILED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `retryCount` int NOT NULL DEFAULT '0',
  `maxRetries` int NOT NULL DEFAULT '5',
  `lastRetryAt` timestamp NULL DEFAULT NULL,
  `nextRetryAt` timestamp NULL DEFAULT NULL COMMENT 'Scheduled next retry',
  `lastError` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `publishedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `eventId` (`eventId`),
  KEY `idx_status` (`status`,`nextRetryAt`),
  KEY `idx_aggregate` (`aggregateType`,`aggregateId`),
  KEY `idx_event_type` (`eventType`),
  KEY `idx_created` (`createdAt` DESC),
  KEY `idx_published` (`publishedAt` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Outbox pattern để đảm bảo event delivery';

INSERT INTO `outbox_events` (`id`, `eventId`, `aggregateType`, `aggregateId`, `eventType`, `payload`, `routingKey`, `exchange`, `topic`, `status`, `retryCount`, `maxRetries`, `lastRetryAt`, `nextRetryAt`, `lastError`, `createdAt`, `publishedAt`) VALUES
(1,	'd181c846-c563-4c9f-b6fd-8893ec111cd9',	'Payment',	'PAY_1761746511076_KWDY56',	'PaymentInitiated',	'{\"amount\": 100000, \"userId\": 1, \"gateway\": \"VNPAY\", \"paymentCode\": \"PAY_1761746511076_KWDY56\", \"transactionId\": \"TXN_1234567890\"}',	'payment.paymentinitiated',	'carbon-credit-events',	NULL,	'PUBLISHED',	0,	5,	NULL,	NULL,	NULL,	'2025-10-29 14:01:51',	'2025-10-29 21:02:00'),
(2,	'ffe0bdde-5b72-4adb-9e9a-437e39c10f1d',	'Payment',	'PAY_1761746511076_KWDY56',	'PaymentCompleted',	'{\"amount\": \"100000.00\", \"userId\": \"1\", \"paymentCode\": \"PAY_1761746511076_KWDY56\", \"transactionId\": \"TXN_1234567890\", \"gatewayTransactionId\": \"15225915\"}',	'payment.paymentcompleted',	'carbon-credit-events',	NULL,	'PUBLISHED',	0,	5,	NULL,	NULL,	NULL,	'2025-10-29 14:02:33',	'2025-10-29 21:02:40'),
(3,	'50903fbe-6c96-4180-b108-5dfb11e7fffe',	'Payment',	'PAY_1761747359995_DQEZMQ',	'PaymentInitiated',	'{\"amount\": 100000, \"userId\": 1, \"gateway\": \"VNPAY\", \"paymentCode\": \"PAY_1761747359995_DQEZMQ\", \"transactionId\": \"TXN_1234567890\"}',	'payment.paymentinitiated',	'carbon-credit-events',	NULL,	'PUBLISHED',	0,	5,	NULL,	NULL,	NULL,	'2025-10-29 14:16:00',	'2025-10-29 21:16:10'),
(4,	'10d6c67b-12ab-4acd-a864-583be8df9ae0',	'Payment',	'PAY_1761747359995_DQEZMQ',	'PaymentCompleted',	'{\"amount\": \"100000.00\", \"userId\": \"1\", \"paymentCode\": \"PAY_1761747359995_DQEZMQ\", \"transactionId\": \"TXN_1234567890\", \"gatewayTransactionId\": \"15225931\"}',	'payment.paymentcompleted',	'carbon-credit-events',	NULL,	'PUBLISHED',	0,	5,	NULL,	NULL,	NULL,	'2025-10-29 14:16:44',	'2025-10-29 21:16:50');

DROP TABLE IF EXISTS `payment_callbacks`;
CREATE TABLE `payment_callbacks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `paymentId` bigint unsigned NOT NULL,
  `paymentCode` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Redundant for quick lookup',
  `callbackType` enum('RETURN_URL','IPN','WEBHOOK') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IPN',
  `payload` json NOT NULL COMMENT 'Full payload từ gateway',
  `rawQuery` text COLLATE utf8mb4_unicode_ci COMMENT 'Raw query string',
  `signature` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chữ ký từ gateway',
  `isValid` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=valid, 0=invalid',
  `validationError` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isProcessed` tinyint(1) NOT NULL DEFAULT '0',
  `processedAt` timestamp NULL DEFAULT NULL,
  `processingError` text COLLATE utf8mb4_unicode_ci COMMENT 'Lỗi khi xử lý callback',
  `receivedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment` (`paymentId`),
  KEY `idx_payment_code` (`paymentCode`),
  KEY `idx_is_processed` (`isProcessed`,`receivedAt`),
  KEY `idx_received` (`receivedAt` DESC),
  CONSTRAINT `fk_cb_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lưu tất cả callback/webhook từ payment gateway';

INSERT INTO `payment_callbacks` (`id`, `paymentId`, `paymentCode`, `callbackType`, `payload`, `rawQuery`, `signature`, `isValid`, `validationError`, `isProcessed`, `processedAt`, `processingError`, `receivedAt`) VALUES
(2,	2,	'PAY_1761747359995_DQEZMQ',	'RETURN_URL',	'{\"vnp_Amount\": \"10000000\", \"vnp_TxnRef\": \"PAY_1761747359995_DQEZMQ\", \"vnp_PayDate\": \"20251029211826\", \"vnp_TmnCode\": \"U94AQ1QM\", \"vnp_BankCode\": \"NCB\", \"vnp_CardType\": \"ATM\", \"vnp_OrderInfo\": \"Thanh toan mua tin chi carbon\", \"vnp_BankTranNo\": \"VNP15225931\", \"vnp_SecureHash\": \"cac7de856a8d52280d9aa818107c02006af4b7e04d25e3ec11ed920261d8a153169636ccd076be38cf84b025ea9291168dc3b1b2c23093a4a43ef99929c7f5c9\", \"vnp_ResponseCode\": \"00\", \"vnp_TransactionNo\": \"15225931\", \"vnp_TransactionStatus\": \"00\"}',	'{\"vnp_Amount\":\"10000000\",\"vnp_BankCode\":\"NCB\",\"vnp_BankTranNo\":\"VNP15225931\",\"vnp_CardType\":\"ATM\",\"vnp_OrderInfo\":\"Thanh toan mua tin chi carbon\",\"vnp_PayDate\":\"20251029211826\",\"vnp_ResponseCode\":\"00\",\"vnp_TmnCode\":\"U94AQ1QM\",\"vnp_TransactionNo\":\"15225931\",\"vnp_TransactionStatus\":\"00\",\"vnp_TxnRef\":\"PAY_1761747359995_DQEZMQ\",\"vnp_SecureHash\":\"cac7de856a8d52280d9aa818107c02006af4b7e04d25e3ec11ed920261d8a153169636ccd076be38cf84b025ea9291168dc3b1b2c23093a4a43ef99929c7f5c9\"}',	'cac7de856a8d52280d9aa818107c02006af4b7e04d25e3ec11ed920261d8a153169636ccd076be38cf84b025ea9291168dc3b1b2c23093a4a43ef99929c7f5c9',	1,	NULL,	1,	'2025-10-29 21:16:44',	NULL,	'2025-10-29 14:16:43');

DROP TABLE IF EXISTS `payment_events`;
CREATE TABLE `payment_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `paymentId` bigint unsigned NOT NULL,
  `paymentCode` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'INITIATED/CALLBACK_RECEIVED/COMPLETED/FAILED/etc',
  `eventSource` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SYSTEM/GATEWAY/USER/ADMIN',
  `fromStatus` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toStatus` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `errorMessage` text COLLATE utf8mb4_unicode_ci,
  `triggeredBy` bigint unsigned DEFAULT NULL COMMENT 'User/Admin ID',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment` (`paymentId`),
  KEY `idx_payment_code` (`paymentCode`),
  KEY `idx_event_type` (`eventType`),
  KEY `idx_created` (`createdAt` DESC),
  CONSTRAINT `fk_evt_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Event log để audit và debug';

INSERT INTO `payment_events` (`id`, `paymentId`, `paymentCode`, `eventType`, `eventSource`, `fromStatus`, `toStatus`, `details`, `errorMessage`, `triggeredBy`, `createdAt`) VALUES
(3,	2,	'PAY_1761747359995_DQEZMQ',	'INITIATED',	'USER',	'PENDING',	'PENDING',	'{\"source\": \"USER\"}',	NULL,	NULL,	'2025-10-29 14:16:00'),
(4,	2,	'PAY_1761747359995_DQEZMQ',	'CALLBACK_RECEIVED',	'SYSTEM',	'COMPLETED',	'COMPLETED',	'{\"from\": \"PENDING\", \"responseCode\": \"00\", \"transactionNo\": \"15225931\"}',	NULL,	NULL,	'2025-10-29 14:16:43');

DROP TABLE IF EXISTS `payment_retries`;
CREATE TABLE `payment_retries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `paymentId` bigint unsigned NOT NULL,
  `paymentCode` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `retryNumber` int NOT NULL,
  `retryReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actionType` enum('PAYMENT','CALLBACK','REFUND','WEBHOOK') COLLATE utf8mb4_unicode_ci NOT NULL,
  `isSuccessful` tinyint(1) NOT NULL DEFAULT '0',
  `errorMessage` text COLLATE utf8mb4_unicode_ci,
  `gatewayResponse` json DEFAULT NULL,
  `retriedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment` (`paymentId`),
  KEY `idx_retry_number` (`paymentId`,`retryNumber`),
  KEY `idx_retried` (`retriedAt` DESC),
  CONSTRAINT `fk_retry_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Theo dõi các lần retry';


DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `paymentCode` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã nội bộ Payment Service',
  `transactionId` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID từ Transaction Service',
  `userId` bigint unsigned NOT NULL,
  `gateway` enum('VNPAY','MOMO','BANK','TEST') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gatewayTransactionId` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Transaction ID từ gateway',
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `status` enum('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentUrl` text COLLATE utf8mb4_unicode_ci COMMENT 'URL redirect đến gateway',
  `returnUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL callback sau thanh toán',
  `idempotencyKey` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chống duplicate request',
  `retryCount` int NOT NULL DEFAULT '0' COMMENT 'Số lần retry',
  `maxRetries` int NOT NULL DEFAULT '3',
  `lastRetryAt` timestamp NULL DEFAULT NULL,
  `orderInfo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mô tả đơn hàng',
  `bankCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã ngân hàng (VNPay)',
  `gatewayResponseCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã phản hồi từ gateway',
  `gatewayResponseMsg` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IPv4/IPv6',
  `userAgent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `initiatedAt` timestamp NULL DEFAULT NULL COMMENT 'Thời điểm khởi tạo',
  `completedAt` timestamp NULL DEFAULT NULL COMMENT 'Thời điểm hoàn thành',
  `expiredAt` timestamp NULL DEFAULT NULL COMMENT 'Thời điểm hết hạn (thường +15 phút)',
  `metadata` json DEFAULT NULL COMMENT 'Dữ liệu bổ sung',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  UNIQUE KEY `paymentCode` (`paymentCode`),
  KEY `idx_payment_code` (`paymentCode`),
  KEY `idx_transaction` (`transactionId`),
  KEY `idx_user` (`userId`),
  KEY `idx_status` (`status`),
  KEY `idx_gateway` (`gateway`,`status`),
  KEY `idx_idempotency` (`idempotencyKey`),
  KEY `idx_gateway_tx` (`gatewayTransactionId`),
  KEY `idx_created` (`createdAt` DESC),
  KEY `idx_expired` (`expiredAt`),
  KEY `idx_user_status` (`userId`,`status`),
  KEY `idx_status_created` (`status`,`createdAt` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chính lưu thông tin thanh toán';

INSERT INTO `payments` (`id`, `paymentCode`, `transactionId`, `userId`, `gateway`, `gatewayTransactionId`, `amount`, `currency`, `status`, `paymentUrl`, `returnUrl`, `idempotencyKey`, `retryCount`, `maxRetries`, `lastRetryAt`, `orderInfo`, `bankCode`, `gatewayResponseCode`, `gatewayResponseMsg`, `ipAddress`, `userAgent`, `initiatedAt`, `completedAt`, `expiredAt`, `metadata`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(2,	'PAY_1761747359995_DQEZMQ',	'TXN_1234567890',	1,	'VNPAY',	'15225931',	100000.00,	'VND',	'COMPLETED',	'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_Command=pay&vnp_CreateDate=20251029211600&vnp_CurrCode=VND&vnp_ExpireDate=20251029213100&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+mua+tin+chi+carbon&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3002%2Fapi%2Fpayments%2Fvnpay%2Fcallback&vnp_TmnCode=U94AQ1QM&vnp_TxnRef=PAY_1761747359995_DQEZMQ&vnp_Version=2.1.0&vnp_SecureHashType=HmacSHA512&vnp_SecureHash=E0E8E6CECBB6FCABAA628C56F894FB2A0A6FBEC948347960DB746C61573F5A20F45F8C87C562C1D4BF297106A1585730003B4F8A88BA52AEDA32A72921732776',	'http://localhost:3002/api/payments/vnpay/callback',	'3670c80aaaadebee460c7bb1b0416589f5aba498f5b1d00d0cd58e4804d9ca39',	0,	3,	NULL,	'Thanh toán mua tín chỉ carbon',	'NCB',	'00',	'Giao dịch thành công',	'::ffff:172.22.0.1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',	'2025-10-29 21:16:00',	'2025-10-29 21:16:44',	'2025-10-29 21:31:00',	NULL,	'2025-10-29 14:16:00',	'2025-10-29 14:16:43',	NULL);

DROP TABLE IF EXISTS `refunds`;
CREATE TABLE `refunds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `paymentId` bigint unsigned NOT NULL,
  `refundCode` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã hoàn tiền nội bộ',
  `amount` decimal(15,2) NOT NULL COMMENT 'Số tiền hoàn',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lý do hoàn tiền',
  `refundType` enum('FULL','PARTIAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL',
  `status` enum('PENDING','PROCESSING','COMPLETED','REJECTED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `gatewayRefundId` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Refund ID từ gateway',
  `gatewayResponse` json DEFAULT NULL,
  `requestedBy` bigint unsigned DEFAULT NULL COMMENT 'Admin user ID hoặc System',
  `requestedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processedAt` timestamp NULL DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refundCode` (`refundCode`),
  KEY `idx_payment` (`paymentId`),
  KEY `idx_refund_code` (`refundCode`),
  KEY `idx_status` (`status`),
  KEY `idx_requested` (`requestedAt` DESC),
  CONSTRAINT `fk_ref_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quản lý hoàn tiền';


DROP VIEW IF EXISTS `v_failed_payments`;
CREATE TABLE `v_failed_payments` (`id` bigint unsigned, `paymentCode` varchar(64), `transactionId` varchar(100), `userId` bigint unsigned, `gateway` enum('VNPAY','MOMO','BANK','TEST'), `amount` decimal(15,2), `status` enum('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED','EXPIRED'), `retryCount` int, `maxRetries` int, `gatewayResponseCode` varchar(20), `gatewayResponseMsg` varchar(255), `createdAt` timestamp, `lastRetryAt` timestamp, `retry_status` varchar(19));


DROP VIEW IF EXISTS `v_payment_summary`;
CREATE TABLE `v_payment_summary` (`payment_date` date, `gateway` enum('VNPAY','MOMO','BANK','TEST'), `status` enum('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED','EXPIRED'), `total_payments` bigint, `total_amount` decimal(37,2), `avg_amount` decimal(19,6), `min_amount` decimal(15,2), `max_amount` decimal(15,2));


DROP VIEW IF EXISTS `v_pending_outbox`;
CREATE TABLE `v_pending_outbox` (`id` bigint unsigned, `eventId` varchar(100), `aggregateType` varchar(50), `aggregateId` varchar(100), `eventType` varchar(100), `status` enum('PENDING','PUBLISHED','FAILED','ARCHIVED'), `retryCount` int, `maxRetries` int, `nextRetryAt` timestamp, `lastError` text, `createdAt` timestamp);


DROP TABLE IF EXISTS `v_failed_payments`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_failed_payments` AS select `p`.`id` AS `id`,`p`.`paymentCode` AS `paymentCode`,`p`.`transactionId` AS `transactionId`,`p`.`userId` AS `userId`,`p`.`gateway` AS `gateway`,`p`.`amount` AS `amount`,`p`.`status` AS `status`,`p`.`retryCount` AS `retryCount`,`p`.`maxRetries` AS `maxRetries`,`p`.`gatewayResponseCode` AS `gatewayResponseCode`,`p`.`gatewayResponseMsg` AS `gatewayResponseMsg`,`p`.`createdAt` AS `createdAt`,`p`.`lastRetryAt` AS `lastRetryAt`,(case when (`p`.`retryCount` < `p`.`maxRetries`) then 'CAN_RETRY' else 'MAX_RETRIES_REACHED' end) AS `retry_status` from `payments` `p` where ((`p`.`status` in ('FAILED','PENDING')) and (`p`.`deletedAt` is null) and (`p`.`retryCount` < `p`.`maxRetries`) and ((`p`.`lastRetryAt` is null) or (`p`.`lastRetryAt` < (now() - interval 5 minute))));

DROP TABLE IF EXISTS `v_payment_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_payment_summary` AS select cast(`payments`.`createdAt` as date) AS `payment_date`,`payments`.`gateway` AS `gateway`,`payments`.`status` AS `status`,count(0) AS `total_payments`,sum(`payments`.`amount`) AS `total_amount`,avg(`payments`.`amount`) AS `avg_amount`,min(`payments`.`amount`) AS `min_amount`,max(`payments`.`amount`) AS `max_amount` from `payments` where (`payments`.`deletedAt` is null) group by cast(`payments`.`createdAt` as date),`payments`.`gateway`,`payments`.`status`;

DROP TABLE IF EXISTS `v_pending_outbox`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_pending_outbox` AS select `outbox_events`.`id` AS `id`,`outbox_events`.`eventId` AS `eventId`,`outbox_events`.`aggregateType` AS `aggregateType`,`outbox_events`.`aggregateId` AS `aggregateId`,`outbox_events`.`eventType` AS `eventType`,`outbox_events`.`status` AS `status`,`outbox_events`.`retryCount` AS `retryCount`,`outbox_events`.`maxRetries` AS `maxRetries`,`outbox_events`.`nextRetryAt` AS `nextRetryAt`,`outbox_events`.`lastError` AS `lastError`,`outbox_events`.`createdAt` AS `createdAt` from `outbox_events` where ((`outbox_events`.`status` in ('PENDING','FAILED')) and (`outbox_events`.`retryCount` < `outbox_events`.`maxRetries`) and ((`outbox_events`.`nextRetryAt` is null) or (`outbox_events`.`nextRetryAt` <= now()))) order by `outbox_events`.`createdAt`;

-- 2025-10-29 14:18:18 UTC



CREATE DATABASE IF NOT EXISTS payment_service_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE payment_service_db;

-- ============================================================
-- 1) PAYMENTS TABLE - Bổ sung các trường quan trọng
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  paymentCode           VARCHAR(64) NOT NULL UNIQUE COMMENT 'Mã nội bộ Payment Service',
  transactionId         VARCHAR(100) NOT NULL COMMENT 'ID từ Transaction Service',
  userId                BIGINT UNSIGNED NOT NULL,
  
  -- Gateway info
  gateway               ENUM('VNPAY','MOMO','BANK','TEST') NOT NULL,
  gatewayTransactionId  VARCHAR(200) NULL COMMENT 'Transaction ID từ gateway',
  
  -- Amount & Currency
  amount                DECIMAL(15,2) NOT NULL,
  currency              VARCHAR(10) NOT NULL DEFAULT 'VND',
  
  -- Status tracking
  status                ENUM('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED','EXPIRED')
                        NOT NULL DEFAULT 'PENDING',
  
  -- URLs
  paymentUrl            TEXT NULL COMMENT 'URL redirect đến gateway',
  returnUrl             VARCHAR(500) NULL COMMENT 'URL callback sau thanh toán',
  
  -- Idempotency & Retry
  idempotencyKey        VARCHAR(100) NULL COMMENT 'Chống duplicate request',
  retryCount            INT NOT NULL DEFAULT 0 COMMENT 'Số lần retry',
  maxRetries            INT NOT NULL DEFAULT 3,
  lastRetryAt           TIMESTAMP NULL,
  
  -- Payment details
  orderInfo             VARCHAR(255) NULL COMMENT 'Mô tả đơn hàng',
  bankCode              VARCHAR(50) NULL COMMENT 'Mã ngân hàng (VNPay)',
  
  -- Response from gateway
  gatewayResponseCode   VARCHAR(20) NULL COMMENT 'Mã phản hồi từ gateway',
  gatewayResponseMsg    VARCHAR(255) NULL,
  
  -- IP & Device info (for fraud detection)
  ipAddress             VARCHAR(45) NULL COMMENT 'IPv4/IPv6',
  userAgent             VARCHAR(500) NULL,
  
  -- Timing
  initiatedAt           TIMESTAMP NULL COMMENT 'Thời điểm khởi tạo',
  completedAt           TIMESTAMP NULL COMMENT 'Thời điểm hoàn thành',
  expiredAt             TIMESTAMP NULL COMMENT 'Thời điểm hết hạn (thường +15 phút)',
  
  -- Metadata (flexible JSON for additional data)
  metadata              JSON NULL COMMENT 'Dữ liệu bổ sung',
  
  -- Audit
  createdAt             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt             TIMESTAMP NULL COMMENT 'Soft delete',
  
  -- Indexes
  INDEX idx_payment_code     (paymentCode),
  INDEX idx_transaction      (transactionId),
  INDEX idx_user             (userId),
  INDEX idx_status           (status),
  INDEX idx_gateway          (gateway, status),
  INDEX idx_idempotency      (idempotencyKey),
  INDEX idx_gateway_tx       (gatewayTransactionId),
  INDEX idx_created          (createdAt DESC),
  INDEX idx_expired          (expiredAt),
  
  -- Composite indexes for common queries
  INDEX idx_user_status      (userId, status),
  INDEX idx_status_created   (status, createdAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng chính lưu thông tin thanh toán';

-- ============================================================
-- 2) PAYMENT_CALLBACKS - Webhook/Callback từ gateway
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_callbacks (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  paymentId         BIGINT UNSIGNED NOT NULL,
  paymentCode       VARCHAR(64) NOT NULL COMMENT 'Redundant for quick lookup',
  
  -- Callback info
  callbackType      ENUM('RETURN_URL','IPN','WEBHOOK') NOT NULL DEFAULT 'IPN',
  
  -- Raw data from gateway
  payload           JSON NOT NULL COMMENT 'Full payload từ gateway',
  rawQuery          TEXT NULL COMMENT 'Raw query string',
  
  -- Verification
  signature         VARCHAR(500) NULL COMMENT 'Chữ ký từ gateway',
  isValid           TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=valid, 0=invalid',
  validationError   VARCHAR(255) NULL,
  
  -- Processing
  isProcessed       TINYINT(1) NOT NULL DEFAULT 0,
  processedAt       TIMESTAMP NULL,
  processingError   TEXT NULL COMMENT 'Lỗi khi xử lý callback',
  
  -- Timing
  receivedAt        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_payment           (paymentId),
  INDEX idx_payment_code      (paymentCode),
  INDEX idx_is_processed      (isProcessed, receivedAt),
  INDEX idx_received          (receivedAt DESC),
  
  CONSTRAINT fk_cb_payment
    FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lưu tất cả callback/webhook từ payment gateway';

-- ============================================================
-- 3) REFUNDS - Hoàn tiền
-- ============================================================
CREATE TABLE IF NOT EXISTS refunds (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  paymentId         BIGINT UNSIGNED NOT NULL,
  refundCode        VARCHAR(64) NOT NULL UNIQUE COMMENT 'Mã hoàn tiền nội bộ',
  
  -- Refund details
  amount            DECIMAL(15,2) NOT NULL COMMENT 'Số tiền hoàn',
  currency          VARCHAR(10) NOT NULL DEFAULT 'VND',
  reason            VARCHAR(500) NULL COMMENT 'Lý do hoàn tiền',
  refundType        ENUM('FULL','PARTIAL') NOT NULL DEFAULT 'FULL',
  
  -- Status
  status            ENUM('PENDING','PROCESSING','COMPLETED','REJECTED','FAILED') 
                    NOT NULL DEFAULT 'PENDING',
  
  -- Gateway response
  gatewayRefundId   VARCHAR(200) NULL COMMENT 'Refund ID từ gateway',
  gatewayResponse   JSON NULL,
  
  -- Who requested
  requestedBy       BIGINT UNSIGNED NULL COMMENT 'Admin user ID hoặc System',
  
  -- Timing
  requestedAt       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processedAt       TIMESTAMP NULL,
  completedAt       TIMESTAMP NULL,
  
  -- Audit
  createdAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_payment       (paymentId),
  INDEX idx_refund_code   (refundCode),
  INDEX idx_status        (status),
  INDEX idx_requested     (requestedAt DESC),
  
  CONSTRAINT fk_ref_payment
    FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Quản lý hoàn tiền';

-- ============================================================
-- 4) GATEWAY_CONFIGS - Cấu hình gateway
-- ============================================================
CREATE TABLE IF NOT EXISTS gateway_configs (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  gateway           VARCHAR(50) NOT NULL UNIQUE,
  
  -- Environment
  environment       ENUM('SANDBOX','PRODUCTION') NOT NULL DEFAULT 'SANDBOX',
  
  -- Credentials (NÊN MÃ HÓA trong production)
  apiKey            TEXT NULL COMMENT 'API Key/TMN Code',
  secretKey         TEXT NULL COMMENT 'Secret/Hash Key',
  apiUrl            VARCHAR(255) NULL COMMENT 'Base API URL',
  
  -- Webhooks
  webhookUrl        VARCHAR(255) NULL,
  returnUrl         VARCHAR(255) NULL,
  ipnUrl            VARCHAR(255) NULL COMMENT 'IPN URL',
  
  -- Status & Limits
  enabled           TINYINT(1) NOT NULL DEFAULT 1,
  minAmount         DECIMAL(15,2) NULL DEFAULT 10000.00,
  maxAmount         DECIMAL(15,2) NULL DEFAULT 50000000.00,
  
  -- Rate limiting
  rateLimit         INT NULL DEFAULT 100 COMMENT 'Max requests per minute',
  
  -- Additional config
  config            JSON NULL COMMENT 'Cấu hình bổ sung theo gateway',
  
  -- Audit
  createdAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_gateway       (gateway),
  INDEX idx_enabled       (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cấu hình các payment gateway';

-- ============================================================
-- 5) PAYMENT_EVENTS - Event log (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_events (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  paymentId         BIGINT UNSIGNED NOT NULL,
  paymentCode       VARCHAR(64) NOT NULL,
  
  -- Event info
  eventType         VARCHAR(50) NOT NULL COMMENT 'INITIATED/CALLBACK_RECEIVED/COMPLETED/FAILED/etc',
  eventSource       VARCHAR(50) NULL COMMENT 'SYSTEM/GATEWAY/USER/ADMIN',
  
  -- Previous & new state
  fromStatus        VARCHAR(20) NULL,
  toStatus          VARCHAR(20) NULL,
  
  -- Event details
  details           JSON NULL,
  errorMessage      TEXT NULL,
  
  -- Who triggered (if applicable)
  triggeredBy       BIGINT UNSIGNED NULL COMMENT 'User/Admin ID',
  
  -- Timing
  createdAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_payment         (paymentId),
  INDEX idx_payment_code    (paymentCode),
  INDEX idx_event_type      (eventType),
  INDEX idx_created         (createdAt DESC),
  
  CONSTRAINT fk_evt_payment
    FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Event log để audit và debug';

-- ============================================================
-- 6) OUTBOX_EVENTS - Event sourcing cho microservices
-- ============================================================
CREATE TABLE IF NOT EXISTS outbox_events (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  
  -- Event identity
  eventId           VARCHAR(100) NOT NULL UNIQUE COMMENT 'UUID cho event',
  aggregateType     VARCHAR(50) NOT NULL COMMENT 'Payment/Refund',
  aggregateId       VARCHAR(100) NOT NULL COMMENT 'paymentCode/refundCode',
  
  -- Event details
  eventType         VARCHAR(100) NOT NULL COMMENT 'PaymentInitiated/PaymentCompleted/PaymentFailed/RefundProcessed',
  payload           JSON NOT NULL,
  
  -- Routing info
  routingKey        VARCHAR(100) NULL COMMENT 'RabbitMQ/Kafka routing key',
  exchange          VARCHAR(100) NULL COMMENT 'RabbitMQ exchange',
  topic             VARCHAR(100) NULL COMMENT 'Kafka topic',
  
  -- Status
  status            ENUM('PENDING','PUBLISHED','FAILED','ARCHIVED') NOT NULL DEFAULT 'PENDING',
  
  -- Retry mechanism
  retryCount        INT NOT NULL DEFAULT 0,
  maxRetries        INT NOT NULL DEFAULT 5,
  lastRetryAt       TIMESTAMP NULL,
  nextRetryAt       TIMESTAMP NULL COMMENT 'Scheduled next retry',
  
  -- Error tracking
  lastError         TEXT NULL,
  
  -- Timing
  createdAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  publishedAt       TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_status              (status, nextRetryAt),
  INDEX idx_aggregate           (aggregateType, aggregateId),
  INDEX idx_event_type          (eventType),
  INDEX idx_created             (createdAt DESC),
  INDEX idx_published           (publishedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Outbox pattern để đảm bảo event delivery';

-- ============================================================
-- 7) PAYMENT_RETRIES - Track retry attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_retries (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  paymentId         BIGINT UNSIGNED NOT NULL,
  paymentCode       VARCHAR(64) NOT NULL,
  
  -- Retry info
  retryNumber       INT NOT NULL,
  retryReason       VARCHAR(255) NULL,
  
  -- What was retried
  actionType        ENUM('PAYMENT','CALLBACK','REFUND','WEBHOOK') NOT NULL,
  
  -- Result
  isSuccessful      TINYINT(1) NOT NULL DEFAULT 0,
  errorMessage      TEXT NULL,
  
  -- Response
  gatewayResponse   JSON NULL,
  
  -- Timing
  retriedAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_payment       (paymentId),
  INDEX idx_retry_number  (paymentId, retryNumber),
  INDEX idx_retried       (retriedAt DESC),
  
  CONSTRAINT fk_retry_payment
    FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Theo dõi các lần retry';

-- ============================================================
-- INSERT DEFAULT DATA
-- ============================================================

-- Insert default gateway configs
INSERT INTO gateway_configs (gateway, environment, enabled, config) VALUES
('VNPAY', 'SANDBOX', 1, JSON_OBJECT(
  'vnp_Version', '2.1.0',
  'vnp_Command', 'pay',
  'vnp_Locale', 'vn',
  'vnp_CurrCode', 'VND'
)),
('MOMO', 'SANDBOX', 0, JSON_OBJECT(
  'partnerCode', '',
  'requestType', 'captureWallet'
)),
('TEST', 'SANDBOX', 1, JSON_OBJECT(
  'autoSuccess', true,
  'delaySeconds', 3
))
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- ============================================================
-- VIEWS (Optional - for reporting)
-- ============================================================

-- View: Payment summary by status
CREATE OR REPLACE VIEW v_payment_summary AS
SELECT 
  DATE(createdAt) as payment_date,
  gateway,
  status,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM payments
WHERE deletedAt IS NULL
GROUP BY DATE(createdAt), gateway, status;

-- View: Failed payments that need attention
CREATE OR REPLACE VIEW v_failed_payments AS
SELECT 
  p.id,
  p.paymentCode,
  p.transactionId,
  p.userId,
  p.gateway,
  p.amount,
  p.status,
  p.retryCount,
  p.maxRetries,
  p.gatewayResponseCode,
  p.gatewayResponseMsg,
  p.createdAt,
  p.lastRetryAt,
  CASE 
    WHEN p.retryCount < p.maxRetries THEN 'CAN_RETRY'
    ELSE 'MAX_RETRIES_REACHED'
  END as retry_status
FROM payments p
WHERE p.status IN ('FAILED', 'PENDING')
  AND p.deletedAt IS NULL
  AND p.retryCount < p.maxRetries
  AND (
    p.lastRetryAt IS NULL 
    OR p.lastRetryAt < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
  );

-- View: Pending outbox events
CREATE OR REPLACE VIEW v_pending_outbox AS
SELECT 
  id,
  eventId,
  aggregateType,
  aggregateId,
  eventType,
  status,
  retryCount,
  maxRetries,
  nextRetryAt,
  lastError,
  createdAt
FROM outbox_events
WHERE status IN ('PENDING', 'FAILED')
  AND retryCount < maxRetries
  AND (nextRetryAt IS NULL OR nextRetryAt <= NOW())
ORDER BY createdAt ASC;

-- ============================================================
-- STORED PROCEDURES (Optional - for common operations)
-- ============================================================

DELIMITER $$

-- Procedure: Create payment with idempotency check
CREATE PROCEDURE sp_create_payment(
  IN p_paymentCode VARCHAR(64),
  IN p_transactionId VARCHAR(100),
  IN p_userId BIGINT,
  IN p_gateway VARCHAR(20),
  IN p_amount DECIMAL(15,2),
  IN p_idempotencyKey VARCHAR(100),
  OUT p_payment_id BIGINT,
  OUT p_is_duplicate TINYINT
)
BEGIN
  DECLARE existing_id BIGINT;
  
  -- Check idempotency
  SELECT id INTO existing_id 
  FROM payments 
  WHERE idempotencyKey = p_idempotencyKey 
  LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    SET p_payment_id = existing_id;
    SET p_is_duplicate = 1;
  ELSE
    INSERT INTO payments (
      paymentCode, transactionId, userId, gateway, amount, 
      idempotencyKey, initiatedAt, expiredAt
    ) VALUES (
      p_paymentCode, p_transactionId, p_userId, p_gateway, p_amount,
      p_idempotencyKey, NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE)
    );
    
    SET p_payment_id = LAST_INSERT_ID();
    SET p_is_duplicate = 0;
  END IF;
END$$

DELIMITER ;