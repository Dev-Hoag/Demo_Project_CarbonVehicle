// Payment Types
export enum PaymentGateway {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  TEST = 'TEST',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export interface Payment {
  id: number;
  paymentCode: string;
  transactionId: string;
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  orderInfo: string;
  bankCode?: string;
  gatewayTransactionId?: string;
  gatewayResponseCode?: string;
  completedAt?: string;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  transactionId: string;
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  orderInfo?: string;
  bankCode?: string;
  returnUrl?: string;
}

export interface CreatePaymentResponse {
  paymentCode: string;
  paymentUrl: string;
  status: PaymentStatus;
  amount: number;
  transactionId: string;
  expiredAt: string;
}

export interface PaymentStatusResponse {
  paymentCode: string;
  status: PaymentStatus;
  amount: number;
  gateway: PaymentGateway;
  completedAt?: string;
  expiredAt: string;
}

export interface PaymentHistoryQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  gateway?: PaymentGateway;
  fromDate?: string;
  toDate?: string;
}

export interface PaymentHistoryResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
