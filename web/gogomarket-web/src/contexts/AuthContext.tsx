import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';
import cartStorage from '../utils/cartStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      api.setToken(token);
      setUser(JSON.parse(savedUser));
      loadUser();
    } else if (token) {
      api.setToken(token);
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.getProfile() as { success: boolean; data: User };
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      api.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Merge guest cart with server cart after authentication
  const mergeGuestCart = async () => {
    if (cartStorage.hasItems()) {
      try {
        const items = cartStorage.getItemsForMerge();
        console.log('Merging guest cart items:', items);
        await api.post('/cart/merge', { items });
        cartStorage.clear();
        console.log('Guest cart merged and cleared');
      } catch (error) {
        console.error('Failed to merge guest cart:', error);
        // Don't throw - cart merge failure shouldn't block login
      }
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await api.login(phone, password) as { success: boolean; data: { token: string; user: User }; error?: string };
      console.log('Login response:', response);
      if (response.success && response.data?.token) {
        api.setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Login successful, user set:', response.data.user);
        
        // Merge guest cart after successful login
        await mergeGuestCart();
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (phone: string, password: string, role: UserRole) => {
    try {
      const response = await api.register(phone, password, role) as { success: boolean; data: { token: string; user: User }; error?: string };
      console.log('Register response:', response);
      if (response.success && response.data?.token) {
        api.setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Registration successful, user set:', response.data.user);
        
        // Merge guest cart after successful registration
        await mergeGuestCart();
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
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
