import apiClient from './client';

// ========== Interfaces ==========

export const NotificationType = {
  TRIP_VERIFIED: 'TRIP_VERIFIED',
  LISTING_CREATED: 'LISTING_CREATED',
  LISTING_SOLD: 'LISTING_SOLD',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  CREDIT_ISSUED: 'CREDIT_ISSUED',
  WITHDRAWAL_APPROVED: 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',
  USER_REGISTERED: 'USER_REGISTERED',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const;
export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  READ: 'READ',
} as const;
export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];

export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: number;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceToken {
  id: number;
  userId: string;
  token: string;
  deviceType: string;
  deviceName?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface RegisterDeviceDto {
  userId: string;
  token: string;
  deviceType: 'IOS' | 'ANDROID' | 'WEB';
  deviceName?: string;
}

export interface UpdatePreferencesDto {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
}

// ========== Notification API ==========

export const notificationApi = {
  // Get all notifications for current user (paginated)
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/api/notifications', { params }),

  // Get unread count
  getUnreadCount: () =>
    apiClient.get('/api/notifications/unread-count'),

  // Mark notification as read
  markAsRead: (notificationId: number) =>
    apiClient.put(`/api/notifications/${notificationId}/read`),

  // Mark all as read
  markAllAsRead: () =>
    apiClient.put('/api/notifications/mark-all-read'),

  // Delete notification
  delete: (notificationId: number) =>
    apiClient.delete(`/api/notifications/${notificationId}`),

  // Get notification preferences
  getPreferences: () =>
    apiClient.get('/api/notifications/preferences'),

  // Update preferences
  updatePreferences: (data: UpdatePreferencesDto) =>
    apiClient.put('/api/notifications/preferences', data),

  // Register device for push notifications
  registerDevice: (data: RegisterDeviceDto) =>
    apiClient.post('/api/notifications/register-device', data),

  // Get notification history
  getHistory: (days?: number) =>
    apiClient.get('/api/notifications/history', { params: { days } }),
};