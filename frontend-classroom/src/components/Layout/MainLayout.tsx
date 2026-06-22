import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./Navbar/Navbar.tsx";
import Header from "./Header/Header.tsx";

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar nằm bên trái */}
      <NavBar />
      
      {/* Vùng nội dung chính nằm bên phải, có khoảng đệm 260px cho Sidebar trên Desktop và 64px cho Header trên Mobile */}
      <div className="flex-grow flex flex-col md:pl-[260px] pt-[64px] md:pt-0 min-h-screen">
        {/* Thanh tiêu đề/điều hướng trên Desktop */}
        <Header />
        
        <main className="flex-grow p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
