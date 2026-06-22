import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../service/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xóa session cục bộ (dùng nội bộ, không gọi API)
  const clearSession = useCallback(() => {
    // Dùng clear() để dọn sạch hoàn toàn mọi key cũ (USER_TOKEN, userRole, username...)
    localStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    // Khôi phục phiên đăng nhập khi load lại trang
    const initializeAuth = async () => {
      const token = localStorage.getItem('USER_TOKEN');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data) {
            setUser(res.data);
          } else {
            // Token hết hạn nhưng còn refresh token → interceptor sẽ tự xử lý
            clearSession();
          }
        } catch (error) {
          // Nếu interceptor đã thử refresh và thất bại sẽ dispatch auth:logout
          console.error('Lỗi xác thực:', error);
          clearSession();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [clearSession]);

  useEffect(() => {
    // Lắng nghe event từ Axios interceptor khi refresh token thất bại
    const handleForceLogout = () => {
      clearSession();
    };

    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [clearSession]);

  const login = (accessToken: string, userData: User) => {
    localStorage.setItem('USER_TOKEN', accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Gọi API logout → server xóa cookie refresh_token
      await authService.logout();
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error);
    } finally {
      // Luôn xóa session local dù API lỗi
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
