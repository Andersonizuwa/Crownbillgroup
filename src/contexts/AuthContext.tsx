import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

// Define types based on your backend response
interface User {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // On mount, check if we have user data in localStorage to persist session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAdmin(storedIsAdmin);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ isAdmin: boolean }> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user, isAdmin } = response.data;

      // Update State
      setToken(token);
      setUser(user);
      setIsAdmin(isAdmin);

      // Persist to LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAdmin', String(isAdmin));

      return { isAdmin };
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
      }
      console.error('Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, full_name: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, full_name });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const { token, user } = response.data;
      if (!token || !user) throw new Error('Invalid response from server: missing token or user');

      // Update State
      setToken(token);
      setUser(user);
      setIsAdmin(false); // Default to false on register

      // Persist to LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAdmin', 'false');
    } catch (error: any) {
      let errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
      }
      // Log for developers, but throw a clean message for the UI
      console.error('Registration failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};