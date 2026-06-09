'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, User } from '../types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthTokenPayload {
  exp: number;
  role: Role;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    let nextToken: string | null = null;
    let nextUser: User | null = null;
    let shouldRedirect = false;

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode<AuthTokenPayload>(storedToken);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime || decoded.role !== Role.ADMIN) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          shouldRedirect = true;
        } else {
          nextToken = storedToken;
          nextUser = JSON.parse(storedUser) as User;
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        shouldRedirect = true;
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (shouldRedirect) {
        router.replace('/login');
      } else {
        setToken(nextToken);
        setUser(nextUser);
      }
      setIsLoading(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    router.push('/'); // Redirect to dashboard
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
