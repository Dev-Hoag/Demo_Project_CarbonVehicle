
// ==================== src/shared/enums/payment.enums.ts ====================
export enum PaymentGateway {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  BANK = 'BANK',
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

export enum CallbackType {
  RETURN_URL = 'RETURN_URL',
  IPN = 'IPN',
  WEBHOOK = 'WEBHOOK',
}
