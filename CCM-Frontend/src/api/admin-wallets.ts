import axios from 'axios';

const API_URL = 'http://localhost';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ============================================
// WALLET MANAGEMENT TYPES
// ============================================

export interface WalletDetail {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  totalTransactions: number;
  totalDeposited: number;
  totalWithdrawn: number;
  lastTransaction?: {
    id: string;
    type: string;
    amount: number;
    createdAt: string;
  };
}

export interface WalletListParams {
  search?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface WalletListResponse {
  items: WalletDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// TRANSACTION MANAGEMENT TYPES
// ============================================

export interface TransactionDetail {
  id: string;
  walletId: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'RESERVE' | 'RELEASE' | 'REFUND' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  metadata?: any;
  createdAt: string;
}

export interface TransactionListParams {
  userId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  items: TransactionDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// API FUNCTIONS
// ============================================

export const adminWalletsApi = {
  // Get all wallets with filters
  getWalletList: async (params?: WalletListParams): Promise<WalletListResponse> => {
    const response = await axios.get(`${API_URL}/api/admin/reports/wallets/list`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  // Get single wallet detail
  getWalletDetail: async (userId: string): Promise<WalletDetail> => {
    const response = await axios.get(`${API_URL}/api/admin/reports/wallets/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get all transactions with filters
  getTransactionList: async (params?: TransactionListParams): Promise<TransactionListResponse> => {
    const response = await axios.get(`${API_URL}/api/admin/reports/transactions/list`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },
};
