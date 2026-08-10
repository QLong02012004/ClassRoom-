import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { notificationService, type INotificationItem } from "../../../service/notification.service";
import { io } from "socket.io-client";
import { gradebookService } from "../../../service/gradebook.service";
import {
  Bell,
  Globe,
  User,
  CaretDown,
  SignOut,
  Chalkboard,
  ClipboardText,
  Users,
  CheckSquare,
  ChartBar
} from "phosphor-react";
import styles from "./TopHeader.module.scss";

const TopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role || "student";

  // Trích xuất classId hiện tại từ URL
  const parts = location.pathname.split("/");
  let currentClassId = searchParams.get("classId");
  if (parts[1] === "classrooms" && parts[2] && parts[2] !== "students") {
    currentClassId = parts[2];
  }

  const activeTab = searchParams.get("tab") || "overview";
  const isStudentsPage = location.pathname.includes("/students");
  const isAttendancePage = location.pathname.includes("/attendance");
  const isGradebookPage = location.pathname.includes("/gradebook");
  const isClassroomRoute = location.pathname.startsWith("/classrooms/") || isAttendancePage || isGradebookPage;

  const isOverview = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "overview" || !activeTab);
  const isActivities = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "activities" || activeTab === "assignments" || activeTab === "quizzes");

  // Breadcrumbs mapping (hỗ trợ cả các route con)
  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Trang chủ";
    if (path.startsWith("/classrooms")) return "Lớp học";
    if (path.startsWith("/assignments")) return "Bài tập";
    if (path === "/materials") return "Tài liệu học tập";
    if (path.startsWith("/materials/")) return "Tài liệu học tập / Chi tiết";
    if (path.startsWith("/grades")) return "Bảng điểm";
    if (path.startsWith("/practice")) return "Luyện tập";
    if (path.startsWith("/bank")) return "Ngân hàng câu hỏi";
    if (path.startsWith("/schedule")) return "Lịch trình";
    if (path.startsWith("/attendance")) return "Chuyên cần";
    if (path.startsWith("/profile")) return "Hồ sơ cá nhân";
    if (path.startsWith("/chat")) return "Trợ lý học tập";
    if (path.startsWith("/admin/dashboard")) return "Tổng quan";
    if (path.startsWith("/admin/users")) return "Quản lý người dùng";
    if (path.startsWith("/admin/classrooms")) return "Quản lý lớp học";
    if (path.startsWith("/admin/settings")) return "Cài đặt";
    return "Trang chủ";
  };

  const currentPathName = getPageTitle(location.pathname);

  const fetchNotifications = async () => {
    try {
      let serverNotifs: INotificationItem[] = [];
      const res = await notificationService.getNotifications();
      if (res.data) serverNotifs = res.data;

      if (userRole === "student") {
        const assignRes = await gradebookService.getStudentAssignments();
        const assignments = assignRes.data || [];
        const now = Date.now();
        const localReminders: INotificationItem[] = [];

        assignments.forEach((assign: any) => {
          if (assign.submission?.status === "graded" || assign.submission) return;
          const deadline = new Date(assign.dueDate || assign.deadline).getTime();
          const diff = deadline - now;
          if (diff > 0 && diff < 3 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            let timeText = "";
            let colorCls = "";

            if (days >= 1) {
              timeText = `Còn ${days} ngày nữa đến hạn.`;
              colorCls = days === 1 ? "text-orange-500" : "text-amber-500";
            } else {
              timeText = `Còn ${hours} giờ nữa đến hạn!`;
              colorCls = "text-red-500";
            }

            const isRead = localStorage.getItem(`read_reminder_${assign._id}`) === 'true';

            localReminders.push({
              _id: `reminder_${assign._id}`,
              recipientRole: 'student',
              sender: { _id: 'system', name: 'Hệ thống', email: '' },
              title: `🔔 Nhắc hạn: ${assign.title}`,
              message: `<span class="${colorCls} font-medium">${timeText}</span>`,
              type: 'assignment',
              readBy: [],
              isRead: isRead,
              createdAt: new Date().toISOString()
            } as any);
          }
        });

        serverNotifs = [...localReminders, ...serverNotifs];
      }

      setNotifications(serverNotifs);
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('notification_update', () => {
      console.log('🔔 [Socket.io] Có thông báo mới, đang cập nhật...');
      fetchNotifications();
    });

    socket.on('admin_stats_update', () => {
      fetchNotifications();
    });

    socket.on('teacher_classrooms_update', () => {
      fetchNotifications();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: INotificationItem) => {
    if (!notif.isRead) {
      try {
        if (notif._id.startsWith("reminder_")) {
          localStorage.setItem(`read_${notif._id}`, "true");
          setNotifications((prev) =>
            prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
          );
        } else {
          await notificationService.markAsRead(notif._id);
          setNotifications((prev) =>
            prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
          );
        }
      } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
      }
    }

    // Điều hướng nếu là thông báo Yêu cầu Duyệt Giáo viên cho Admin
    const text = (notif.title + " " + (notif.message || "")).toLowerCase();
    if (userRole === "admin" && (text.includes("duyệt") || text.includes("phê duyệt") || text.includes("pending"))) {
      setIsNotifOpen(false);
      navigate("/admin/users?status=Pending");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogOut = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    await logout();
    navigate("/login");
  };

  return (
    <header className={styles.topHeader}>
      <div className={styles.leftSection}>
        <span className={styles.brandName}>ClassRoom</span>
        <span className={styles.divider}>/</span>
        <span className={styles.pageTitle}>{currentPathName}</span>
      </div>

      <div className={styles.rightSection}>
        {/* Cụm menu ngang vị trí Top Header khi ở trong Lớp Học (gần Chuông thông báo) */}
        {currentClassId && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 mr-2">
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${currentClassId}?tab=overview`)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isOverview ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Chalkboard size={14} weight="bold" />
              <span>Tổng quan</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${currentClassId}?tab=activities`)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isActivities ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <ClipboardText size={14} weight="bold" />
              <span>Bài tập & Bài thi</span>
            </button>
            {(user?.role === "teacher" || user?.role === "admin") && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/classrooms/${currentClassId}/students`)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isStudentsPage ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Users size={14} weight="bold" />
                  <span>Học sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/attendance?classId=${currentClassId}`)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isAttendancePage ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <CheckSquare size={14} weight="bold" />
                  <span>Điểm danh</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/gradebook?classId=${currentClassId}`)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isGradebookPage ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <ChartBar size={14} weight="bold" />
                  <span>Sổ điểm</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className={`${styles.iconBtn} tour-step-notifications`}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full border-2 border-white text-[10px] font-bold text-white px-1 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <span className={styles.notifDot}></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-xl shadow-xl border border-slate-200 pb-2 z-50 overflow-hidden">
              <div className="px-4 py-3 font-bold text-white bg-primary mb-2 shadow-sm flex items-center justify-between">
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  Không có thông báo mới
                </div>
              ) : (
                <div className="flex flex-col max-h-[320px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e55c3f]">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-none ${notif.isRead ? "bg-white" : "bg-orange-50/50"}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm block mb-1 whitespace-normal ${notif.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <span className="text-xs text-slate-600 block whitespace-normal" dangerouslySetInnerHTML={{ __html: notif.message }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Language */}
        <div className={`${styles.languageSelect} tour-step-language`}>
          <Globe size={20} />
          <span>VN</span>
        </div>

        {/* User Profile */}
        <div className={styles.profileDropdown} ref={profileRef}>
          <button
            className={`${styles.profileBtn} tour-step-profile`}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <User size={20} />
            <CaretDown size={14} weight="bold" />
          </button>

          {isProfileOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <p className={styles.userName}>{user?.name || "Người dùng"}</p>
                <p className={styles.userRole}>{user?.role || "Học sinh"}</p>
              </div>
              <Link to="/profile" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                <User size={16} /> Hồ sơ cá nhân
              </Link>
              <button className={styles.dropdownItemLogout} onClick={handleLogOut}>
                <SignOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
