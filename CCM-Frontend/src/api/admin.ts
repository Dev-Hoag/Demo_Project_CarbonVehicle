import apiClient from './client';
import type { UserProfile } from './user';
import type { Payment } from './payment';
import type { Wallet } from './wallet';

export interface AdminStats {
  totalUsers: number;
  totalPayments: number;
  totalWallets: number;
  totalRevenue: number;
  activeUsers: number;
  pendingPayments: number;
}

export interface SystemLog {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  service: string;
  timestamp: string;
}

export const adminApi = {
  // Get dashboard statistics
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/api/admin/stats');
    return response.data;
  },

  // User management
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    userType?: string;
    status?: string;
    search?: string;
  }): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId: number): Promise<UserProfile> => {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: number, status: string): Promise<UserProfile> => {
    const response = await apiClient.patch(`/api/admin/users/${userId}/status`, { status });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Payment management
  getAllPayments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: number;
  }): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/admin/payments', { params });
    return response.data;
  },

  approvePayment: async (paymentId: number): Promise<Payment> => {
    const response = await apiClient.post(`/api/admin/payments/${paymentId}/approve`);
    return response.data;
  },

  rejectPayment: async (paymentId: number, reason: string): Promise<Payment> => {
    const response = await apiClient.post(`/api/admin/payments/${paymentId}/reject`, { reason });
    return response.data;
  },

  // Wallet management
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
    const response = await apiClient.get('/api/admin/wallets', { params });
    return response.data;
  },

  suspendWallet: async (walletId: number, reason: string): Promise<Wallet> => {
    const response = await apiClient.post(`/api/admin/wallets/${walletId}/suspend`, { reason });
    return response.data;
  },

  activateWallet: async (walletId: number): Promise<Wallet> => {
    const response = await apiClient.post(`/api/admin/wallets/${walletId}/activate`);
    return response.data;
  },

  // System logs
  getSystemLogs: async (params?: {
    page?: number;
    limit?: number;
    level?: string;
    service?: string;
  }): Promise<{
    logs: SystemLog[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/admin/logs', { params });
    return response.data;
  },
};
