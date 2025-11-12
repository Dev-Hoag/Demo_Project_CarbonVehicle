import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type AuthResponse } from '../api/auth';
import type { UserProfile } from '../api/user';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response: AuthResponse = await authApi.login({ email, password });
          
          set({
            user: response.user as any, // User data from login may be partial
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        try {
          set({ isLoading: true });
          await authApi.register(data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: UserProfile | null) => {
        set({ user });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refreshToken(refreshToken);
          set({ accessToken: response.accessToken });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          const { accessToken } = get();
          if (!accessToken) {
            set({ isAuthenticated: false });
            return;
          }

          set({ isLoading: true });
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isAuthenticated: false, isLoading: false });
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper to get current auth token (used by axios interceptor)
export const getAuthToken = () => {
  return useAuthStore.getState().accessToken;
};

// Helper to get refresh token
export const getRefreshToken = () => {
  return useAuthStore.getState().refreshToken;
};

// Helper to update tokens
export const updateTokens = (accessToken: string, refreshToken: string) => {
  useAuthStore.getState().setTokens(accessToken, refreshToken);
};

// Helper to logout
export const logoutUser = () => {
  useAuthStore.getState().logout();
};
