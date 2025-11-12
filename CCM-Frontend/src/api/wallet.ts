import apiClient from './client';

export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: number;
  walletId: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface DepositData {
  amount: number;
  paymentMethod: string;
  description?: string;
}

export interface DepositResponse {
  message: string;
  wallet: Wallet;
  amount: number;
  paymentRequestId: string;
  paymentCode: string;
  paymentUrl?: string;
  qrCode?: string;
}

export interface WithdrawalData {
  amount: number;
  bankAccount: string;
  description?: string;
}

export interface TransferData {
  toUserId: number;
  amount: number;
  description?: string;
}

export const walletApi = {
  // Get wallet info (includes balance)
  getBalance: async (): Promise<Wallet> => {
    const response = await apiClient.get('/api/wallets');
    return response.data;
  },

  // Get wallet transactions
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<{
    transactions: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/wallets/transactions', { params });
    return response.data;
  },

  // Get transaction by ID
  getTransactionById: async (transactionId: number): Promise<WalletTransaction> => {
    const response = await apiClient.get(`/api/wallets/transactions/${transactionId}`);
    return response.data;
  },

  // Deposit money into wallet
  deposit: async (data: DepositData): Promise<DepositResponse> => {
    const response = await apiClient.post('/api/wallets/deposit', data);
    return response.data;
  },

  // Withdraw money from wallet
  withdraw: async (data: WithdrawalData): Promise<WalletTransaction> => {
    const response = await apiClient.post('/api/wallets/withdraw', data);
    return response.data;
  },

  // Transfer money to another user
  transfer: async (data: TransferData): Promise<WalletTransaction> => {
    const response = await apiClient.post('/api/wallets/transfer', data);
    return response.data;
  },

  // Get wallet by user ID (admin)
  getWalletByUserId: async (userId: number): Promise<Wallet> => {
    const response = await apiClient.get(`/api/wallets/user/${userId}`);
    return response.data;
  },

  // Get all wallets (admin)
  getAllWallets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    wallets: Wallet[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/wallets', { params });
    return response.data;
  },
};
