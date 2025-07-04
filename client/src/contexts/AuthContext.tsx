import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axiosInstance, { setAuthHeader } from '../api/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';


interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null; // <-- ADD THIS LINE
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('accessToken');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();
 

  const login = (user: User, token: string) => {
    setUser(user);
    setAccessToken(token);
    sessionStorage.setItem('accessToken', token);
    setAuthHeader(token);
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      sessionStorage.removeItem('accessToken');
      setAuthHeader(null);
      queryClient.clear();
     
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await axiosInstance.post(
        '/auth/refresh-token',
        {},
        { withCredentials: true }
      );
      const { accessToken, user } = response.data;
      setAccessToken(accessToken);
      setUser(user);
      sessionStorage.setItem('accessToken', accessToken);
      setAuthHeader(accessToken);
    } catch (error) {
      console.error('Refresh token failed:', error);
      setUser(null);
      setAccessToken(null);
      sessionStorage.removeItem('accessToken');
      setAuthHeader(null);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const token = sessionStorage.getItem('accessToken');

      if (token) {
        setAuthHeader(token);
        try {
          const response = await axiosInstance.get('/auth/me');
          setUser(response.data);
        } catch (error: any) {
          console.warn('auth/me failed with stored token, attempting refresh...', error);
          await refreshAccessToken();
        } finally {
          setIsLoading(false);
        }
      } else {
        const hasRefreshToken = document.cookie.includes('refreshToken=');
        if (hasRefreshToken) {
          console.log('No access token, but refresh token present. Attempting refresh...');
          await refreshAccessToken();
        } else {
          setIsLoading(false);
        }
      }
    };
    initializeAuth();
  }, []);


  useEffect(() => {
    setAuthHeader(accessToken);
  }, [accessToken]);


  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, isLoading, accessToken }} // <-- ADD accessToken HERE
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};