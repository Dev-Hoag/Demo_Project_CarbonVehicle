-- Seed wallets
INSERT INTO wallets (id, user_id, balance, locked_balance, currency, status, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user-seed-1', 5000000, 0, 'VND', 'ACTIVE', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'user-seed-2', 2000000, 0, 'VND', 'ACTIVE', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'user-seed-3', 10000000, 0, 'VND', 'ACTIVE', NOW(), NOW());

-- Seed wallet transactions
INSERT INTO wallet_transactions (id, wallet_id, type, amount, status, balance_before, balance_after, created_at)
VALUES
  ('tx-1', '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 5000000, 'COMPLETED', 0, 5000000, NOW()),
  ('tx-2', '22222222-2222-2222-2222-222222222222', 'DEPOSIT', 2000000, 'COMPLETED', 0, 2000000, NOW()),
  ('tx-3', '33333333-3333-3333-3333-333333333333', 'DEPOSIT', 10000000, 'COMPLETED', 0, 10000000, NOW()),
  ('tx-4', '11111111-1111-1111-1111-111111111111', 'WITHDRAW', -1000000, 'COMPLETED', 5000000, 4000000, NOW());

-- Seed withdrawals
INSERT INTO withdrawals (id, wallet_id, user_id, amount, net_amount, bank_account_name, bank_account_number, bank_name, status, created_at)
VALUES
  ('wd-1', '11111111-1111-1111-1111-111111111111', 'user-seed-1', 1000000, 1000000, 'Nguyen Van A', '123456789', 'VCB', 'COMPLETED', NOW());