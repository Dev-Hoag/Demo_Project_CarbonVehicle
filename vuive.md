## 🎯 System Overview

**Project:** Carbon Credit Marketplace for EV Owners  
**Architecture:** Microservices + Event-Driven  
**Total Services:** 11 microservices  

---

## 📊 Service Inventory

### **Core Services (7)**
1. User Service
2. Trip Service
3. Verification Service (CVA)
4. Credit Service
5. Listing Service
6. Transaction Service
7. Wallet Service

### **Supporting Services (4)**
8. Payment Service
9. Certificate Service
10. Notification Service
11. Admin Service

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                │
│         (Authentication, Rate Limiting, Routing)                    │
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────────┐
        │                       │                           │
┌───────▼──────┐      ┌────────▼────────┐        ┌────────▼────────┐
│ User Service │      │  Trip Service   │        │ Credit Service  │
│   Port 3001  │      │   Port 3002     │        │   Port 3003     │
└──────┬───────┘      └────────┬────────┘        └────────┬────────┘
       │                       │                           │
       │              ┌────────▼────────┐        ┌────────▼────────┐
       │              │ Verification    │        │ Listing Service │
       │              │  Service (CVA)  │        │   Port 3004     │
       │              │   Port 3005     │        └────────┬────────┘
       │              └────────┬────────┘                 │
       │                       │                 ┌────────▼────────┐
┌──────▼───────┐     ┌────────▼────────┐       │ Transaction     │
│ Wallet       │     │ Payment Service │       │   Service       │
│ Service      │     │   Port 3007     │       │   Port 3006     │
│ Port 3008    │     └─────────────────┘       └────────┬────────┘
└──────────────┘                                         │
       │                                        ┌────────▼────────┐
       │                                        │ Certificate     │
       │                                        │   Service       │
       │                                        │   Port 3009     │
       │                                        └─────────────────┘
       │              ┌─────────────────────────────────┐
       └──────────────┤     Notification Service        │
                      │         Port 3010               │
                      └─────────────────────────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │    Admin Service        │
                      │      Port 3000          │
                      │  (Monitor & Control)    │
                      └─────────────────────────┘
```

---

## 📦 Service Details

---

### **1. User Service** 👤(Hoàng)
**Port:** 3001  
**Database:** user_service_db (MySQL)  
**Status:** ✅ Implemented

#### **Responsibilities:**
- User registration & authentication (JWT)
- Profile management (EV Owner, Buyer, CVA)
- KYC verification (document upload & verification)
- Role-based access control (RBAC)
- Provide user data to other services (internal API)

#### **Key Features:**
- Multi-role support (EV Owner, Buyer, CVA)
- JWT token authentication & refresh
- KYC document management
- User status management (Active, Pending, Suspended, Deleted)
- Profile customization per user type

#### **Database Tables:**
```sql
- users (id, email, password_hash, user_type, status, kyc_status)
- user_profiles (user_id, full_name, phone, address, vehicle_info, company_info)
- kyc_documents (user_id, document_type, file_url, status, verified_by)
- user_sessions (user_id, refresh_token, expires_at)
```

#### **API Endpoints (15 endpoints):**
**Authentication (5):**
- POST   /api/auth/register
- POST   /api/auth/login
- POST   /api/auth/refresh
- POST   /api/auth/logout
- GET    /api/auth/me

**Profile Management (3):**
- GET    /api/users/profile
- PUT    /api/users/profile
- GET    /api/users/:id

**KYC (4):**
- POST   /api/kyc/upload
- GET    /api/kyc/status
- GET    /api/kyc/documents
- DELETE /api/kyc/documents/:id

**Internal API (3):**
- GET    /internal/users/:id
- GET    /internal/users/email/:email
- POST   /internal/users/validate

#### **Events Published:**
- UserRegistered
- KycApproved
- KycRejected
- UserSuspended

#### **Events Consumed:**
- None (Foundation service)

---

### **2. Trip Service** 🚗(Hiếu)
**Port:** 3002  
**Database:** trip_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Upload trip data from EV (CSV/JSON/API)
- Calculate CO2 reduction based on distance & vehicle type
- Store trip history
- Provide trip analytics
- Send trip data to Verification Service

#### **Key Features:**
- Support multiple data upload formats (CSV, JSON, API integration)
- CO2 calculation engine (distance × emission factor)
- Trip aggregation & analytics
- Real-time data validation
- Historical trip tracking

#### **Database Tables:**
```sql
- trips (id, user_id, vehicle_id, start_time, end_time, distance_km, co2_reduced)
- trip_raw_data (trip_id, gps_coordinates, speed_data, battery_usage)
- emission_factors (vehicle_type, co2_per_km_saved)
- trip_summaries (user_id, period, total_distance, total_co2_reduced)
```

#### **API Endpoints (12 endpoints):**
**Trip Management (8):**
- POST   /api/trips/upload              # Upload trip data (CSV/JSON)
- POST   /api/trips/upload/batch        # Batch upload
- GET    /api/trips                     # List my trips
- GET    /api/trips/:id                 # Trip details
- DELETE /api/trips/:id                 # Delete trip
- POST   /api/trips/:id/calculate       # Recalculate CO2
- POST   /api/trips/:id/submit-verification # Submit to CVA
- GET    /api/trips/:id/status          # Verification status

**Analytics (4):**
- GET    /api/trips/summary             # Total stats (distance, CO2)
- GET    /api/trips/summary/monthly     # Monthly summary
- GET    /api/trips/chart/co2-trend     # CO2 trend chart
- GET    /api/trips/chart/distance      # Distance chart

#### **Events Published:**
- TripUploaded
- TripCalculated
- TripSubmittedForVerification

#### **Events Consumed:**
- TripVerified (from Verification Service)
- TripRejected (from Verification Service)

#### **Business Logic:**
```typescript
// CO2 Calculation Formula
CO2_Saved = Distance_KM × (ICE_Emission_Factor - EV_Emission_Factor)

// Example:
// Distance: 100 km
// ICE car: 150g CO2/km
// EV: 50g CO2/km (considering electricity source)
// CO2_Saved = 100 × (150 - 50) = 10,000g = 10kg CO2
```

---

### **3. Verification Service (CVA)** ✅
**Port:** 3005  
**Database:** verification_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Receive trip verification requests
- CVA reviews trip data
- Approve/reject credit issuance
- Generate verification reports
- Maintain verification audit trail

#### **Key Features:**
- Multi-step verification workflow
- Automated validation rules
- Manual review by CVA officers
- Batch verification support
- Verification history & audit logs

#### **Database Tables:**
```sql
- verification_requests (id, trip_id, user_id, status, cva_id, submitted_at)
- verification_rules (rule_name, rule_logic, threshold)
- verification_actions (request_id, cva_id, action, reason, timestamp)
- verification_reports (request_id, report_url, generated_at)
```

#### **API Endpoints (10 endpoints):**
**CVA Workflow (6):**
- GET    /api/cva/requests              # Pending verification requests
- GET    /api/cva/requests/:id          # Request details
- POST   /api/cva/requests/:id/approve  # Approve & issue credits
- POST   /api/cva/requests/:id/reject   # Reject with reason
- POST   /api/cva/requests/:id/request-info # Request more info
- GET    /api/cva/requests/assigned     # Requests assigned to me

**Reports (4):**
- GET    /api/cva/reports               # My verification reports
- GET    /api/cva/reports/:id/download  # Download report PDF
- POST   /api/cva/reports/generate      # Generate summary report
- GET    /api/cva/stats                 # CVA performance stats

#### **Events Published:**
- TripVerified (approved)
- TripRejected
- CreditIssuanceApproved
- VerificationReportGenerated

#### **Events Consumed:**
- TripSubmittedForVerification (from Trip Service)

---

### **4. Credit Service** 💳(Hiếu)
**Port:** 3003  
**Database:** credit_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Issue carbon credits after verification
- Manage credit wallet (balance tracking)
- Lock/unlock credits for listings
- Transfer credits on sale
- Maintain credit ownership history

#### **Key Features:**
- Credit issuance workflow
- Wallet balance management
- Credit locking mechanism (for active listings)
- Transfer tracking & audit
- Credit expiration handling

#### **Database Tables:**
```sql
- carbon_credits (id, user_id, amount, issued_at, expires_at, status, trip_id)
- credit_wallets (user_id, available_balance, locked_balance, total_earned)
- credit_transfers (id, from_user, to_user, amount, transaction_id, timestamp)
- credit_history (wallet_id, action_type, amount, balance_after, timestamp)
```

#### **API Endpoints (12 endpoints):**
**Wallet (5):**
- GET    /api/credits/wallet            # My wallet balance
- GET    /api/credits/wallet/history    # Transaction history
- GET    /api/credits/wallet/summary    # Summary stats
- GET    /api/credits/available          # Available for sale
- GET    /api/credits/locked            # Locked in listings

**Credits (5):**
- GET    /api/credits                   # List my credits
- GET    /api/credits/:id               # Credit details
- POST   /api/credits/:id/retire        # Retire credit (for own use)
- GET    /api/credits/expiring          # Soon-to-expire credits
- POST   /api/credits/extend            # Extend credit validity

**Internal API (2):**
- POST   /internal/credits/issue        # Issue credits (called by CVA)
- POST   /internal/credits/transfer     # Transfer (called by Transaction)

#### **Events Published:**
- CreditIssued
- CreditLocked
- CreditUnlocked
- CreditTransferred
- CreditRetired

#### **Events Consumed:**
- TripVerified (from Verification Service)
- TransactionCompleted (from Transaction Service)
- ListingCancelled (from Listing Service)

---

### **5. Listing Service** 📋(Hiếu)
**Port:** 3004  
**Database:** listing_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Create listings (fixed price / auction)
- Search & filter marketplace
- Manage listing lifecycle
- Handle bidding for auctions
- AI price suggestion

#### **Key Features:**
- Dual listing types (fixed price, auction)
- Advanced search & filters
- Real-time bid updates
- Listing expiration management
- AI-powered price recommendations

#### **Database Tables:**
```sql
- listings (id, seller_id, credit_amount, price, listing_type, status, expires_at)
- auctions (listing_id, start_time, end_time, current_bid, winner_id)
- bids (auction_id, bidder_id, bid_amount, timestamp)
- listing_views (listing_id, viewer_id, viewed_at)
- price_suggestions (listing_id, suggested_price, algorithm_version)
```

#### **API Endpoints (18 endpoints):**
**Listing Management (8):**
- POST   /api/listings                  # Create listing
- GET    /api/listings                  # Search listings (with filters)
- GET    /api/listings/:id              # Listing details
- PUT    /api/listings/:id              # Update listing
- DELETE /api/listings/:id              # Cancel listing
- POST   /api/listings/:id/renew        # Extend listing
- GET    /api/listings/my-listings      # My active listings
- GET    /api/listings/my-history       # My listing history

**Fixed Price (2):**
- POST   /api/listings/:id/buy          # Buy immediately
- POST   /api/listings/:id/reserve      # Reserve (hold for 10 min)

**Auction (5):**
- POST   /api/listings/:id/bid          # Place bid
- GET    /api/listings/:id/bids         # Bid history
- GET    /api/listings/:id/highest-bid  # Current highest bid
- GET    /api/listings/auctions/ending-soon # Ending soon
- POST   /api/listings/:id/buy-now      # Buy now (if set)

**AI Features (3):**
- POST   /api/listings/price-suggestion # Get AI price suggestion
- GET    /api/listings/similar          # Find similar listings
- GET    /api/listings/trending         # Trending listings

#### **Events Published:**
- ListingCreated
- ListingUpdated
- ListingCancelled
- ListingSold
- BidPlaced
- AuctionEnded

#### **Events Consumed:**
- CreditIssued (from Credit Service)
- TransactionCompleted (from Transaction Service)

---

### **6. Transaction Service** 💰
**Port:** 3006  
**Database:** transaction_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Process buy/sell orders
- Match buyers & sellers
- Handle order lifecycle
- Manage disputes
- Settlement coordination

#### **Key Features:**
- Order matching engine
- Transaction state machine
- Dispute resolution workflow
- Escrow mechanism
- Automatic settlement

#### **Database Tables:**
```sql
- transactions (id, buyer_id, seller_id, listing_id, amount, price, status)
- orders (id, transaction_id, order_type, status, created_at)
- escrow (transaction_id, amount_held, released_at)
- disputes (transaction_id, raised_by, reason, status, resolved_at)
- settlements (transaction_id, seller_amount, platform_fee, settled_at)
```

#### **API Endpoints (15 endpoints):**
**Transaction (8):**
- POST   /api/transactions              # Create transaction
- GET    /api/transactions              # List my transactions
- GET    /api/transactions/:id          # Transaction details
- POST   /api/transactions/:id/confirm  # Confirm receipt
- POST   /api/transactions/:id/cancel   # Cancel (if allowed)
- GET    /api/transactions/buying       # My purchases
- GET    /api/transactions/selling      # My sales
- GET    /api/transactions/completed    # Completed transactions

**Dispute (4):**
- POST   /api/transactions/:id/dispute  # Raise dispute
- GET    /api/transactions/:id/dispute  # Dispute details
- POST   /api/transactions/:id/dispute/resolve # Resolve (admin)
- GET    /api/transactions/disputes     # My disputes

**Internal API (3):**
- POST   /internal/transactions/settle  # Settle transaction
- POST   /internal/transactions/refund  # Refund transaction
- GET    /internal/transactions/:id/status # Check status

#### **Events Published:**
- TransactionCreated
- TransactionPending
- TransactionCompleted
- TransactionCancelled
- TransactionDisputed
- DisputeResolved

#### **Events Consumed:**
- ListingPurchased (from Listing Service)
- PaymentCompleted (from Payment Service)
- PaymentFailed (from Payment Service)

---

### **7. Wallet Service** 💵(Chung)
**Port:** 3008  
**Database:** wallet_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Manage fiat money wallet (VND/USD)
- Deposit & withdrawal
- Balance tracking
- Reserve funds for purchases
- Settlement after transactions

#### **Key Features:**
- Multi-currency support
- Fund reservation (escrow)
- Withdrawal limits
- Transaction history
- Balance notifications

#### **Database Tables:**
```sql
- wallets (user_id, balance, currency, status)
- wallet_transactions (id, wallet_id, type, amount, status, ref_id, timestamp)
- reserves (transaction_id, wallet_id, amount, expires_at)
- withdrawals (id, wallet_id, amount, bank_account, status, processed_at)
```

#### **API Endpoints (10 endpoints):**
**Wallet (6):**
- GET    /api/wallets                   # Get wallet balance
- POST   /api/wallets/deposit           # Deposit money
- POST   /api/wallets/withdraw          # Withdraw money
- GET    /api/wallets/transactions      # Transaction history
- GET    /api/wallets/summary           # Summary stats
- GET    /api/wallets/limits            # Withdrawal limits

**Internal API (4):**
- POST   /internal/wallets/reserve      # Reserve funds
- POST   /internal/wallets/release      # Release reservation
- POST   /internal/wallets/settle       # Settle transaction
- POST   /internal/wallets/refund       # Refund payment

#### **Events Published:**
- WalletDeposited
- WalletWithdrawn
- FundsReserved
- FundsReleased
- FundsSettled

#### **Events Consumed:**
- TransactionCreated (from Transaction Service)
- TransactionCompleted (from Transaction Service)
- TransactionCancelled (from Transaction Service)

---

### **8. Payment Service** 💳(Hoàng)
**Port:** 3007  
**Database:** payment_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Integrate with payment gateways (VNPay, MoMo, Banking)
- Handle payment callbacks
- Process refunds
- Payment status tracking

#### **Key Features:**
- Multi-gateway support
- Payment retry mechanism
- Webhook handling
- Refund processing
- Payment reconciliation

#### **Database Tables:**
```sql
- payments (id, transaction_id, amount, gateway, status, payment_url)
- payment_callbacks (payment_id, callback_data, received_at)
- refunds (payment_id, amount, reason, status, processed_at)
- gateway_configs (gateway_name, api_key, webhook_url, enabled)
```

#### **API Endpoints (8 endpoints):**
- POST   /api/payments/initiate         # Start payment
- GET    /api/payments/:id/status       # Check status
- POST   /api/payments/callback         # Gateway callback
- POST   /api/payments/:id/refund       # Process refund
- GET    /api/payments/history          # My payment history
- POST   /api/payments/:id/retry        # Retry failed payment
- GET    /api/payments/methods          # Available payment methods
- POST   /api/payments/verify           # Verify payment signature

#### **Events Published:**
- PaymentInitiated
- PaymentCompleted
- PaymentFailed
- RefundProcessed

#### **Events Consumed:**
- TransactionCreated (from Transaction Service)
- RefundRequested (from Transaction Service)

---

### **9. Certificate Service** 📜
**Port:** 3009  
**Database:** certificate_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Generate carbon credit certificates (PDF)
- Digital signature & verification
- Certificate registry
- Certificate download & sharing

#### **Key Features:**
- PDF generation with QR code
- Blockchain verification (optional)
- Certificate templates
- Bulk certificate generation
- Certificate expiration

#### **Database Tables:**
```sql
- certificates (id, transaction_id, buyer_id, credit_amount, cert_hash, issue_date)
- certificate_templates (id, template_name, pdf_template_path)
- certificate_verifications (cert_id, verified_by, verified_at)
- certificate_downloads (cert_id, downloaded_by, downloaded_at)
```

#### **API Endpoints (8 endpoints):**
- POST   /api/certificates/generate     # Generate certificate
- GET    /api/certificates              # List my certificates
- GET    /api/certificates/:id          # Certificate details
- GET    /api/certificates/:id/download # Download PDF
- POST   /api/certificates/:id/verify   # Verify authenticity
- POST   /api/certificates/:id/share    # Share via email
- GET    /api/certificates/public/:hash # Public verification
- POST   /api/certificates/batch        # Batch generate

#### **Events Published:**
- CertificateGenerated
- CertificateVerified
- CertificateDownloaded

#### **Events Consumed:**
- TransactionCompleted (from Transaction Service)

---

### **10. Notification Service** 🔔
**Port:** 3010  
**Database:** notification_service_db (MySQL)  
**Status:** 🔨 To Be Implemented

#### **Responsibilities:**
- Send email notifications
- Send SMS notifications
- Push notifications
- In-app notifications
- Notification preferences

#### **Key Features:**
- Multi-channel delivery (Email, SMS, Push)
- Template management
- Notification scheduling
- Delivery tracking
- User preferences

#### **Database Tables:**
```sql
- notifications (id, user_id, type, channel, message, status, sent_at)
- notification_templates (id, event_type, template_content, channel)
- notification_preferences (user_id, event_type, channels_enabled)
- notification_logs (notification_id, status, error_message, timestamp)
```

#### **API Endpoints (10 endpoints):**
- GET    /api/notifications             # List my notifications
- GET    /api/notifications/unread      # Unread notifications
- PUT    /api/notifications/:id/read    # Mark as read
- DELETE /api/notifications/:id         # Delete notification
- POST   /api/notifications/read-all    # Mark all as read
- GET    /api/notifications/preferences # Get preferences
- PUT    /api/notifications/preferences # Update preferences
- POST   /api/notifications/test        # Send test notification
- GET    /api/notifications/history     # Notification history
- POST   /internal/notifications/send   # Send notification (internal)

#### **Events Published:**
- NotificationSent
- NotificationFailed

#### **Events Consumed:**
- ALL events from all services (notification triggers)

---

### **11. Admin Service** 🛡️(Hoàng)
**Port:** 3000  
**Database:** admin_service_db (MySQL)  
**Status:** ✅ Implemented

#### **Responsibilities:**
- Monitor all services (cached data)
- Manage users (lock, suspend, verify KYC)
- Manage transactions (confirm, cancel, refund, dispute)
- Manage wallets (reverse, adjust balance)
- Manage listings (suspend, activate, flag)
- Override requests (approval workflow)
- Reports & analytics (dashboard, metrics)
- Metric aggregation (daily statistics)

#### **Key Features:**
- Real-time dashboard
- User management (all types)
- Transaction oversight
- Wallet administration
- Listing moderation
- Override approval workflow
- Comprehensive reporting
- Audit logging

#### **Database Tables:**
```sql
- admin_users (id, username, email, password_hash, is_super_admin)
- audit_logs (admin_user_id, action_name, resource_type, resource_id)
- managed_users (cache from User Service)
- managed_transactions (cache from Transaction Service)
- managed_wallet_transactions (cache from Wallet Service)
- managed_listings (cache from Listing Service)
- metric_daily (daily aggregated metrics)
- override_requests (id, request_type, target_id, status, approver_id)
```

#### **API Endpoints (67 endpoints):**
**Auth (10 endpoints):**
- POST   /api/admin/auth/login
- POST   /api/admin/auth/logout
- POST   /api/admin/auth/refresh
- GET    /api/admin/auth/me
- GET    /api/admin/auth/admins
- POST   /api/admin/auth/admins
- GET    /api/admin/auth/admins/:id
- PUT    /api/admin/auth/admins/:id
- POST   /api/admin/auth/admins/:id/lock
- POST   /api/admin/auth/admins/:id/unlock

**Audit Logs (2):**
- GET    /api/admin/audit-logs
- GET    /api/admin/audit-logs/:id

**Users (9):**
- GET    /api/admin/users
- POST   /api/admin/users
- GET    /api/admin/users/:id
- PUT    /api/admin/users/:id
- DELETE /api/admin/users/:id
- POST   /api/admin/users/:id/lock
- POST   /api/admin/users/:id/unlock
- POST   /api/admin/users/:id/suspend
- GET    /api/admin/users/:id/action-history

**Transactions (7):**
- GET    /api/admin/transactions
- GET    /api/admin/transactions/:id
- POST   /api/admin/transactions/:id/confirm
- POST   /api/admin/transactions/:id/cancel
- POST   /api/admin/transactions/:id/refund
- POST   /api/admin/transactions/:id/resolve-dispute
- GET    /api/admin/transactions/:id/action-history

**Wallet Transactions (5):**
- GET    /api/admin/wallet-transactions
- GET    /api/admin/wallet-transactions/:id
- POST   /api/admin/wallet-transactions/:id/reverse
- POST   /api/admin/wallet-transactions/:id/confirm
- POST   /api/admin/wallet-transactions/adjust-balance

**Listings (6):**
- GET    /api/admin/listings
- GET    /api/admin/listings/:id
- POST   /api/admin/listings/:id/suspend
- POST   /api/admin/listings/:id/activate
- POST   /api/admin/listings/:id/flag
- POST   /api/admin/listings/:id/unflag

**Reports (6):**
- GET    /api/admin/reports/dashboard
- GET    /api/admin/reports/transaction-trend
- GET    /api/admin/reports/user-growth
- GET    /api/admin/reports/co2-impact
- GET    /api/admin/reports/revenue
- GET    /api/admin/reports/admin-actions

**Override Requests (5):**
- POST   /api/admin/override-requests
- GET    /api/admin/override-requests
- POST   /api/admin/override-requests/:id/approve
- POST   /api/admin/override-requests/:id/reject
- GET    /api/admin/override-requests/:id

**Health (3):**
- GET    /health
- GET    /health/live
- GET    /health/ready

#### **Events Published:**
- AdminActionPerformed
- OverrideApproved
- OverrideRejected

#### **Events Consumed:**
- ALL events from all services (for monitoring & cache updates) ## 🎯 System Overview

**Project:** Carbon Credit Marketplace for EV Owners  
**Architecture:** Microservices + Event-Driven  
**Total Services:** 11 microservices  

---