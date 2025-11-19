import axios from 'axios';

const API_URL = 'http://localhost';

// Create axios instance with admin auth interceptor
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add admin token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  console.log('[admin-reports.ts] Interceptor - Token:', token ? 'exists' : 'missing');
  console.log('[admin-reports.ts] Request URL:', config.url);
  if (token) {
    // Decode token to check payload and expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[admin-reports.ts] Token payload:', payload);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.error('[admin-reports.ts] Token expired! Please login again.');
        // Clear expired token
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        // Redirect to login
        window.location.href = '/admin/login';
        return Promise.reject(new Error('Token expired'));
      }
    } catch (e) {
      console.error('[admin-reports.ts] Failed to decode token:', e);
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FinancialReport {
  [x: string]: string | number | Date;
  totalBalance: number;
  totalLockedBalance: number;
  totalAvailableBalance: number;
  totalWallets: number;
  activeWallets: number;
  
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalReserves: number;
  totalReleases: number;
  
  depositAmount: number;
  withdrawalAmount: number;
  reserveAmount: number;
  releaseAmount: number;
  
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  completedWithdrawals: number;
  completedWithdrawalAmount: number;
}

export interface TransactionReport {
  date: string;
  totalTransactions: number;
  deposits: number;
  withdrawals: number;
  reserves: number;
  releases: number;
  refunds: number;
  depositAmount: number;
  withdrawalAmount: number;
  reserveAmount: number;
  releaseAmount: number;
  refundAmount: number;
}

export interface WalletReport {
  totalWallets: number;
  activeWallets: number;
  suspendedWallets: number;
  closedWallets: number;
  totalBalance: number;
  totalLockedBalance: number;
  averageBalance: number;
  topWallets: Array<{
    userId: string;
    balance: number;
    lockedBalance: number;
    transactionCount: number;
  }>;
}

export interface TransactionReportParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
}

export interface WalletReportParams {
  status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  limit?: number;
}

export const adminReportsApi = {
  // Get financial overview report (from Wallet Service, not Admin Service!)
  getFinancialReport: async (): Promise<FinancialReport> => {
    const response = await adminApi.get('/api/admin/reports/financial');
    return response.data;
  },

  // Get transaction report by time period (from Wallet Service)
  getTransactionReport: async (params?: TransactionReportParams): Promise<TransactionReport[]> => {
    const response = await adminApi.get('/api/admin/reports/transactions', { params });
    return response.data;
  },

  // Get wallet report (from Wallet Service)
  getWalletReport: async (params?: WalletReportParams): Promise<WalletReport> => {
    const response = await adminApi.get('/api/admin/reports/wallets', { params });
    return response.data;
  },
};
