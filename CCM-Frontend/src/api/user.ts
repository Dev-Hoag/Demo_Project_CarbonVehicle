import apiClient from './client';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  userType: 'EV_OWNER' | 'BUYER' | 'CVA';
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
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.patch('/api/users/profile', data);
    return response.data;
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
