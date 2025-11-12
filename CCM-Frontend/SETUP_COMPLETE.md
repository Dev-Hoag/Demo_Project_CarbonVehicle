# CCM Frontend Setup Summary

## ✅ Completed Setup

### 1. Project Structure Created
```
src/
├── api/              # API clients (auth, user, payment, wallet, admin, mock)
├── components/       # Reusable UI components
├── layouts/          # MainLayout & AuthLayout
├── pages/            # Login, Register, Dashboard, Wallet
├── store/            # Zustand auth store
├── types/            # TypeScript definitions
├── utils/            # Utility functions
├── hooks/            # Custom hooks
└── theme/            # Material-UI theme
```

### 2. Dependencies Installed
- ✅ Material-UI v7 (@mui/material, @mui/icons-material)
- ✅ Emotion (styling for MUI)
- ✅ React Query (@tanstack/react-query)
- ✅ Axios
- ✅ React Router v7
- ✅ React Hook Form + Zod
- ✅ Zustand
- ✅ React Hot Toast
- ✅ Date-fns

### 3. API Services Implemented

#### Real Backend APIs (via Gateway localhost:80)
- **auth.ts** - Login, register, refresh token, verify email
- **user.ts** - Profile management, user CRUD
- **payment.ts** - Payment initiation, status, history
- **wallet.ts** - Balance, transactions, deposit, withdraw, transfer
- **admin.ts** - Admin dashboard, user/payment/wallet management

#### Mock APIs
- **mock.ts** - Carbon credits, listings, transactions (simulated data)

### 4. Core Features Implemented
- ✅ Authentication flow (login/register)
- ✅ JWT token management with auto-refresh
- ✅ Protected routes
- ✅ Responsive sidebar navigation
- ✅ Dashboard with stats
- ✅ Wallet management page
- ✅ Form validation with Zod
- ✅ Toast notifications
- ✅ Custom Material-UI theme (green eco-friendly)

### 5. Configuration
- ✅ Vite proxy to gateway (localhost:80)
- ✅ Path aliases (@/*)
- ✅ Environment variables (.env)
- ✅ TypeScript strict mode
- ✅ ESLint configuration

## 🚀 How to Use

### Start Development Server
```powershell
cd c:\Study\BuildAppOOP\CreditCarbonMarket\CCM-Frontend
npm run dev
```
Access at: **http://localhost:5173/**

### Build for Production
```powershell
npm run build
npm run preview
```

## 🔗 API Endpoints Integration

### Backend Services (Real)
- Gateway: `http://localhost:80`
- Routes configured in `vite.config.ts` proxy

### Authentication
1. Register: POST `/api/auth/register`
2. Login: POST `/api/auth/login`
3. Get user: GET `/api/auth/me`
4. Refresh: POST `/api/auth/refresh`

### Wallet Operations
1. Get balance: GET `/api/wallets/balance`
2. Get transactions: GET `/api/wallets/transactions`
3. Deposit: POST `/api/wallets/deposit`
4. Withdraw: POST `/api/wallets/withdraw`
5. Transfer: POST `/api/wallets/transfer`

### Payment Operations
1. Initiate: POST `/api/payments/initiate`
2. Get status: GET `/api/payments/:id/status`
3. Get history: GET `/api/payments/history`

## 📱 Pages Implemented

| Route | Component | Status | Description |
|-------|-----------|--------|-------------|
| `/login` | LoginPage | ✅ Complete | User authentication |
| `/register` | RegisterPage | ✅ Complete | User registration |
| `/dashboard` | DashboardPage | ✅ Complete | Overview dashboard |
| `/wallet` | WalletPage | ✅ Complete | Wallet management |
| `/payments` | - | 🔄 Coming Soon | Payment history |
| `/listings` | - | 🔄 Coming Soon | Carbon credit listings |
| `/transactions` | - | 🔄 Coming Soon | Transaction history |
| `/profile` | - | 🔄 Coming Soon | User profile |
| `/admin` | - | 🔄 Coming Soon | Admin dashboard |

## 🎨 Theme Configuration

Custom theme in `src/theme/index.ts`:
- **Primary Color**: #2E7D32 (Green - eco-friendly)
- **Secondary Color**: #1976D2 (Blue - professional)
- Custom button/card styling
- Responsive design

## 🔐 Auth Store (Zustand)

State management for authentication:
```typescript
{
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login(), logout(), register()
  setTokens(), refreshAccessToken()
}
```

Persisted to localStorage as `auth-storage`.

## 🚦 Current Status

**Dev Server**: ✅ Running on http://localhost:5173/  
**Backend Gateway**: ⚠️ Should be running on port 80  
**Database Services**: ⚠️ Should be running (Admin, User, Payment, Wallet)

## 🔧 Next Steps

1. **Test Full Flow**:
   - Register new user
   - Verify email (or skip if email verification disabled)
   - Login
   - View dashboard
   - Check wallet

2. **Create Additional Pages**:
   - Payment initiation page
   - Profile management
   - Admin dashboard (for CVA users)

3. **Add Mock Data Pages**:
   - Listings page (using mockListingApi)
   - Transactions page (using mockTransactionApi)

4. **Enhanced Features**:
   - Real-time notifications
   - File upload for profile picture
   - Advanced filtering/searching
   - Data visualization with charts

## 📝 Important Notes

- **Mock services enabled**: Set `VITE_ENABLE_MOCK_SERVICES=true` in `.env`
- **Token refresh**: Automatically handled by axios interceptor
- **Protected routes**: Redirect to `/login` if not authenticated
- **CORS**: Make sure backend gateway allows CORS from localhost:5173

## 🐛 Troubleshooting

### Frontend won't start
```powershell
# Reinstall dependencies
npm install
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### API calls fail
1. Check gateway is running: `http://localhost:80/api/health`
2. Check CORS headers
3. Inspect browser console for errors
4. Verify token in localStorage

### Authentication issues
1. Clear localStorage: `localStorage.clear()`
2. Register new user
3. Check email verification status

---

**Created**: 2025-11-12  
**Status**: ✅ Frontend fully functional with core features  
**Next**: Add remaining pages and integrate with all backend services
