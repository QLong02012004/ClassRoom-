import React, { useState } from "react";
import {
  GraduationCap,
  ChalkboardTeacher,
  BookOpen,
  Sparkle,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  Lightning,
  CheckCircle
} from "phosphor-react";

interface GoogleRoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
  onConfirm: (role: "student" | "teacher", subject?: string) => void;
  isLoading?: boolean;
}

const TOP_SUBJECTS = [
  "Toán học",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Tin học",
  "Lịch sử",
  "Địa lý",
  "Khác"
];

export const GoogleRoleSelectModal: React.FC<GoogleRoleSelectModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [selectedSubject, setSelectedSubject] = useState<string>("Toán học");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [imgError, setImgError] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedRole === "teacher") {
      const subject = selectedSubject === "Khác" ? customSubject.trim() : selectedSubject;
      if (selectedSubject === "Khác" && !subject) {
        return;
      }
      onConfirm("teacher", subject);
    } else {
      onConfirm("student");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts[parts.length - 1]?.[0]?.toUpperCase() || parts[0]?.[0]?.toUpperCase() || "U";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(11, 15, 25, 0.78)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      {/* Ambient glowing decoration in the background */}
      <div
        style={{
          position: "fixed",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244, 124, 32, 0.16) 0%, rgba(244, 124, 32, 0) 70%)",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(-100px, -60px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(47, 143, 163, 0.14) 0%, rgba(47, 143, 163, 0) 70%)",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(120px, 90px)",
        }}
      />

      {/* Main Card Container */}
      <div
        className="animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow:
            "0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.9) inset, 0 1px 3px rgba(0,0,0,0.1)",
          position: "relative",
          zIndex: 100000,
        }}
      >
        {/* Close Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer z-20"
          >
            <X size={16} weight="bold" />
          </button>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-full">
          {/* USER CHIP: GOOGLE ACCOUNT CONNECTED (GỌN GÀNG) */}
          <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-orange-50/70 via-slate-50/60 to-blue-50/40 border border-slate-200/80 rounded-xl mb-4 shadow-xs">
            <div className="relative shrink-0">
              {googleUser?.avatar && !imgError ? (
                <img
                  src={googleUser.avatar}
                  alt={googleUser.name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setImgError(true)}
                  className="w-10 h-10 rounded-lg object-cover ring-2 ring-white shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f47c20] to-[#fb923c] text-white font-black flex items-center justify-center text-base ring-2 ring-white shadow-xs">
                  {getInitials(googleUser?.name)}
                </div>
              )}

              {/* Official Google G Badge */}
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs ring-1 ring-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-slate-900 truncate leading-snug">
                {googleUser?.name || "Người dùng Google"}
              </h4>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {googleUser?.email}
              </p>
            </div>
          </div>

          {/* SECTION TITLE (GỌN GÀNG) */}
          <div className="mb-4 text-left">
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug flex items-center gap-1.5">
              <span>Chọn vai trò của bạn</span>
              <Sparkle size={16} weight="fill" className="text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              Bạn đang thiết lập tài khoản lần đầu qua Google. Vui lòng chọn tư cách tham gia:
            </p>
          </div>

          {/* 2 INTERACTIVE ROLE CARDS (CÂN ĐỐI & THOÁNG ĐÃNG) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
            {/* CARD 1: HỌC SINH */}
            <div
              onClick={() => !isLoading && setSelectedRole("student")}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative text-left select-none ${
                selectedRole === "student"
                  ? "border-[#f47c20] bg-gradient-to-b from-orange-50/70 via-orange-50/20 to-white shadow-md shadow-orange-500/10 ring-2 ring-orange-500/15"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedRole === "student"
                      ? "bg-gradient-to-br from-[#f47c20] to-[#fb923c] text-white shadow-xs"
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}
                >
                  <GraduationCap size={22} weight="duotone" />
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    selectedRole === "student"
                      ? "bg-[#f47c20] text-white shadow-xs"
                      : "border-2 border-slate-300 bg-white"
                  }`}
                >
                  {selectedRole === "student" && <Check size={12} weight="bold" />}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm text-slate-900">Học sinh</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <Lightning size={10} weight="fill" className="text-emerald-600" />
                    Vào ngay
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2.5">
                  Tham gia lớp học bằng mã, làm bài tập, thi trắc nghiệm và xem bảng điểm.
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} weight="fill" className="text-emerald-500 shrink-0" />
                    <span>Tham gia lớp bằng mã code</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} weight="fill" className="text-emerald-500 shrink-0" />
                    <span>Làm bài online & nộp tự luận</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: GIÁO VIÊN */}
            <div
              onClick={() => !isLoading && setSelectedRole("teacher")}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative text-left select-none ${
                selectedRole === "teacher"
                  ? "border-[#f47c20] bg-gradient-to-b from-orange-50/70 via-orange-50/20 to-white shadow-md shadow-orange-500/10 ring-2 ring-orange-500/15"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedRole === "teacher"
                      ? "bg-gradient-to-br from-[#f47c20] to-[#fb923c] text-white shadow-xs"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  <ChalkboardTeacher size={22} weight="duotone" />
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    selectedRole === "teacher"
                      ? "bg-[#f47c20] text-white shadow-xs"
                      : "border-2 border-slate-300 bg-white"
                  }`}
                >
                  {selectedRole === "teacher" && <Check size={12} weight="bold" />}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm text-slate-900">Giáo viên</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90">
                    <ShieldCheck size={10} weight="fill" className="text-amber-600" />
                    Chờ duyệt
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2.5">
                  Tạo lớp học, xây dựng đề thi, giao bài tập và quản lý sổ điểm học sinh.
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} weight="fill" className="text-[#f47c20] shrink-0" />
                    <span>Khởi tạo & quản lý lớp học</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} weight="fill" className="text-[#f47c20] shrink-0" />
                    <span>Tạo đề trắc nghiệm & chấm bài</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TEACHER SUBJECT PICKER PANEL (GỌN GÀNG - KHÔNG BỊ TRÀN CHIỀU CAO) */}
          {selectedRole === "teacher" && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white border border-amber-200/80 rounded-xl mb-4 text-left animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#f47c20]" weight="bold" />
                  <span>Môn học phụ trách chính của bạn:</span>
                </label>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                  BGH phê duyệt sau
                </span>
              </div>

              {/* Subject pill quick-select */}
              <div className="flex flex-wrap gap-1.5">
                {TOP_SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      selectedSubject === sub
                        ? "bg-[#f47c20] text-white border-[#f47c20] shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {selectedSubject === "Khác" && (
                <input
                  type="text"
                  placeholder="Nhập tên môn học phụ trách của bạn..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="mt-2 w-full h-9 px-3 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#f47c20] focus:ring-1 focus:ring-[#f47c20] shadow-2xs"
                />
              )}
            </div>
          )}

          {/* ACTION BUTTONS (GỌN GÀNG & KHÔNG BỊ CẮT XÉN) */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || (selectedRole === "teacher" && selectedSubject === "Khác" && !customSubject.trim())}
              className="flex-1 h-11 px-6 rounded-xl bg-gradient-to-r from-[#f47c20] via-[#fb923c] to-[#f47c20] bg-[length:200%_auto] hover:bg-right text-white text-xs font-black tracking-wide shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang thiết lập tài khoản...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận & Tiếp tục</span>
                  <ArrowRight size={14} weight="bold" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleRoleSelectModal;
