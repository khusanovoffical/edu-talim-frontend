import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: {
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
    grade?: number;
    school_id?: number;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('eduai_token');
    const savedUser = localStorage.getItem('eduai_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('eduai_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login(email.trim(), password.trim());
    setUser(res.user);
    setToken(res.access_token);
    return res.user;
  };

  const register = async (userData: {
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
    grade?: number;
    school_id?: number;
  }) => {
    const res = await api.register(userData);
    setUser(res.user);
    setToken(res.access_token);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const fresh = await api.getMe();
      setUser(fresh);
      localStorage.setItem('eduai_user', JSON.stringify(fresh));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
