import { apiClient } from './client';

export interface Verification {
  id: number;
  trip_id: number;
  user_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  carbon_saved_kg: number;
  credit_amount: number;
  verified_by?: number;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avg_carbon_saved: number;
  total_credits_issued: number;
}

export interface CreateVerificationRequest {
  trip_id: number;
  user_id: number;
  carbon_saved_kg: number;
}

export interface ApproveVerificationRequest {
  credit_amount?: number;
  remarks?: string;
}

export interface RejectVerificationRequest {
  rejection_reason: string;
}

class VerificationApi {
  private baseUrl = '/api/v1/verifications';

  // User endpoints
  async getMyVerifications(userId: number): Promise<Verification[]> {
    const response = await apiClient.get(`${this.baseUrl}?user_id=${userId}`);
    return response.data;
  }

  async getVerificationById(id: number): Promise<Verification> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createVerification(data: CreateVerificationRequest): Promise<Verification> {
    const response = await apiClient.post(this.baseUrl, data);
    return response.data;
  }

  // CVA endpoints
  async getAllVerifications(): Promise<{ total: number; items: Verification[] }> {
    const response = await apiClient.get(this.baseUrl);
    // Backend may return {total, items} or just array
    if (response.data.items) {
      return response.data;
    }
    return { total: response.data.length, items: response.data };
  }

  async approveVerification(id: number, data: ApproveVerificationRequest): Promise<Verification> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/approve`, data);
    return response.data;
  }

  async rejectVerification(id: number, data: RejectVerificationRequest): Promise<Verification> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/reject`, data);
    return response.data;
  }

  async getStats(): Promise<VerificationStats> {
    const response = await apiClient.get(`${this.baseUrl}/stats/summary`);
    return response.data;
  }
}

export const verificationApi = new VerificationApi();
