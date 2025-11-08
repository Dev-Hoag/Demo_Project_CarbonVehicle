/**
 * App Constants
 */

// Payment
export const PAYMENT_TIMEOUT_MINUTES = 15;
export const MIN_PAYMENT_AMOUNT = 10000; // 10,000 VND
export const MAX_PAYMENT_AMOUNT = 500000000; // 500,000,000 VND

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ALLOWED_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Date Format
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// Status Labels
export const USER_STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  PENDING: 'Chờ xác nhận',
  SUSPENDED: 'Bị đình chỉ',
  DELETED: 'Đã xóa',
} as const;

export const KYC_STATUS_LABELS = {
  NOT_SUBMITTED: 'Chưa nộp',
  PENDING: 'Đang xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
  EXPIRED: 'Hết hạn',
} as const;

export const PAYMENT_GATEWAY_LABELS = {
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  TEST: 'Test Gateway',
} as const;

export const DOCUMENT_TYPE_LABELS = {
  ID_CARD: 'CMND/CCCD',
  PASSPORT: 'Hộ chiếu',
  DRIVER_LICENSE: 'Bằng lái xe',
  VEHICLE_REGISTRATION: 'Đăng ký xe',
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
} as const;

// API Endpoints (for direct access if needed)
export const API_ENDPOINTS = {
  USER: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/users/profile',
  },
  PAYMENT: {
    INITIATE: '/initiate',
    STATUS: (code: string) => `/${code}/status`,
    HISTORY: '/history',
  },
  KYC: {
    SUBMIT: '/kyc/submit',
    MY_DOCUMENTS: '/kyc/my-documents',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  UNAUTHORIZED: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập.',
  NOT_FOUND: 'Không tìm thấy tài nguyên.',
  SERVER_ERROR: 'Lỗi server. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
} as const;
