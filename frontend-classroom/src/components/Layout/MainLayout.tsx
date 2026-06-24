import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./Navbar/Navbar.tsx";
import Header from "./Header/Header.tsx";

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <NavBar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow w-full max-w-7xl mx-auto">
        {/* Thanh tiêu đề/điều hướng con (SubHeader) */}
        <Header />

        <main className="flex-grow p-4 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
