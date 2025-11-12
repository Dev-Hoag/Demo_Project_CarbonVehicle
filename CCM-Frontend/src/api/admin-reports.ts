import axios from 'axios';

const API_URL = 'http://localhost';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

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
}

export interface WalletReportParams {
  status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  limit?: number;
}

export const adminReportsApi = {
  // Get financial overview report
  getFinancialReport: async (): Promise<FinancialReport> => {
    const response = await axios.get(`${API_URL}/api/admin/reports/financial`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get transaction report by time period
  getTransactionReport: async (params?: TransactionReportParams): Promise<TransactionReport[]> => {
    const response = await axios.get(`${API_URL}/api/admin/reports/transactions`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  // Get wallet report
  getWalletReport: async (params?: WalletReportParams): Promise<WalletReport> => {
    const response = await axios.get(`${API_URL}/api/admin/reports/wallets`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },
};
