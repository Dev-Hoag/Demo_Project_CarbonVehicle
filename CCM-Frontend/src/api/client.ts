import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Check for admin token first (for admin routes)
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log('[API Client] Added admin token to request:', config.url);
      return config;
    }

    // Fallback to regular user auth (Zustand persisted storage)
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.accessToken) {
          config.headers.Authorization = `Bearer ${authData.state.accessToken}`;
          console.log('[API Client] Added user token to request:', config.url);
        } else {
          console.warn('[API Client] No accessToken found in auth storage');
        }
      } catch (error) {
        console.error('Failed to parse auth token:', error);
      }
    } else {
      console.warn('[API Client] No auth token found (neither admin nor user)');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - JWT expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('[API Client] 401 Unauthorized - Token expired or invalid, logging out...');
      
      // Clear auth storage
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Redirect to login
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
