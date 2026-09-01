/**
 * ============================================================================
 * TÊN FILE: MainLayout.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/components/Layout/MainLayout.tsx
 * MỤC ĐÍCH:
 *   Khung bố cục chính (Global Main Layout Wrapper) cho toàn bộ ứng dụng Frontend.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Ghép nối các thành phần cố định: Thanh điều hướng `Sidebar`, Thanh tiêu đề `TopHeader`, Sub-sidebar `Header` và Hướng dẫn tương tác `OnboardingTour`.
 *   - Hiển thị trang con nội dung thông qua `Outlet` của React Router v6.
 * ============================================================================
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import TopHeader from "./TopHeader/TopHeader";
import Header from "./Header/Header";
import OnboardingTour from "../common/OnboardingTour/OnboardingTour";

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#f1f5f9] overflow-hidden font-sans">
      <OnboardingTour />

      {/* Global Sidebar (fixed position) */}
      <Sidebar />

      {/* Main Content Area - offset by 72px for the fixed sidebar */}
      <div className="flex flex-col flex-1 pl-[72px] w-full h-screen">
        {/* Top Header */}
        <TopHeader />

        {/* Content Wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sub-Sidebar (for class details, etc.) */}
          <Header />

          {/* Actual Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="w-full max-w-7xl mx-auto h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
