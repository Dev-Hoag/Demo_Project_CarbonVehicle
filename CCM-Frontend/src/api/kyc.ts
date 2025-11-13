import apiClient from './client';

export type DocumentType = 
  | 'ID_CARD' 
  | 'PASSPORT' 
  | 'DRIVER_LICENSE' 
  | 'VEHICLE_REGISTRATION' 
  | 'BUSINESS_LICENSE';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocument {
  id: number;
  userId: number;
  documentType: DocumentType;
  documentNumber?: string;
  fileUrl: string;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface KycStatus {
  userId: number;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  documents: KycDocument[];
}

export interface UploadDocumentParams {
  file: File;
  documentType: DocumentType;
  documentNumber?: string;
}

export const kycApi = {
  /**
   * Upload a new KYC document
   */
  uploadDocument: async (params: UploadDocumentParams): Promise<KycDocument> => {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('documentType', params.documentType);
    if (params.documentNumber) {
      formData.append('documentNumber', params.documentNumber);
    }

    const response = await apiClient.post('/api/kyc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all my KYC documents
   */
  getMyDocuments: async (): Promise<KycDocument[]> => {
    const response = await apiClient.get('/api/kyc/documents');
    return response.data;
  },

  /**
   * Get my KYC verification status
   */
  getKycStatus: async (): Promise<KycStatus> => {
    const response = await apiClient.get('/api/kyc/status');
    return response.data;
  },

  /**
   * Delete a KYC document (only if status is PENDING)
   */
  deleteDocument: async (docId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/kyc/documents/${docId}`);
    return response.data;
  },
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ID_CARD: 'ID Card',
  PASSPORT: 'Passport',
  DRIVER_LICENSE: 'Driver License',
  VEHICLE_REGISTRATION: 'Vehicle Registration',
  BUSINESS_LICENSE: 'Business License',
};

export const DOCUMENT_TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  ID_CARD: 'National identification card (CCCD/CMND)',
  PASSPORT: 'International passport',
  DRIVER_LICENSE: 'Driver\'s license',
  VEHICLE_REGISTRATION: 'Vehicle registration certificate (for EV owners)',
  BUSINESS_LICENSE: 'Business registration certificate (for companies)',
};
