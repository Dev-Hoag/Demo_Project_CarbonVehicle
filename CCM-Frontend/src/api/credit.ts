import apiClient from './client';

// ========== Interfaces ==========

export interface CreditAccount {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalTransferredIn: number;
  totalTransferredOut: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddCreditRequest {
  userId: string;
  amount: number;
  source: string;
  description?: string;
}

export interface DeductCreditRequest {
  userId: string;
  amount: number;
  reason: string;
  description?: string;
}

export interface TransferCreditRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  transactionType: 'EARNED_FROM_TRIP' | 'PURCHASED_FROM_MARKETPLACE' | 'SOLD_TO_MARKETPLACE' | 'TRANSFERRED_IN' | 'TRANSFERRED_OUT' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface CreditStatistics {
  totalUsers: number;
  totalCredits: number;
  totalTransactions: number;
  averageBalance: number;
}

// ========== Credit API ==========

export const creditApi = {
  // Create credit account for user
  create: (userId: string) =>
    apiClient.post(`/api/credits?userId=${userId}`),

  // Get credit account by user ID
  getByUserId: (userId: string) =>
    apiClient.get(`/api/credits/user/${userId}`),

  // Add credits to account
  addCredit: (data: AddCreditRequest) =>
    apiClient.post('/api/credits/add', data),

  // Deduct credits from account
  deductCredit: (data: DeductCreditRequest) =>
    apiClient.post('/api/credits/deduct', data),

  // Transfer credits between users
  transfer: (data: TransferCreditRequest) =>
    apiClient.post('/api/credits/transfer', data),

  // Get all credit accounts (admin)
  getAll: (params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get('/api/credits', { params }),

  // Get credit statistics
  getStatistics: () =>
    apiClient.get('/api/credits/statistics'),
};

// ========== Credit Transaction API ==========

export const creditTransactionApi = {
  // Get transaction by ID
  getById: (id: string) =>
    apiClient.get(`/api/credit-transactions/${id}`),

  // Get transactions by user ID
  getByUserId: (userId: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/credit-transactions/user/${userId}`, { params }),

  // Get recent transactions by user
  getRecentByUser: (userId: string, limit: number = 10) =>
    apiClient.get(`/api/credit-transactions/user/${userId}/recent`, {
      params: { limit },
    }),

  // Get recent transactions (all)
  getRecent: (limit: number = 20) =>
    apiClient.get('/api/credit-transactions/recent', {
      params: { limit },
    }),
};
