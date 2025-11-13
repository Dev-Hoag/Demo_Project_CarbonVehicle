import apiClient from './client';

// Helper to get admin auth headers
const getAdminHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface KycDocument {
  id: number;
  userId: number;
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  verifiedBy?: number;
  verifiedAt?: string;
  rejectionReason?: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    userType: string;
  };
}

export interface KycDocumentListResponse {
  documents: KycDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserKycStatusResponse {
  userId: number;
  kycStatus: string;
  documents: KycDocument[];
  user?: {
    id: number;
    email: string;
    fullName: string;
    userType: string;
  };
}

export interface KycStatistics {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  totalUsersWithKyc: number;
  usersFullyVerified: number;
}

/**
 * Get all pending KYC documents (for admin review)
 */
export const getPendingDocuments = async (
  page: number = 1,
  limit: number = 10,
): Promise<KycDocumentListResponse> => {
  const response = await apiClient.get('/api/admin/kyc/documents/pending', {
    params: { page, limit },
    headers: getAdminHeaders(),
  });
  return response.data;
};

/**
 * Get all KYC documents with optional status filter
 */
export const getAllDocuments = async (
  page: number = 1,
  limit: number = 10,
  status?: string,
): Promise<KycDocumentListResponse> => {
  const response = await apiClient.get('/api/admin/kyc/documents', {
    params: { page, limit, status },
    headers: getAdminHeaders(),
  });
  return response.data;
};

/**
 * Get KYC documents for a specific user
 */
export const getUserDocuments = async (userId: number): Promise<UserKycStatusResponse> => {
  const response = await apiClient.get(`/api/admin/kyc/users/${userId}/documents`, {
    headers: getAdminHeaders(),
  });
  return response.data;
};

/**
 * Approve a KYC document
 */
export const approveDocument = async (documentId: number): Promise<KycDocument> => {
  const response = await apiClient.post(
    `/api/admin/kyc/documents/${documentId}/approve`,
    {},
    { headers: getAdminHeaders() }
  );
  return response.data;
};

/**
 * Reject a KYC document with reason
 */
export const rejectDocument = async (
  documentId: number,
  rejectionReason: string,
): Promise<KycDocument> => {
  const response = await apiClient.post(
    `/api/admin/kyc/documents/${documentId}/reject`,
    { rejectionReason },
    { headers: getAdminHeaders() }
  );
  return response.data;
};

/**
 * Get KYC statistics
 */
export const getKycStatistics = async (): Promise<KycStatistics> => {
  const response = await apiClient.get('/api/admin/kyc/statistics', {
    headers: getAdminHeaders(),
  });
  return response.data;
};
