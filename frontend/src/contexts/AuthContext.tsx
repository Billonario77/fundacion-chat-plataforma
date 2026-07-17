import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';

// Tipos
interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'usuario' | 'guia' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, nombre: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isGuia: boolean;
  isAdmin: boolean;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar axios para incluir el token en todas las peticiones
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Cargar perfil del usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        console.log('Token encontrado:', storedToken.substring(0, 20) + '...');
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        const response = await axios.get('https://fundacion-chat-plataforma-backend-api.onrender.com/api/auth/perfil');
        
        console.log('Respuesta del perfil:', response.data);
        
        setUser(response.data.user);
        setToken(storedToken);
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await axios.post('https://fundacion-chat-plataforma-backend-api.onrender.com/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nombre: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await axios.post('https://fundacion-chat-plataforma-backend-api.onrender.com/api/auth/registro', {
        email,
        password,
        nombre
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      
      return user;
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
    isGuia: user?.rol === 'guia',
    isAdmin: user?.rol === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
