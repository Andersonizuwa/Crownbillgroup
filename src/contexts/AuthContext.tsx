import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../lib/api';
import { useIdleTimer } from 'react-idle-timer';
import { useToast } from "@/hooks/use-toast";

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
  showTimeoutWarning: boolean;
  timeUntilTimeout: number;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState<number>(300); // 5 minutes warning
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      // On mount, check if we have user data in localStorage to persist session
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

      if (storedToken && storedUser) {
        try {
          // Validate token by making a simple API call
          const response = await api.get('/user/profile', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          if (response.data) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAdmin(storedIsAdmin);
          } else {
            // Token invalid, clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');
          }
        } catch (error) {
          // Token validation failed, clear localStorage
          console.log('Token validation failed, clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isAdmin');
        }
      }
      setIsLoading(false);
      
      // Check for pending deposits with settlement details
      if (storedToken && storedUser) {
        checkForPendingDeposits(storedToken);
      }
    };

    initializeAuth();
  }, []);

  const checkForPendingDeposits = async (authToken: string) => {
    try {
      const response = await api.get('/user/deposits', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Look for deposits with settlement details in awaiting_payment or awaiting_confirmation status
        const pendingDeposits = response.data.filter((deposit: any) => 
          deposit.settlementDetails && 
          (deposit.status === 'awaiting_payment' || deposit.status === 'awaiting_confirmation')
        );
        
        if (pendingDeposits.length > 0) {
          // Show notification for the most recent deposit
          const latestDeposit = pendingDeposits[0];
          
          if (latestDeposit.status === 'awaiting_payment') {
            toast({
              title: "Settlement Details Available",
              description: "Your deposit settlement details are now ready. Please send funds to the provided account.",
              duration: 10000,
            });
          } else if (latestDeposit.status === 'awaiting_confirmation') {
            toast({
              title: "Proof Submission Required",
              description: "Please submit proof of your payment to complete the deposit process.",
              duration: 10000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking for pending deposits:', error);
      // Don't show error to user, just log it
    }
  };

  const login = async (email: string, password: string) => {
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

      // Check for pending deposits with settlement details
      checkForPendingDeposits(token);

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

  const register = async (data: any) => {
    try {
      let payload = data;
      
      // Check if data contains any File objects
      const containsFile = Object.values(data).some(val => val instanceof File);
      
      if (containsFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, String(value));
            }
          }
        });
        payload = formData;
      }

      const response = await api.post('/auth/register', payload, {
        headers: containsFile ? { 'Content-Type': 'multipart/form-data' } : undefined
      });
      
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
      console.error("Registration error:", error);
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
      }
      console.error('Registration failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint to invalidate token
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
    } finally {
      // Clear local state regardless of backend call success
      setUser(null);
      setToken(null);
      setIsAdmin(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      // Navigation will be handled by the component calling logout
    }
  }, [token]);

  // signOut kept for backwards compatibility with existing components
  const signOut = () => logout();

  // Session timeout logic
  const handleOnIdle = () => {
    setShowTimeoutWarning(true);
    setTimeUntilTimeout(300); // 5 minutes countdown
  };

  const handleOnActive = () => {
    setShowTimeoutWarning(false);
    setTimeUntilTimeout(300);
  };

  const extendSession = () => {
    setShowTimeoutWarning(false);
    setTimeUntilTimeout(300);
    // Reset the idle timer
    reset();
  };

  const { reset } = useIdleTimer({
    timeout: 1000 * 60 * 25, // 25 minutes of inactivity
    onIdle: handleOnIdle,
    onActive: handleOnActive,
    debounce: 500
  });

  // Auto logout when countdown reaches 0
  useEffect(() => {
    if (showTimeoutWarning && timeUntilTimeout <= 0) {
      logout();
    }
  }, [showTimeoutWarning, timeUntilTimeout, logout]);

  // Countdown timer when warning is shown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showTimeoutWarning && timeUntilTimeout > 0) {
      interval = setInterval(() => {
        setTimeUntilTimeout(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showTimeoutWarning, timeUntilTimeout]);

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
      signOut,
      extendSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};