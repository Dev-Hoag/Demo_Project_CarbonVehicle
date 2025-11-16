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
  getAll: (userId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get('/api/notifications', {
      params: { userId, ...params },
    }),

  // Get unread count (requires userId)
  getUnreadCount: (userId: string) =>
    apiClient.get('/api/notifications/unread', {
      params: { userId },
    }),

  // Mark notification as read
  markAsRead: (notificationId: number, userId: string) =>
    apiClient.put(`/api/notifications/${notificationId}/read`, null, {
      params: { userId },
    }),

  // Mark all as read (POST /api/notifications/read-all)
  markAllAsRead: (userId: string) =>
    apiClient.post('/api/notifications/read-all', { userId }),

  // Delete notification
  delete: (notificationId: number, userId: string) =>
    apiClient.delete(`/api/notifications/${notificationId}`, {
      params: { userId },
    }),

  // Get notification preferences
  getPreferences: (userId: string) =>
    apiClient.get('/api/notifications/preferences', {
      params: { userId },
    }),

  // Update preferences
  updatePreferences: (userId: string, data: UpdatePreferencesDto) =>
    apiClient.put('/api/notifications/preferences', data, {
      params: { userId },
    }),

  // Get notification history
  getHistory: (userId: string, days?: number) =>
    apiClient.get('/api/notifications/history', {
      params: { userId, days },
    }),

  // Register device for push notifications
  registerDevice: (data: RegisterDeviceDto) =>
    apiClient.post('/api/notifications/register-device', data),
};