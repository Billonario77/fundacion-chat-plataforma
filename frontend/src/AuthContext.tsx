import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';

// ============================================
// CONFIGURACIÓN DE LA API (CRA)
// ============================================
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
console.log('🌐 API_URL:', API_URL);

// Tipos
interface User {
  id: string;
  email: string;
  nombre: string;
  tipo: 'usuario' | 'guia' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, tipo: 'usuario' | 'guia') => Promise<void>;
  register: (email: string, password: string, nombre: string, tipo: 'usuario' | 'guia') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isGuia: boolean;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  // Configurar axios para incluir el token en todas las peticiones
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = async (email: string, password: string, tipo: 'usuario' | 'guia') => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
        tipo
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nombre: string, tipo: 'usuario' | 'guia') => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/registro`, {
        email,
        password,
        nombre,
        tipo
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isGuia: user?.tipo === 'guia'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
