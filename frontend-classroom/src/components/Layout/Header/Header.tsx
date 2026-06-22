import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, SignOut, User } from "phosphor-react";
import { useAuth } from "../../../context/AuthContext";
import styles from "./Header.module.scss";
import { notificationService, type INotificationItem } from "../../../service/notification.service";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch (e) {
      return "";
    }
  };

  const isStudentsPage = location.pathname.includes("/students");
  const activeTab = isStudentsPage ? "" : (searchParams.get("tab") || "overview");

  const username = user?.name || "Người dùng";
  const userRole = user?.role || "teacher";

  // Custom display for role
  const roleDisplay =
    userRole === "teacher" ? "Giáo viên" :
    userRole === "admin" ? "Quản trị viên" : "Học sinh";

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;

  // Trích xuất classId từ URL
  const classIdMatch = location.pathname.match(/^\/classrooms\/([^/]+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.data) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    if (userRole === "admin") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Polling every 15 seconds
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications(prev =>
        prev.map(n => n._id === notifId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Lỗi đánh dấu đọc tất cả:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleTabClick = (tabName: string) => {
    if (classId) {
      navigate(`/classrooms/${classId}?tab=${tabName}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      {/* Cánh trái: Brand & Các Tab điều hướng */}
      <div className={styles.navTabs}>
        {classId && (
          <span className={styles.brandLabel}>Quản lý lớp học</span>
        )}
        {classId ? (
          <>
            <button 
              className={`${styles.tabItem} ${activeTab === "overview" ? styles.active : ""}`}
              onClick={() => handleTabClick("overview")}
            >
              Tổng quan
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === "reports" ? styles.active : ""}`}
              onClick={() => handleTabClick("reports")}
            >
              Báo cáo
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === "schedule" ? styles.active : ""}`}
              onClick={() => handleTabClick("schedule")}
            >
              Lịch trình
            </button>
            {userRole === "teacher" && (
              <>
                <button 
                  className={`${styles.tabItem} ${activeTab === "quizzes" ? styles.active : ""}`}
                  onClick={() => handleTabClick("quizzes")}
                >
                  Trắc nghiệm
                </button>
                <button 
                  className={`${styles.tabItem} ${isStudentsPage ? styles.active : ""}`}
                  onClick={() => navigate(`/classrooms/${classId}/students`)}
                >
                  Học sinh
                </button>
              </>
            )}
          </>
        ) : (
          <span className={styles.defaultBrand}>Quản lý lớp học</span>
        )}
      </div>

      {/* Cánh phải: Tìm kiếm, Thông báo và Hồ sơ */}
      <div className={styles.rightSection}>


        {/* Nút thông báo */}
        {userRole === "admin" ? (
          <div className={styles.notificationContainer} ref={notifDropdownRef}>
            <button
              className={styles.notificationBtn}
              onClick={() => setNotifDropdownOpen(prev => !prev)}
              aria-label="Thông báo"
            >
              <Bell size={22} weight="bold" />
              {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
            </button>
            {notifDropdownOpen && (
              <div className={styles.notificationDropdown}>
                <div className={styles.notifHeader}>
                  <h3 className={styles.notifTitle}>Thông báo hoạt động</h3>
                  {unreadCount > 0 && (
                    <button
                      className={styles.markAllReadBtn}
                      onClick={handleMarkAllAsRead}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyNotifications}>
                      Không có thông báo hoạt động nào.
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const senderInitials = notif.sender?.name
                        ? notif.sender.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(-2)
                            .join("")
                            .toUpperCase()
                        : "GV";

                      return (
                        <div
                          key={notif._id}
                          className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ""}`}
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          <div className={styles.notifAvatar}>{senderInitials}</div>
                          <div className={styles.notifContent}>
                            <p className={styles.itemTitle}>{notif.title}</p>
                            <p className={styles.itemMessage}>{notif.message}</p>
                            <span className={styles.itemTime}>
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className={styles.notificationBtn} aria-label="Thông báo">
            <Bell size={22} weight="bold" />
          </button>
        )}

        {/* Thông tin hồ sơ + Dropdown */}
        <div className={styles.profileWidget} ref={dropdownRef}>
          <div
            className={styles.profileClickable}
            onClick={() => setDropdownOpen((prev) => !prev)}
            role="button"
            aria-label="Mở menu tài khoản"
          >
            <div className={styles.profileText}>
              <span className={styles.profileName}>{username}</span>
              <span className={styles.profileRole}>{roleDisplay}</span>
            </div>
            <img src={avatar} alt="Avatar" className={styles.avatarImg} />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <img src={avatar} alt="Avatar" className={styles.dropdownAvatar} />
                <div>
                  <p className={styles.dropdownName}>{username}</p>
                  <p className={styles.dropdownRole}>{roleDisplay}</p>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItem}
                onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
              >
                <User size={16} weight="bold" />
                Hồ sơ cá nhân
              </button>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                onClick={handleLogout}
              >
                <SignOut size={16} weight="bold" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

