# Wallet Service

Wallet Service for Carbon Credit Marketplace - Quản lý ví tiền (VND/USD) cho người dùng.

## 🎯 Responsibilities

- Manage fiat money wallets (VND/USD)
- Deposit & Withdrawal
- Balance tracking
- Reserve funds for purchases (escrow)
- Settlement after transactions
- Transaction history

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MySQL >= 8
- RabbitMQ
- User Service running (port 3001)
- Payment Service running (port 3007)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration

# Run database migrations (if using TypeORM migrations)
npm run migration:run

# Start development server
npm run start:dev
```

### Access
- API: http://localhost:3008
- Swagger Docs: http://localhost:3008/api/docs

## 📦 API Endpoints

### Public APIs (10 endpoints)

**Wallet Management:**
- `GET /api/wallets` - Get wallet balance
- `POST /api/wallets/deposit` - Initiate deposit (via Payment Service)
- `POST /api/wallets/withdraw` - Request withdrawal
- `GET /api/wallets/transactions` - Get transaction history
- `GET /api/wallets/summary` - Get wallet summary
- `GET /api/wallets/limits` - Get withdrawal limits

### Internal APIs (4 endpoints)

**For Transaction Service & Admin Service:**
- `POST /internal/wallets/reserve` - Reserve funds for transaction
- `POST /internal/wallets/release` - Release reserved funds
- `POST /internal/wallets/settle` - Settle transaction (transfer funds)
- `POST /internal/wallets/refund` - Refund payment

## 🔄 Event Flow

### Publishes:
- `WalletCreated` - New wallet created
- `WalletDeposited` - Funds deposited
- `WalletWithdrawn` - Withdrawal processed
- `FundsReserved` - Funds locked for transaction
- `FundsReleased` - Reserved funds released
- `FundsSettled` - Transaction settled

### Consumes:
- `PaymentCompleted` - Update balance after payment
- `TransactionCreated` - Reserve funds
- `TransactionCompleted` - Settle funds
- `TransactionCancelled` - Release reserved funds

## 🏗️ Database Schema

### Tables:
- `wallets` - User wallet balances
- `wallet_transactions` - Transaction history
- `reserves` - Fund reservations (escrow)
- `withdrawals` - Withdrawal requests

## 🔧 Tech Stack

- NestJS
- TypeORM
- MySQL
- RabbitMQ
- Swagger
- JWT Authentication

## 📝 Author

Chung - Wallet Service Developer
