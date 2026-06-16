import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { getCurrentUser, login as authLogin, logout as authLogout, register as authRegister, updateUser as authUpdateUser } from '@/services/auth';
import type { AuthCredentials, AuthResult, RegisterData } from '@/services/auth';

interface AuthContextValue {
  user: User | null;
  login: (credentials: AuthCredentials) => AuthResult;
  register: (data: RegisterData) => AuthResult;
  logout: () => void;
  updateUser: (updates: Partial<User>) => User | null;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'jobconnect_auth') {
        setUser(getCurrentUser());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (credentials: AuthCredentials) => {
    const result = authLogin(credentials);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const register = (data: RegisterData) => {
    const result = authRegister(data);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    const updated = authUpdateUser(updates);
    if (updated) {
      setUser(updated);
    }
    return updated;
  };

  const refreshUser = useCallback(() => {
    const current = getCurrentUser();
    setUser((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(current)) {
        return prev;
      }
      return current;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
