import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  userType: 'EV_OWNER' | 'BUYER' | 'CVA';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    userType: string;
    status: string;
  };
}

export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await apiClient.get(`/api/auth/verify?token=${token}`);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/api/auth/reset-password', { token, password });
    return response.data;
  },
};
