import apiClient from './client';

export interface Payment {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED';
  paymentMethod: string;
  transactionId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentData {
  amount: number;
  currency?: string;
  paymentMethod: string;
  description?: string;
}

export interface PaymentHistory {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export const paymentApi = {
  // Initiate a new payment
  initiatePayment: async (data: InitiatePaymentData): Promise<Payment> => {
    const response = await apiClient.post('/api/payments/initiate', data);
    return response.data;
  },

  // Get payment status by ID
  getPaymentStatus: async (paymentId: number): Promise<Payment> => {
    const response = await apiClient.get(`/api/payments/${paymentId}/status`);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaymentHistory> => {
    const response = await apiClient.get('/api/payments/history', { params });
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (paymentId: number): Promise<Payment> => {
    const response = await apiClient.get(`/api/payments/${paymentId}`);
    return response.data;
  },

  // Confirm payment (admin)
  confirmPayment: async (paymentId: number): Promise<Payment> => {
    const response = await apiClient.post(`/api/payments/${paymentId}/confirm`);
    return response.data;
  },

  // Cancel payment
  cancelPayment: async (paymentId: number): Promise<Payment> => {
    const response = await apiClient.post(`/api/payments/${paymentId}/cancel`);
    return response.data;
  },

  // Get all payments (admin)
  getAllPayments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: number;
  }): Promise<PaymentHistory> => {
    const response = await apiClient.get('/api/payments', { params });
    return response.data;
  },
};
