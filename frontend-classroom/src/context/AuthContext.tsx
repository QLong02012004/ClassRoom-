/**
 * ============================================================================
 * TÊN FILE: AuthContext.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/context/AuthContext.tsx
 * MỤC ĐÍCH:
 *   Quản lý Trạng thái Xác thực Toàn cục (Global Authentication Context) cho React App.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lưu trữ state thông tin người dùng (`user`), vai trò (`userRole`), tên người dùng (`username`), ảnh đại diện (`userAvatar`).
 *   - Tự động gọi `authService.getMe()` khi khởi chạy trang để khôi phục phiên đăng nhập.
 *   - Lắng nghe sự kiện tùy biến `auth:logout` từ Axios Interceptor để bắt buộc xóa session local khi Refresh Token hết hạn hoàn toàn.
 *   - Cung cấp Custom Hook `useAuth()` cho tất cả các Component trong hệ thống.
 * ============================================================================
 */

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
  userRole: string;
  username: string;
  userAvatar: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userRole = (user?.role || localStorage.getItem("userRole") || "TEACHER").toUpperCase();
  const username = user?.name || localStorage.getItem("username") || "Giáo viên";
  const userAvatar =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=f47c20&color=fff&bold=true`;

  // Hàm xóa session cục bộ (dùng nội bộ, không gọi API)
  const clearSession = useCallback(() => {
    // Chỉ xóa các key liên quan đến xác thực, giữ lại tour_completed_* và các key khác
    localStorage.removeItem('USER_TOKEN');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('user');
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
    <AuthContext.Provider
      value={{
        user,
        userRole,
        username,
        userAvatar,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
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
