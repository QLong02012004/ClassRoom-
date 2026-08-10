import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../service/settings.service';
import MaintenancePage from '../../pages/MaintenancePage';
import { io } from 'socket.io-client';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
