import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// API Gateway URL
const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || 'http://localhost:80';

// Create axios instances for each service
export const userApi: AxiosInstance = axios.create({
  baseURL: `${API_GATEWAY}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const paymentApi: AxiosInstance = axios.create({
  baseURL: `${API_GATEWAY}/api/payments`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminApi: AxiosInstance = axios.create({
  baseURL: `${API_GATEWAY}/api/admin`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT Token Management
const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Request interceptor - Add JWT token to headers
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor - Handle token refresh on 401
const responseErrorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config;

  if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
      try {
        // Try to refresh token
        const { data } = await userApi.post('/auth/refresh', {
          refreshToken,
        });

        // Save new tokens
        setTokens(data.accessToken, data.refreshToken);

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers['X-Retry'] = 'true'; // Prevent infinite loop
        
        return axios.request(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    } else {
      // No refresh token - redirect to login
      clearTokens();
      window.location.href = '/login';
    }
  }

  return Promise.reject(error);
};

// Apply interceptors to all API instances
[userApi, paymentApi, adminApi].forEach((api) => {
  api.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
  api.interceptors.response.use(
    (response) => response,
    responseErrorInterceptor
  );
});

// Export token management functions
export const authUtils = {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
};

export default {
  userApi,
  paymentApi,
  adminApi,
  authUtils,
};
