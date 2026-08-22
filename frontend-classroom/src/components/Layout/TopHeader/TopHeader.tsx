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

  const isOverview = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "overview" || activeTab === "feed" || !activeTab);
  const isActivities = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "activities" || activeTab === "assignments" || activeTab === "quizzes");
  const isMembers = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "members");

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
              className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isOverview ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Chalkboard size={14} weight="bold" className={isOverview ? "text-[#f47c20]" : "text-slate-500"} />
              <span>Bảng tin</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${currentClassId}?tab=activities`)}
              className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isActivities ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              <ClipboardText size={14} weight="bold" className={isActivities ? "text-[#f47c20]" : "text-slate-500"} />
              <span>Bài tập & Bài thi</span>
            </button>
            {userRole === "student" ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/classrooms/${currentClassId}?tab=members`)}
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isMembers ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Users size={14} weight="bold" className={isMembers ? "text-[#f47c20]" : "text-slate-500"} />
                  <span>Thành viên</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/grades?classId=${currentClassId}`)}
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isGradebookPage || location.pathname.startsWith("/grades") ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <ChartBar size={14} weight="bold" className={isGradebookPage || location.pathname.startsWith("/grades") ? "text-[#f47c20]" : "text-slate-500"} />
                  <span>Điểm số</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/classrooms/${currentClassId}/students`)}
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isStudentsPage ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Users size={14} weight="bold" className={isStudentsPage ? "text-[#f47c20]" : "text-slate-500"} />
                  <span>Học sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/attendance?classId=${currentClassId}`)}
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isAttendancePage ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <CheckSquare size={14} weight="bold" className={isAttendancePage ? "text-[#f47c20]" : "text-slate-500"} />
                  <span>Điểm danh</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/gradebook?classId=${currentClassId}`)}
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${isGradebookPage ? "bg-white text-[#f47c20] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <ChartBar size={14} weight="bold" className={isGradebookPage ? "text-[#f47c20]" : "text-slate-500"} />
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
            <div className="absolute right-0 mt-2 w-[400px] bg-white rounded-2xl border z-50 overflow-hidden flex flex-col" style={{ maxHeight: '500px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 16px -6px rgba(0,0,0,0.05)', borderColor: '#E2E8F0' }}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #E2E8F0' }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-extrabold" style={{ color: '#0F172A' }}>Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(244,124,32,0.10)', color: '#f47c20', border: '1px solid rgba(244,124,32,0.20)' }}>
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await notificationService.markAllAsRead();
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    } catch {}
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                  style={{ background: 'rgba(47,143,163,0.08)', color: '#2f8fa3', border: '1px solid rgba(47,143,163,0.2)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(47,143,163,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(47,143,163,0.08)'; }}
                >
                  Đọc tất cả
                </button>
              </div>

              {/* List */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#F8FAFC' }}>🔕</div>
                  <p className="text-sm font-medium" style={{ color: '#64748B' }}>Không có thông báo mới</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full" style={{ scrollbarColor: '#E2E8F0 transparent' }}>
                  {notifications.map((notif) => {
                    const isUnread = !notif.isRead;

                    const createdDate = notif.createdAt ? new Date(notif.createdAt) : null;
                    const timeStr = createdDate ? (() => {
                      const diff = Date.now() - createdDate.getTime();
                      const mins = Math.floor(diff / 60000);
                      const hrs = Math.floor(diff / 3600000);
                      const days = Math.floor(diff / 86400000);
                      if (mins < 1) return 'Vừa xong';
                      if (mins < 60) return `${mins} phút trước`;
                      if (hrs < 24) return `${hrs} giờ trước`;
                      return `${days} ngày trước`;
                    })() : '';

                    return (
                      <div
                        key={notif._id}
                        className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors"
                        style={{
                          background: isUnread ? 'rgba(244,124,32,0.04)' : '#FFFFFF',
                          borderBottom: '1px solid #F8FAFC',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isUnread ? 'rgba(244,124,32,0.08)' : '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = isUnread ? 'rgba(244,124,32,0.04)' : '#FFFFFF')}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug whitespace-normal break-words" style={{ fontWeight: isUnread ? 700 : 600, color: isUnread ? '#0F172A' : '#334155' }}>
                            {notif.title}
                          </p>
                          <p className="text-[12px] mt-0.5 leading-relaxed whitespace-normal break-words" style={{ color: '#64748B' }} dangerouslySetInnerHTML={{ __html: notif.message }} />
                          {timeStr && (
                            <span className="text-[10px] mt-1.5 block" style={{ color: '#94A3B8' }}>{timeStr}</span>
                          )}
                        </div>

                        {/* Unread dot */}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#f47c20' }}></span>
                        )}
                      </div>
                    );
                  })}
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
