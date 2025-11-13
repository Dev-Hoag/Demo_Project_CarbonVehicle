export enum TransactionStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  CREDIT_TRANSFERRED = 'CREDIT_TRANSFERRED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum CreditStatus {
  PENDING = 'PENDING',
  TRANSFERRED = 'TRANSFERRED',
  FAILED = 'FAILED'
}

export enum WalletStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED'
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Transaction {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  credit_amount: number;
  price_per_credit: number;
  total_price: number;
  currency: string;
  status: TransactionStatus;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

export interface TransactionPayment {
  id: number;
  transaction_id: number;
  payment_id: number;
  payment_method?: string;
  payment_status: PaymentStatus;
  amount: number;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionCredit {
  id: number;
  transaction_id: number;
  credit_transfer_id: number;
  credit_status: CreditStatus;
  transferred_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionWallet {
  id: number;
  transaction_id: number;
  buyer_wallet_reserve_id: number;
  seller_settlement_id: number;
  wallet_status: WalletStatus;
  reserved_at?: Date;
  settled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionEscrow {
  id: number;
  transaction_id: number;
  amount_held: number;
  held_at: Date;
  released_at?: Date;
  release_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionDispute {
  id: number;
  transaction_id: number;
  raised_by: number;
  reason: string;
  description?: string;
  status: DisputeStatus;
  resolution?: string;
  resolved_by?: number;
  created_at: Date;
  resolved_at?: Date;
  updated_at: Date;
}

export interface TransactionSettlement {
  id: number;
  transaction_id: number;
  seller_amount: number;
  platform_fee: number;
  buyer_refund: number;
  settlement_status: SettlementStatus;
  settled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionHistory {
  id: number;
  transaction_id: number;
  old_status?: string;
  new_status: string;
  changed_by?: number;
  reason?: string;
  changed_at: Date;
}

// DTOs
export interface CreateTransactionDTO {
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  credit_amount: number;
  price_per_credit: number;
  total_price: number;
  currency?: string;
}

export interface UpdateTransactionStatusDTO {
  status: TransactionStatus;
  reason?: string;
  changed_by?: number;
}

export interface CreateDisputeDTO {
  transaction_id: number;
  raised_by: number;
  reason: string;
  description?: string;
}

export interface ResolveDisputeDTO {
  dispute_id: number;
  resolution: string;
  resolved_by: number;
}

export interface TransactionSummaryDTO {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  credit_amount: number;
  total_price: number;
  status: TransactionStatus;
  payment_status?: PaymentStatus;
  credit_status?: CreditStatus;
  wallet_status?: WalletStatus;
  escrow_amount?: number;
  seller_amount?: number;
  platform_fee?: number;
  created_at: Date;
  updated_at: Date;
}

