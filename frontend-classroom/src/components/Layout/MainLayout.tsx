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
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import TopHeader from "./TopHeader/TopHeader";
import Header from "./Header/Header";
import OnboardingTour from "../common/OnboardingTour/OnboardingTour";

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isExamRoute = location.pathname.startsWith("/exams/");

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] overflow-hidden font-sans">
      {!isExamRoute && <OnboardingTour />}

      {/* Global Sidebar (fixed position) - Ẩn hoàn toàn khi đang thi hoặc trên mobile */}
      {!isExamRoute && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area - offset by 72px for desktop fixed sidebar, 0px on mobile or when taking exams */}
      <div className={`flex flex-col flex-1 ${isExamRoute ? "pl-0" : "pl-0 md:pl-[72px]"} w-full h-screen`}>
        {/* Top Header - Ẩn khi đang thi để trang thi dùng Header chuyên biệt */}
        {!isExamRoute && <TopHeader />}

        {/* Content Wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sub-Sidebar */}
          {!isExamRoute && <Header />}

          {/* Actual Page Content */}
          <main className={`flex-1 overflow-y-auto ${isExamRoute ? "p-0" : "p-4 md:p-8"}`}>
            <div className={`w-full ${isExamRoute ? "max-w-none" : "max-w-7xl mx-auto"} h-full`}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
