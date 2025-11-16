import apiClient from './client';

// ========== Interfaces ==========

export interface Trip {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  co2Reduced: number;
  status: 'PENDING' | 'CALCULATED' | 'SUBMITTED_FOR_VERIFICATION' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'COMPLETED';
  verificationStatus: string; // 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED'
  createdAt: string;
  updatedAt: string;
}

export interface TripUploadRequest {
  userId: string;
  vehicleId: string;
  file: File;
  format: 'CSV' | 'JSON';
}

export interface TripSummary {
  totalTrips: number;
  totalDistance: number;
  totalCO2Emissions: number;
  averageSpeed: number;
  verifiedTrips: number;
  pendingTrips: number;
}

// ========== Trip API ==========

export const tripApi = {
  // Upload trip data from CSV/JSON
  upload: (data: FormData) =>
    apiClient.post('/api/trips/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get all trips for user (paginated)
  getByUser: (userId: string, params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get('/api/trips', { params: { userId, ...params } }),

  // Get trip by ID
  getById: (tripId: string) =>
    apiClient.get(`/api/trips/${tripId}`),

  // Get trip status
  getStatus: (tripId: string) =>
    apiClient.get(`/api/trips/${tripId}/status`),

  // Calculate CO2 emissions for trip
  calculate: (tripId: string) =>
    apiClient.post(`/api/trips/${tripId}/calculate`),

  // Submit trip for verification
  submitVerification: (tripId: string) =>
    apiClient.post(`/api/trips/${tripId}/submit-verification`),

  // Delete trip
  delete: (tripId: string) =>
    apiClient.delete(`/api/trips/${tripId}`),

  // Get trip summary for user
  getSummary: (userId: string, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/api/trips/summary', { params: { userId, ...params } }),

  // Mark trip as complete
  complete: (tripId: string) =>
    apiClient.put(`/api/trips/${tripId}/complete`),
};
