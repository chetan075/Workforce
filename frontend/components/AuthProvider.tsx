"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, login as loginApi, register as registerApi, logout as logoutApi } from '../lib/api';

type User = { id: string; email: string; name?: string; role?: string } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, name?: string, role?: 'CLIENT' | 'FREELANCER') => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user from backend (httpOnly cookie)
    const load = async () => {
      try {
        const data = await fetchMe();
        setUser(data ?? null);
      } catch (e) {
            setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  async function login(email: string, password: string) {
    try {
      const data = await loginApi(email, password);
      setUser(data ?? null);
      return data;
    } catch {
      return null;
    }
  }

  async function register(email: string, password: string, name?: string, role?: 'CLIENT' | 'FREELANCER') {
    console.log('🔧 AuthProvider - register called with:', { email, name, role, roleType: typeof role });
    try {
      const data = await registerApi(email, password, name, role);
      setUser(data ?? null);
      return data;
    } catch {
      return null;
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
