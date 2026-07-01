import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./Navbar/Navbar.tsx";
import Header from "./Header/Header.tsx";

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <NavBar />

      {/* Main Container */}
      <div className="flex flex-row flex-grow w-full">
        {/* Sidebar - Flush Left */}
        <Header />

        {/* Content Area */}
        <div className="flex-grow w-full flex flex-col">
          <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col">
            <main className="flex-grow p-4 md:p-6 w-full">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
