import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userServiceApi } from '../api/user-service.api';
import { authUtils } from '../api/axios.config';
import type { User, LoginRequest } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = authUtils.getAccessToken();
      if (token) {
        try {
          const userData = await userServiceApi.me();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          authUtils.clearTokens();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await userServiceApi.login(credentials);
    authUtils.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const logout = () => {
    authUtils.clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
