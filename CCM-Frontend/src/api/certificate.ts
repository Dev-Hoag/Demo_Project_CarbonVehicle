import { apiClient } from './client';

// Convert UUID to hashed int using SHA-256 (matching backend logic)
async function uuidToHashedInt(uuid: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(uuid);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashInt = BigInt('0x' + hashHex);
  return Number(hashInt % BigInt(100000000)); // 8-digit positive int
}

export interface Certificate {
  id: number;
  verification_id: number;
  trip_id: number;
  user_id: number;
  credit_amount: number;
  cert_hash: string;
  issue_date: string;
  pdf_url?: string;
  template_id?: number;
  status: 'valid' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
}

export interface CertificateTemplate {
  id: number;
  template_name: string;
  pdf_template_path: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateCertificateRequest {
  verification_id: number;
  trip_id: number;
  user_id: number;
  credit_amount: number;
  template_id?: number;
}

export interface VerifyCertificateResponse {
  valid: boolean;
  certificate?: Certificate;
  message: string;
}

class CertificateApi {
  private baseUrl = '/api/certificates';

  // Get user's certificates
  async getMyCertificates(userId: string | number): Promise<Certificate[]> {
    // Convert UUID to hashed int if string provided (matches backend SHA-256 conversion)
    const numericUserId = typeof userId === 'string' 
      ? await uuidToHashedInt(userId) 
      : userId;
    const response = await apiClient.get(`${this.baseUrl}?user_id=${numericUserId}`);
    return response.data.items || [];
  }

  // Get certificate by ID
  async getCertificateById(id: number): Promise<Certificate> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Generate certificate (admin/system)
  async createCertificate(data: CreateCertificateRequest): Promise<Certificate> {
    const response = await apiClient.post(`${this.baseUrl}/generate`, data);
    return response.data;
  }

  // Download PDF certificate
  async downloadCertificate(id: number): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Verify certificate by hash
  async verifyCertificate(certHash: string): Promise<VerifyCertificateResponse> {
    const response = await apiClient.get(`${this.baseUrl}/verify/${certHash}`);
    return response.data;
  }

  // Get available templates
  async getTemplates(): Promise<CertificateTemplate[]> {
    const response = await apiClient.get(`${this.baseUrl}/templates`);
    return response.data;
  }

  // Helper: Download and save certificate
  async downloadAndSave(id: number, filename?: string): Promise<void> {
    const blob = await this.downloadCertificate(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `certificate_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const certificateApi = new CertificateApi();
