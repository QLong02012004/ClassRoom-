import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button
} from "@heroui/react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import {
  SquaresFour,
  Chalkboard,
  CalendarCheck,
  GraduationCap,
  ClipboardText,
  User,
  SignOut,
  Bell,
  Gear,
  CalendarBlank,
  BookOpen
} from "phosphor-react";
import { useAuth } from "../../../context/AuthContext";
import { notificationService, type INotificationItem } from "../../../service/notification.service";

const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);

  const username = user?.name || "Người dùng";
  const userRole = user?.role || "teacher";
  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;

  const roleDisplay =
    userRole === "admin" ? "Quản trị viên" :
      userRole === "teacher" ? "Giáo viên" : "Học sinh";

  const isActive = (path: string) => location.pathname === path;

  const handleLogOut = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    await logout();
    navigate("/login");
  };

  const fetchNotifications = async () => {
    try {
      if (userRole === "admin") {
        const res = await notificationService.getNotifications();
        if (res.data) setNotifications(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userRole]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNavLinks = () => {
    const commonLinks = [
      { name: "Bảng điều khiển", path: "/dashboard", icon: <SquaresFour size={20} weight={isActive("/dashboard") ? "fill" : "regular"} /> }
    ];

    if (userRole === "student") {
      return [
        ...commonLinks,
        { name: "Lớp học", path: "/classrooms", icon: <Chalkboard size={20} weight={isActive("/classrooms") ? "fill" : "regular"} /> },
        { name: "Điểm số", path: "/gradebook", icon: <GraduationCap size={20} weight={isActive("/gradebook") ? "fill" : "regular"} /> },
        { name: "Bài tập", path: "/assignments", icon: <ClipboardText size={20} weight={isActive("/assignments") ? "fill" : "regular"} /> },
      ];
    } else if (userRole === "admin") {
      return [
        ...commonLinks,
        { name: "Người dùng", path: "/admin/users", icon: <User size={20} weight={isActive("/admin/users") ? "fill" : "regular"} /> },
        { name: "Lớp học hệ thống", path: "/admin/classrooms", icon: <Chalkboard size={20} weight={isActive("/admin/classrooms") ? "fill" : "regular"} /> },
      ];
    } else {
      return [
        ...commonLinks,
        { name: "Lớp học", path: "/classrooms", icon: <Chalkboard size={20} weight={isActive("/classrooms") ? "fill" : "regular"} /> },
        { name: "Điểm danh", path: "/attendance", icon: <CalendarCheck size={20} weight={isActive("/attendance") ? "fill" : "regular"} /> },
        { name: "Sổ điểm", path: "/gradebook", icon: <GraduationCap size={20} weight={isActive("/gradebook") ? "fill" : "regular"} /> },
        { name: "Bài tập", path: "/assignments", icon: <ClipboardText size={20} weight={isActive("/assignments") ? "fill" : "regular"} /> },
        { name: "Lịch dạy", path: "/schedule", icon: <CalendarBlank size={20} weight={isActive("/schedule") ? "fill" : "regular"} /> },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="full"
      className="bg-white border-b border-slate-200"
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          className="sm:hidden text-slate-700"
        />
        <NavbarBrand as={Link} to="/dashboard" className="gap-2 cursor-pointer max-w-fit">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <BookOpen size={24} weight="fill" />
          </div>
          <p className="font-bold text-xl text-slate-900 hidden sm:block">
            Class<span className="text-primary">Room</span>
          </p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-3 sm:gap-6">
        {navLinks.map((link) => (
          <NavbarItem key={link.path} isActive={isActive(link.path)} className="hidden sm:flex">
            <Link
              to={link.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${isActive(link.path)
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {link.icon}
              {link.name}
            </Link>
          </NavbarItem>
        ))}

        {isAuthenticated ? (
          <>
            <NavbarItem>
              <div className="relative" ref={notifRef}>
                <div 
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer relative overflow-visible flex items-center justify-center"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                >
                  <Bell size={22} weight="bold" className="text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-[300px] bg-white rounded-xl shadow-lg border border-slate-100 pb-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 font-bold text-white bg-primary mb-2 shadow-sm">Thông báo</div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-center text-sm text-slate-500">
                        Không có thông báo mới
                      </div>
                    ) : (
                      <div className="flex flex-col max-h-[300px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e55c3f]">
                        {notifications.map((notif) => (
                          <div key={notif._id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors break-words">
                            <span className="font-semibold text-sm block mb-1 text-slate-800 whitespace-normal">{notif.title}</span>
                            <span className="text-xs text-slate-500 block whitespace-normal">{notif.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </NavbarItem>

            <NavbarItem>
              <div className="relative" ref={profileRef}>
                <div onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <Avatar
                    className="transition-transform cursor-pointer ring-2 ring-offset-2 ring-offset-white ring-slate-300"
                    color="default"
                    size="sm"
                  >
                    <Avatar.Image src={userAvatar} alt={username} />
                    <Avatar.Fallback>{username ? username.charAt(0).toUpperCase() : "U"}</Avatar.Fallback>
                  </Avatar>
                </div>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                      <p className="font-semibold text-sm text-slate-800 truncate">{username}</p>
                      <p className="text-xs text-slate-500 truncate">{roleDisplay}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={16} weight="bold" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors w-full text-left"
                      onClick={(e) => {
                        setIsProfileOpen(false);
                        handleLogOut(e);
                      }}
                    >
                      <SignOut size={16} weight="bold" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem>
            <Button onPress={() => navigate("/login")} variant="primary">
              Đăng nhập
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarMenu className="bg-white/80 backdrop-blur-md pt-6">
        {navLinks.map((link) => (
          <NavbarMenuItem key={link.path} isActive={isActive(link.path)}>
            <Link
              to={link.path}
              className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium text-lg ${isActive(link.path)
                ? "bg-primary text-white shadow-md"
                : "text-slate-700 hover:bg-slate-100"
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.icon}
              {link.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {userRole === "teacher" && (
          <NavbarMenuItem>
            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={() => {
                setIsMenuOpen(false);
                window.dispatchEvent(new Event("open-new-class-modal"));
              }}
            >
              Tạo lớp mới
            </Button>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
};

export default NavBar;