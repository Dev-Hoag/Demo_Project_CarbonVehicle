/**
 * CVA Reports API Client
 * API calls for CVA credit issuance reports
 */

import axios from 'axios';

const API_URL = 'http://localhost'; // Use gateway (port 80) for consistent routing

// Create axios instance with auth interceptor
const cvaApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor (matches main apiClient pattern)
cvaApi.interceptors.request.use((config) => {
  // Check for admin token first (for admin routes)
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  }

  // Fallback to regular user auth (Zustand persisted storage)
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const authData = JSON.parse(token);
      if (authData.state?.accessToken) {
        config.headers.Authorization = `Bearer ${authData.state.accessToken}`;
        console.log('[CVA Reports API] Added token to request:', config.url);
      }
    } catch (error) {
      console.error('[CVA Reports API] Failed to parse auth token:', error);
    }
  }
  return config;
});

// ============================================
// Types
// ============================================

export interface CVACreditSummary {
  total_verifications: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  total_co2_saved_kg: number;
  total_credits_issued: number;
  approval_rate: number;
}

export interface MonthlyIssuance {
  year: number;
  month: number;
  month_name: string;
  approved_count: number;
  total_credits: number;
  total_co2_kg: number;
}

export interface VerifierPerformance {
  verifier_id: string;
  verifier_name: string | null;
  total_verifications: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  total_credits_issued: number;
  avg_processing_time_hours: number | null;
}

export interface CVACreditReport {
  summary: CVACreditSummary;
  monthly_issuance: MonthlyIssuance[];
  verifier_performance: VerifierPerformance[];
  generated_at: string;
  report_period: string;
}

// ============================================
// API Functions
// ============================================

export const cvaReportsApi = {
  /**
   * Get CVA credit issuance report
   */
  getCreditIssuanceReport: async (params?: {
    start_date?: string;
    end_date?: string;
    verifier_id?: string;
  }): Promise<CVACreditReport> => {
    const response = await cvaApi.get('/api/v1/reports/cva/credit-issuance', { params });
    return response.data;
  },

  /**
   * Export CVA report to CSV
   */
  exportReportCSV: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    const response = await cvaApi.get('/api/v1/reports/cva/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
