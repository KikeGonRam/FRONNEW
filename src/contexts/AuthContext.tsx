'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';
import { User as UserType } from '@/types';

type User = UserType;

interface AuthContextType {
  user: User | null;
<<<<<<< HEAD
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
=======
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
>>>>>>> 277a6b402bb48c4c6e4933e93c43027c2f4441c1
  logout: () => void;
  isLoading: boolean;
  updateUserData: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const cachedUser = localStorage.getItem('auth_user');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (error) {
          console.error('Error parsing cached user:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

<<<<<<< HEAD
  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
    const result = await AuthService.login(credentials);
    if (result.success && result.user && result.token) {
      setUser(result.user);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      toast.success(`Bienvenido ${result.user.nombre}`);
    } else if (result.error) {
      toast.error(result.error);
=======
  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await AuthService.login(credentials);

      setUser(response.user);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      toast.success(`Bienvenido ${response.user.nombre}`);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);

      const message = error?.response?.data?.message || 'Credenciales incorrectas';
      toast.error(message);

      return { success: false, message };
>>>>>>> 277a6b402bb48c4c6e4933e93c43027c2f4441c1
    }
    return result;
  };

  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.clear();

      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUserData }}>
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
