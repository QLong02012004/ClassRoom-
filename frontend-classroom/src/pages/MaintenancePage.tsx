/**
 * ============================================================================
 * TÊN FILE: MaintenancePage.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/MaintenancePage.tsx
 * MỤC ĐÍCH:
 *   Giao diện Chế độ Bảo trì Hệ thống (System Maintenance Screen).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Hiển thị khi Admin bật cờ `maintenanceMode: true` trong cài đặt hệ thống.
 *   - Khóa quyền truy cập của Học sinh và Giáo viên, hiển thị nút "Kiểm tra lại" và nút "Đăng xuất".
 * ============================================================================
 */

import React from 'react';
import { Wrench, ShieldWarning, ArrowClockwise, SignOut } from 'phosphor-react';
import { useAuth } from '@/context/AuthContext';

export default function MaintenancePage() {
  const { logout } = useAuth();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#f47c20]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center relative z-10 flex flex-col items-center">
        
        {/* Animated Maintenance Icon Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#f47c20] to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 animate-pulse">
            <Wrench size={48} weight="duotone" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-xl border border-slate-700 text-amber-400 shadow-md">
            <ShieldWarning size={20} weight="fill" />
          </div>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          Bảo trì hệ thống
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Hệ thống đang bảo trì!
        </h1>

        <p className="text-slate-300 text-sm leading-relaxed mb-8 font-medium">
          Ban Quản trị đang tiến hành nâng cấp và bảo trì hệ thống định kỳ. Vui lòng quay lại sau ít phút hoặc liên hệ Quản trị viên nếu cần trợ giúp.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-[#f47c20] hover:bg-[#e06d15] text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border-none"
          >
            <ArrowClockwise size={18} weight="bold" />
            Kiểm tra lại
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-600/80 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <SignOut size={18} weight="bold" />
            Đăng xuất
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-6 font-mono">
          Classroom Manager System &bull; Maintenance Mode
        </p>
      </div>
    </div>
  );
}
