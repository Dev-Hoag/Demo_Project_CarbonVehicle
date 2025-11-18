import apiClient from './client';

// ========== Override Request Interfaces ==========

export interface OverrideRequest {
  id: number;
  type: 'TRANSACTION_REVERSAL' | 'BALANCE_ADJUSTMENT' | 'USER_UNLOCK' | 'EMERGENCY_ACCESS' | 'OTHER';
  description: string;
  requesterId: string;
  requesterName: string;
  targetUserId?: string;
  targetUserEmail?: string;
  amount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
  justification: string;
  approvedBy?: string;
  approverName?: string;
  approvalComment?: string;
  rejectionComment?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface CreateOverrideRequestData {
  type: 'TRANSACTION_REVERSAL' | 'BALANCE_ADJUSTMENT' | 'USER_UNLOCK' | 'EMERGENCY_ACCESS' | 'OTHER';
  description: string;
  targetUserId?: string;
  amount?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
  justification: string;
}

export interface ApproveOverrideData {
  comment?: string;
}

export interface RejectOverrideData {
  comment: string;
}

// ========== Override Request Admin API ==========

export const adminOverrideApi = {
  // Create new override request
  create: (data: CreateOverrideRequestData) =>
    apiClient.post('/api/admin/override-requests', data),

  // Get all override requests with filters
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
  }) =>
    apiClient.get('/api/admin/override-requests', { params }),

  // Get override request by ID
  getById: (id: number) =>
    apiClient.get(`/api/admin/override-requests/${id}`),

  // Approve override request
  approve: (id: number, data: ApproveOverrideData) =>
    apiClient.post(`/api/admin/override-requests/${id}/approve`, data),

  // Reject override request
  reject: (id: number, data: RejectOverrideData) =>
    apiClient.post(`/api/admin/override-requests/${id}/reject`, data),

  // Get pending override requests
  getPending: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/api/admin/override-requests', { 
      params: { ...params, status: 'PENDING' } 
    }),

  // Get urgent override requests
  getUrgent: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/api/admin/override-requests', { 
      params: { ...params, priority: 'URGENT' } 
    }),
};