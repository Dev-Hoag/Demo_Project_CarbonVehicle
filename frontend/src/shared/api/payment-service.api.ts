import { paymentApi } from './axios.config';
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  PaymentHistoryQuery,
  PaymentHistoryResponse,
} from '../types/payment.types';

/**
 * Payment Service API Client
 * Handles payment operations
 */
export const paymentServiceApi = {
  /**
   * Create new payment
   */
  createPayment: async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await paymentApi.post<CreatePaymentResponse>('/initiate', data);
    return response.data;
  },

  /**
   * Get payment status by payment code
   */
  getPaymentStatus: async (paymentCode: string): Promise<PaymentStatusResponse> => {
    const response = await paymentApi.get<PaymentStatusResponse>(`/${paymentCode}/status`);
    return response.data;
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (query?: PaymentHistoryQuery): Promise<PaymentHistoryResponse> => {
    const response = await paymentApi.get<PaymentHistoryResponse>('/history', {
      params: query,
    });
    return response.data;
  },
};

export default paymentServiceApi;
