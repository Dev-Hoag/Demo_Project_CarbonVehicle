# Transaction Service

Carbon Credit Transaction Service - Handles all purchase transactions, wallet operations, and credit transfers.

## Features

- **Purchase Listing**: Complete transaction flow with wallet and credit management
- **Transaction History**: Query transactions by buyer, seller, status
- **Statistics**: Revenue, spending, and CO2 transfer analytics
- **Atomic Operations**: Ensures data consistency across wallet, credit, and listing services

## Tech Stack

- NestJS
- TypeORM
- MySQL
- Docker

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

## Running the Service

### Development
```bash
npm run start:dev
```

### Docker
```bash
# From root directory
docker-compose -f Transaction_Service/docker-compose.yml up -d
```

## API Endpoints

### Purchase
- `POST /api/transactions/listings/:listingId/purchase` - Purchase a listing

### Query Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/transactions/buyer/:buyerId` - Get buyer's transactions
- `GET /api/transactions/seller/:sellerId` - Get seller's transactions
- `GET /api/transactions/status/:status` - Get transactions by status
- `GET /api/transactions/recent?limit=10` - Get recent transactions

### Statistics
- `GET /api/transactions/seller/:sellerId/revenue` - Get seller revenue
- `GET /api/transactions/buyer/:buyerId/spending` - Get buyer spending
- `GET /api/transactions/buyer/:buyerId/co2-purchased` - Get CO2 purchased
- `GET /api/transactions/seller/:sellerId/co2-sold` - Get CO2 sold

## Purchase Flow

1. Validate listing availability and buyer eligibility
2. Check buyer wallet balance
3. Create transaction record (PENDING)
4. Deduct money from buyer wallet
5. Add money to seller wallet
6. Transfer CO2 credits from seller to buyer
7. Update listing status (SOLD if fully purchased)
8. Mark transaction as COMPLETED

If any step fails, transaction is marked as FAILED and error is returned.

## Environment Variables

```env
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=transaction_service_db

APP_PORT=3009
APP_URL=http://localhost:3009

WALLET_SERVICE_URL=http://wallet-service:3008
CREDIT_SERVICE_URL=http://credit-service:8093
LISTING_SERVICE_URL=http://listing-service:8092
```

## Swagger Documentation

Access API documentation at: `http://localhost:3009/api/docs`

## Port

- Application: 3009
- MySQL: 3309 (mapped from 3306)
- Adminer: 8089
