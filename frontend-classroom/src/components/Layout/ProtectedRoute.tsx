/**
 * ============================================================================
 * TÊN FILE: ProtectedRoute.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/components/Layout/ProtectedRoute.tsx
 * MỤC ĐÍCH:
 *   Bảo vệ các tuyến đường Client (Client-Side Route Guard) dựa trên trạng thái đăng nhập và vai trò người dùng.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `ProtectedRoute`: Bắt buộc phải có token hợp lệ mới được truy cập, tự động chuyển sang `MaintenancePage` nếu hệ thống bật Chế độ bảo trì.
 *   - `AdminRoute`: Chỉ cho phép người dùng có `role === 'admin'` truy cập.
 *   - `TeacherOrAdminRoute`: Cho phép người dùng có `role === 'admin'` hoặc `'teacher'` truy cập.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../service/settings.service';
import MaintenancePage from '../../pages/MaintenancePage';
import { io } from 'socket.io-client';
import FullPageLoader from '../ui/Loaders/FullPageLoader';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.data) {
          setIsMaintenance(Boolean(res.data.maintenanceMode));
        }
      } catch (error) {
        console.error("Lỗi kiểm tra bảo trì:", error);
      }
    };

    checkMaintenance();

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('settings_update', () => {
      checkMaintenance();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (isLoading) {
    return (
      <FullPageLoader
        text="Đang kết nối hệ thống..."
        subtext="Đang xác thực thông tin tài khoản"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isMaintenance && user?.role !== 'admin') {
    return <MaintenancePage />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <FullPageLoader
        text="Đang kết nối hệ thống..."
        subtext="Đang xác thực thông tin tài khoản"
      />
    );
  }

  if (user?.role !== 'admin') {
    if (user?.role === 'teacher') return <Navigate to="/classrooms" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const TeacherOrAdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <FullPageLoader
        text="Đang kết nối hệ thống..."
        subtext="Đang xác thực thông tin tài khoản"
      />
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
