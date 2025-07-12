
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginData, RegisterData } from '@/types/database';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await refreshUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: response.error || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        toast({
          title: "Account created!",
          description: "Welcome to StackIt! Your account has been created successfully.",
        });
        return true;
      } else {
        toast({
          title: "Registration failed",
          description: response.error || "Failed to create account",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Registration error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
