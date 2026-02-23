import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

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
  showTimeoutWarning: boolean;
  timeUntilTimeout: number;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => Promise<void>;
  extendSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export class AuthEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => callback(data));
    }
  }
}

export const authEvents = new AuthEventEmitter();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(300);

  useEffect(() => {
    const validateAndRestoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          const response = await api.get('/user/profile');
          if (response.data) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAdmin(storedIsAdmin);
          }
        } catch (error: any) {
          if (error.response?.status === 401 || error.code === 'ERR_NETWORK') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');
            setToken(null);
            setUser(null);
            setIsAdmin(false);
          }
        }
      }
      setIsLoading(false);
    };

    validateAndRestoreSession();

    const handleSessionExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      setToken(null);
      setUser(null);
      setIsAdmin(false);
      setShowTimeoutWarning(false);
    };

    authEvents.on('logout', handleSessionExpired);

    return () => {
      const listeners = (authEvents as any).listeners;
      if (listeners.has('logout')) {
        listeners.get('logout').length = 0;
      }
    };
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

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      setShowTimeoutWarning(false);
    }
  };

  const extendSession = () => {
    setShowTimeoutWarning(false);
    setTimeUntilTimeout(300);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAdmin, 
      isLoading, 
      showTimeoutWarning, 
      timeUntilTimeout,
      login, 
      register, 
      logout,
      extendSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};