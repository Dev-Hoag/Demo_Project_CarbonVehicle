import apiClient from './client';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string; // Backend uses 'phone' not 'phoneNumber'
  phoneNumber?: string; // Keep for backward compatibility
  userType: 'EV_OWNER' | 'BUYER' | 'CVA';
  role?: string; // JWT role field from Verification Service
  status: string;
  isEmailVerified: boolean;
  kycStatus?: string;
  profilePictureUrl?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  bio?: string;
  // EV Owner fields
  vehicleType?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  // Buyer fields
  companyName?: string;
  taxCode?: string;
  // CVA fields
  certificationNumber?: string;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
  passwordChangedAt?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  bio?: string;
  // EV Owner fields
  vehicleType?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  // Buyer fields
  companyName?: string;
  taxCode?: string;
  // CVA fields
  certificationNumber?: string;
  organizationName?: string;
}

export const userApi = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/users/profile');
    const data = response.data;
    // Map backend 'phone' to frontend 'phoneNumber' for consistency
    return {
      ...data,
      phoneNumber: data.phone || data.phoneNumber,
    };
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    // Map frontend 'phoneNumber' to backend 'phone'
    const payload = {
      ...data,
      phone: data.phoneNumber || data.phone,
    };
    const response = await apiClient.put('/api/users/profile', payload);
    const responseData = response.data;
    // Map backend 'phone' to frontend 'phoneNumber'
    return {
      ...responseData,
      phoneNumber: responseData.phone || responseData.phoneNumber,
    };
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ profilePictureUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user by ID (admin only)
  getUserById: async (id: number): Promise<UserProfile> => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },

  // List all users (admin only)
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    userType?: string;
    status?: string;
  }): Promise<{ data: UserProfile[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get('/api/users', { params });
    return response.data;
  },
};
