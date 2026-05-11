'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { User, Role } from '@/types';
import { apiClient, setTokens, clearTokens, loadRefreshToken } from '@/lib/api-client';
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRefreshToken();
    apiClient
      .get<User>('/users/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
    );
    setTokens(tokens);
    const me = await apiClient.get<User>('/users/me');
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      await apiClient.post('/auth/logout', { refreshToken: rt }).catch(() => {});
    }
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const isRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
