export interface CreatePaymentRequest {
  paymentCode: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
  bankCode?: string;
  returnUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

export interface CallbackVerifyResult {
  isValid: boolean;
  paymentCode: string;
  responseCode: string;
  transactionNo?: string;
  amount: number;
  bankCode?: string;
  payDate?: string;
}

export interface IPaymentProvider {
  createPayment(request: CreatePaymentRequest): Promise<PaymentResponse>;
  verifyCallback(params: any): CallbackVerifyResult;
  refund?(refundRequest: any): Promise<any>;
}