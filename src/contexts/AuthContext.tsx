import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AppSession } from '../types/data-master.types';

interface AuthContextType {
  currentUser: AppSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (timId: number) => Promise<AppSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cek sesi aktif saat aplikasi dibuka
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await invoke<AppSession | null>('get_current_user');
        setCurrentUser(session);
      } catch (e) {
        console.error('Gagal memeriksa sesi aktif:', e);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (timId: number): Promise<AppSession> => {
    const session = await invoke<AppSession>('login_user', { timId });
    setCurrentUser(session);
    return session;
  };

  const logout = async () => {
    await invoke('logout_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
};
