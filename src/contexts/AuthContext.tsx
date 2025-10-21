"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'user';
  newsletterSubscribed?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  getToken: () => string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount from cookies
    const storedUser = Cookies.get('user');
    const storedToken = Cookies.get('token');
    
    console.log('🔍 AuthContext: Checking cookies on mount', { 
      hasUser: !!storedUser, 
      hasToken: !!storedToken 
    });
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ AuthContext: User restored from cookies', parsedUser.email);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        // Clear invalid cookies
        Cookies.remove('user');
        Cookies.remove('token');
        Cookies.remove('userId');
      }
    } else {
      console.log('⚠️ AuthContext: No valid cookies found');
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    // Store in cookies with 7 day expiration
    Cookies.set('user', JSON.stringify(userData), { expires: 7, sameSite: 'strict' });
    Cookies.set('token', token, { expires: 7, sameSite: 'strict' });
    Cookies.set('userId', userData.id, { expires: 7, sameSite: 'strict' });
    
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Remove cookies
    Cookies.remove('user');
    Cookies.remove('token');
    Cookies.remove('userId');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const getToken = () => {
    return Cookies.get('token');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, isLoading, login, logout, getToken }}>
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
