// Admin API Service - Comprehensive Admin Backend Integration
import axios from 'axios';

// ✅ Call through API Gateway (port 80), NOT directly to service (port 3000)
const ADMIN_API_BASE = 'http://localhost'; // API Gateway

// Axios instance with admin auth
const adminApi = axios.create({
  baseURL: ADMIN_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add admin token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH ====================

export interface AdminLoginDto {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: number;
    username: string;
    email: string;
    role: string;
    fullName?: string;
  };
}

export const adminAuth = {
  login: async (credentials: AdminLoginDto): Promise<AdminAuthResponse> => {
    const { data } = await adminApi.post('/api/admin/auth/login', credentials);
    return data;
  },

  getMe: async () => {
    const { data } = await adminApi.get('/api/admin/auth/me');
    return data;
  },

  logout: async () => {
    const { data } = await adminApi.post('/api/admin/auth/logout');
    return data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await adminApi.post('/api/admin/auth/refresh', { refreshToken });
    return data;
  },

  // Admin account management
  getAllAdmins: async (page = 1, limit = 10) => {
    const { data } = await adminApi.get('/api/admin/auth/admins', { params: { page, limit } });
    return data;
  },

  getAdminById: async (id: number) => {
    const { data } = await adminApi.get(`/api/admin/auth/admins/${id}`);
    return data;
  },

  createAdmin: async (adminDto: { username: string; password: string; email: string; role: string; fullName?: string }) => {
    const { data } = await adminApi.post('/api/admin/auth/admins', adminDto);
    return data;
  },

  updateAdmin: async (id: number, adminDto: { email?: string; role?: string; fullName?: string }) => {
    const { data } = await adminApi.put(`/api/admin/auth/admins/${id}`, adminDto);
    return data;
  },

  lockAdmin: async (id: number, reason: string) => {
    const { data } = await adminApi.post(`/api/admin/auth/admins/${id}/lock`, { reason });
    return data;
  },

  unlockAdmin: async (id: number) => {
    const { data } = await adminApi.post(`/api/admin/auth/admins/${id}/unlock`);
    return data;
  },
};

// ==================== USER MANAGEMENT ====================

export interface UserFilters {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DELETED';
  userType?: 'EV_OWNER' | 'BUYER' | 'CVA'; // ✅ Fixed: Match backend enum
  search?: string;
  includeDeleted?: boolean;
}

export const userManagement = {
  getAllUsers: async (filters: UserFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/users', { params: filters });
    return data;
  },

  getUserById: async (id: number) => {
    const { data } = await adminApi.get(`/api/admin/users/${id}`);
    return data;
  },

  createUser: async (userDto: any) => {
    const { data } = await adminApi.post('/api/admin/users', userDto);
    return data;
  },

  updateUser: async (id: number, userDto: any) => {
    const { data } = await adminApi.put(`/api/admin/users/${id}`, userDto);
    return data;
  },

  lockUser: async (id: number, reason: string) => {
    const { data } = await adminApi.post(`/api/admin/users/${id}/lock`, { reason });
    return data;
  },

  unlockUser: async (id: number) => {
    const { data } = await adminApi.post(`/api/admin/users/${id}/unlock`);
    return data;
  },

  suspendUser: async (id: number, reason: string) => {
    const { data } = await adminApi.post(`/api/admin/users/${id}/suspend`, { reason });
    return data;
  },

  unsuspendUser: async (id: number) => {
    const { data } = await adminApi.post(`/api/admin/users/${id}/unsuspend`);
    return data;
  },

  deleteUser: async (id: number, reason: string) => {
    const { data } = await adminApi.delete(`/api/admin/users/${id}`, { data: { reason } });
    return data;
  },

  getUserActionHistory: async (id: number, page = 1, limit = 10) => {
    const { data } = await adminApi.get(`/api/admin/users/${id}/action-history`, { params: { page, limit } });
    return data;
  },
};

// ==================== KYC MANAGEMENT ====================

export interface KycFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const kycManagement = {
  getPendingDocuments: async (page = 1, limit = 10) => {
    const { data } = await adminApi.get('/api/admin/kyc/documents/pending', { params: { page, limit } });
    return data;
  },

  getAllDocuments: async (filters: KycFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/kyc/documents', { params: filters });
    return data;
  },

  getUserDocuments: async (userId: number) => {
    const { data } = await adminApi.get(`/api/admin/kyc/users/${userId}/documents`);
    return data;
  },

  getUserKycStatus: async (userId: number) => {
    const { data } = await adminApi.get(`/api/admin/kyc/users/${userId}/status`);
    return data;
  },

  approveDocument: async (docId: number, notes?: string) => {
    const { data } = await adminApi.post(`/api/admin/kyc/documents/${docId}/approve`, { notes });
    return data;
  },

  rejectDocument: async (docId: number, reason: string, notes?: string) => {
    const { data } = await adminApi.post(`/api/admin/kyc/documents/${docId}/reject`, { reason, notes });
    return data;
  },

  requestMoreInfo: async (docId: number, message: string) => {
    const { data } = await adminApi.post(`/api/admin/kyc/documents/${docId}/request-info`, { message });
    return data;
  },

  getStatistics: async () => {
    const { data } = await adminApi.get('/api/admin/kyc/statistics');
    return data;
  },
};

// ==================== WALLET MANAGEMENT ====================

export interface WalletFilters {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const walletManagement = {
  getAllTransactions: async (filters: WalletFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/wallet-transactions', { params: filters });
    return data;
  },

  getTransactionById: async (id: number) => {
    const { data } = await adminApi.get(`/api/admin/wallet-transactions/${id}`);
    return data;
  },

  reverseTransaction: async (id: string | number, reason: string) => {
    const { data } = await adminApi.post(`/api/admin/wallet-transactions/${id}/reverse`, { reason });
    return data;
  },

  confirmTransaction: async (id: string | number, reason: string) => {
    const { data } = await adminApi.post(`/api/admin/wallet-transactions/${id}/confirm`, { reason });
    return data;
  },

  adjustBalance: async (userId: string, amount: number, reason: string) => {
    const { data } = await adminApi.post('/api/admin/wallet-transactions/adjust-balance', { userId, amount, reason });
    return data;
  },

  getUserWalletDetail: async (userId: string | number) => {
    const { data } = await adminApi.get(`/api/admin/reports/wallets/${userId}`);
    return data;
  },

  getAllWallets: async (filters: WalletFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/reports/wallets/list', { params: filters });
    return data;
  },
};

// ==================== WITHDRAWAL MANAGEMENT ====================

export interface WithdrawalFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
}

export const withdrawalManagement = {
  // Get all pending withdrawals
  getPendingWithdrawals: async () => {
    const { data } = await adminApi.get('/api/admin/withdrawals/pending');
    return data;
  },

  // Get all withdrawals with optional status filter
  getAllWithdrawals: async (status?: string) => {
    const params = status ? { status } : {};
    const { data } = await adminApi.get('/api/admin/withdrawals', { params });
    return data;
  },

  // Get withdrawal by ID
  getWithdrawalById: async (withdrawalId: string) => {
    const { data } = await adminApi.get(`/api/admin/withdrawals/${withdrawalId}`);
    return data;
  },

  // Approve withdrawal request
  approveWithdrawal: async (withdrawalId: string, adminNote?: string) => {
    const { data } = await adminApi.post(`/api/admin/withdrawals/${withdrawalId}/approve`, { adminNote });
    return data;
  },

  // Reject withdrawal request
  rejectWithdrawal: async (withdrawalId: string, reason: string) => {
    const { data } = await adminApi.post(`/api/admin/withdrawals/${withdrawalId}/reject`, { reason });
    return data;
  },

  // Complete withdrawal request
  completeWithdrawal: async (withdrawalId: string, transactionHash?: string) => {
    const { data } = await adminApi.post(`/api/admin/withdrawals/${withdrawalId}/complete`, { transactionHash });
    return data;
  },

  // Get withdrawal statistics
  getStatistics: async () => {
    const { data } = await adminApi.get('/api/admin/withdrawals/statistics');
    return data;
  },
};

// ==================== TRANSACTION MANAGEMENT ====================

export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: string;
  transactionType?: string;
  sellerId?: string;
  buyerId?: string;
  fromDate?: string;
  toDate?: string;
}

export const transactionManagement = {
  getAllTransactions: async (filters: TransactionFilters = {}) => {
    // Separate page/limit from other filters to match backend controller signature
    const { page = 1, limit = 10, ...otherFilters } = filters;
    const { data } = await adminApi.get('/api/admin/transactions', { 
      params: { 
        page, 
        limit, 
        ...otherFilters 
      } 
    });
    return data;
  },

  getTransactionById: async (id: number) => {
    const { data } = await adminApi.get(`/api/admin/transactions/${id}`);
    return data;
  },

  confirmTransaction: async (id: number, notes?: string) => {
    const { data } = await adminApi.post(`/api/admin/transactions/${id}/confirm`, { notes });
    return data;
  },

  cancelTransaction: async (id: number, reason: string, notes?: string) => {
    const { data } = await adminApi.post(`/api/admin/transactions/${id}/cancel`, { reason, notes });
    return data;
  },

  refundTransaction: async (id: number, amount: number, reason: string, notes?: string) => {
    const { data } = await adminApi.post(`/api/admin/transactions/${id}/refund`, { amount, reason, notes });
    return data;
  },

  resolveDispute: async (id: number, resolution: string, notes?: string) => {
    const { data } = await adminApi.post(`/api/admin/transactions/${id}/resolve-dispute`, { resolution, notes });
    return data;
  },

  getTransactionActionHistory: async (id: number, page = 1, limit = 10) => {
    const { data } = await adminApi.get(`/api/admin/transactions/${id}/action-history`, { params: { page, limit } });
    return data;
  },
};

// ==================== REPORTS ====================

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
}

export const reports = {
  getDashboardSummary: async () => {
    const { data } = await adminApi.get('/api/admin/reports/dashboard');
    return data;
  },

  getTransactionTrend: async (filters: ReportFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/reports/transaction-trend', { params: filters });
    return data;
  },

  getUserGrowth: async (filters: ReportFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/reports/user-growth', { params: filters });
    return data;
  },

  getCo2Impact: async (filters: ReportFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/reports/co2-impact', { params: filters });
    return data;
  },

  getRevenue: async (filters: ReportFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/reports/revenue', { params: filters });
    return data;
  },

  getAdminActions: async (filters: ReportFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/reports/admin-actions', { params: filters });
    return data;
  },
};

// ==================== AUDIT LOGS ====================

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  adminId?: number;
  resourceType?: string;
}

export const auditLogs = {
  getAll: async (filters: AuditLogFilters = {}) => {
    const { data } = await adminApi.get('/api/admin/audit-logs', { params: filters });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await adminApi.get(`/api/admin/audit-logs/${id}`);
    return data;
  },
};

// Export default object
const adminService = {
  auth: adminAuth,
  users: userManagement,
  kyc: kycManagement,
  wallets: walletManagement,
  withdrawals: withdrawalManagement,
  transactions: transactionManagement,
  reports,
  auditLogs,
};

export default adminService;
