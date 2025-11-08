# Shared Code Infrastructure

## 📁 Structure

```
src/shared/
├── api/                    # API clients
│   ├── axios.config.ts    # Axios setup with interceptors
│   ├── user-service.api.ts
│   └── payment-service.api.ts
├── components/            # Reusable components
│   ├── PrivateRoute.tsx   # Protected route wrapper
│   └── MainLayout.tsx     # Main app layout
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── types/                 # TypeScript types
│   ├── user.types.ts
│   └── payment.types.ts
└── utils/                 # Utility functions
    ├── formatters.ts      # Format helpers
    └── constants.ts       # App constants
```

## 🔌 API Clients

### Axios Configuration
- **JWT Auto-attach**: Automatically adds Bearer token to requests
- **Token Refresh**: Auto-refreshes expired tokens
- **Error Handling**: Global error interceptor

### Available APIs
```typescript
import { userApi, paymentApi, adminApi } from '@/shared/api/axios.config';
import userServiceApi from '@/shared/api/user-service.api';
import paymentServiceApi from '@/shared/api/payment-service.api';
```

## 🔐 Authentication

### AuthContext Usage
```tsx
import { useAuth } from '@/shared/contexts/AuthContext';

function Component() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // Login
  await login({ email, password });
  
  // Check auth
  if (isAuthenticated) {
    // User is logged in
  }
  
  // Logout
  logout();
}
```

### Protected Routes
```tsx
import PrivateRoute from '@/shared/components/PrivateRoute';

<PrivateRoute>
  <DashboardPage />
</PrivateRoute>
```

## 🎨 Components

### MainLayout
```tsx
import MainLayout from '@/shared/components/MainLayout';

<MainLayout title="My App">
  <YourContent />
</MainLayout>
```

## 🛠️ Utilities

### Formatters
```typescript
import { formatCurrency, formatDate, getStatusColor } from '@/shared/utils/formatters';

formatCurrency(100000); // "100.000 ₫"
formatDate(new Date()); // "07/11/2025 14:30"
getStatusColor('completed'); // 'success'
```

### Constants
```typescript
import { PAYMENT_STATUS_LABELS, MIN_PAYMENT_AMOUNT } from '@/shared/utils/constants';

PAYMENT_STATUS_LABELS.COMPLETED; // "Hoàn thành"
MIN_PAYMENT_AMOUNT; // 10000
```

## 🔧 Environment Variables

Create `.env.development`:
```bash
VITE_API_GATEWAY=http://localhost:80
VITE_APP_NAME=Carbon Credit Marketplace
```

## 📦 Dependencies

- `axios` - HTTP client
- `@tanstack/react-query` - Data fetching
- `@mui/material` - UI components
- `react-router-dom` - Routing
- `react-hook-form` - Form handling
- `zod` - Schema validation

## ✅ Setup Complete

All shared infrastructure is ready! You can now:
1. ✅ Build user pages (Login, Register, Profile)
2. ✅ Build payment pages (Create Payment, History)
3. ✅ Build admin pages (User Management, Transactions)
