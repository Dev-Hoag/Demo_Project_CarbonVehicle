import { userApi } from './axios.config';
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User,
  UserProfile,
  UpdateProfileRequest 
} from '../types/user.types';

/**
 * User Service API Client
 * Handles authentication and user management
 */
export const userServiceApi = {
  // ========== Authentication ==========
  
  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await userApi.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await userApi.post('/auth/register', data);
    return response.data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await userApi.get(`/auth/verify?token=${token}`);
    return response.data;
  },

  /**
   * Forgot password - send reset email
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await userApi.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await userApi.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Get current user info
   */
  me: async (): Promise<User> => {
    const response = await userApi.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await userApi.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // ========== User Profile ==========

  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await userApi.get<UserProfile>('/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await userApi.put<UserProfile>('/users/profile', data);
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: number): Promise<User> => {
    const response = await userApi.get<User>(`/users/${userId}`);
    return response.data;
  },

  // ========== KYC ==========

  /**
   * Get my KYC documents
   */
  getMyKycDocuments: async () => {
    const response = await userApi.get('/kyc/my-documents');
    return response.data;
  },

  /**
   * Submit KYC document
   */
  submitKyc: async (formData: FormData) => {
    const response = await userApi.post('/kyc/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get KYC document by ID
   */
  getKycDocument: async (documentId: number) => {
    const response = await userApi.get(`/kyc/documents/${documentId}`);
    return response.data;
  },
};

export default userServiceApi;
