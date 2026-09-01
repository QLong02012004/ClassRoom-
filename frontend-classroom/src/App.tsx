/**
 * ============================================================================
 * TÊN FILE: App.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/App.tsx
 * MỤC ĐÍCH:
 *   Root Application Component bao bọc các Provider hệ thống.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lớp 1: `HeroUIProvider` (Thư viện UI HeroUI Component System).
 *   - Lớp 2: `AuthProvider` (Quản lý trạng thái xác thực người dùng).
 *   - Lớp 3: `ToastProvider` (Quản lý thông báo toast notification đẹp mắt).
 *   - Lớp 4: `RouterProvider` (Định tuyến ứng dụng với React Router).
 * ============================================================================
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastProvider } from './components/Styles/ToastContext';
import { AuthProvider } from './context/AuthContext';

import { HeroUIProvider } from "@heroui/system";

function App() {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}

export default App;