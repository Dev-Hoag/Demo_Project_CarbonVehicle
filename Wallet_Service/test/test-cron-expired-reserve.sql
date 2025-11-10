-- Test Reserve Expiration Cron Job
-- Create an expired reserve to test cleanup

USE wallet_service_db;

-- Insert an expired reserve (expired 5 minutes ago)
INSERT INTO reserves (
    id,
    wallet_id,
    transaction_id,
    amount,
    status,
    expires_at,
    notes,
    created_at,
    updated_at
) VALUES (
    'test-expired-reserve-001',
    '11111111-1111-1111-1111-111111111111', -- user-seed-1's wallet
    'test-transaction-expired-001',
    100000.00,
    'ACTIVE',
    DATE_SUB(NOW(), INTERVAL 5 MINUTE), -- Expired 5 minutes ago
    'Test expired reserve for cron job testing',
    NOW(),
    NOW()
);

-- Check current reserves
SELECT 
    id,
    transaction_id,
    amount,
    status,
    expires_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END as current_status,
    notes
FROM reserves
WHERE wallet_id = '11111111-1111-1111-1111-111111111111'
ORDER BY created_at DESC;

-- Check wallet locked balance
SELECT 
    user_id,
    balance,
    available_balance,
    locked_balance
FROM wallets
WHERE id = '11111111-1111-1111-1111-111111111111';
