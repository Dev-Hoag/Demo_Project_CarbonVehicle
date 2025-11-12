// Common types used across the application

export type UserType = 'EV_OWNER' | 'BUYER' | 'CVA';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type WalletStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

// Form types
export interface FormFieldError {
  type: string;
  message: string;
}

export interface FormErrors {
  [key: string]: FormFieldError;
}

// Date range filter
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Status badge colors
export const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
  SUSPENDED: 'error',
  CLOSED: 'default',
  VERIFIED: 'success',
  REJECTED: 'error',
  SOLD: 'info',
};

export default {};
