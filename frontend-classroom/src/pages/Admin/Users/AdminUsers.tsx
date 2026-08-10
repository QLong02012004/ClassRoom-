import { useSearchParams } from "react-router-dom";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  MagnifyingGlass,
  DotsThree,
  Funnel,
  PencilSimple,
  Key,
  LockKey,
  LockKeyOpen,
  ShieldStar,
  Trash,
  CaretDown,
  Eye,
  EyeSlash,
  CheckCircle,
  XCircle,
  Clock
} from "phosphor-react";
import { ClimbingBoxLoader } from "react-spinners";

import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { SecondaryButton } from "@/components/ui/Buttons/SecondaryButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Input as HeroInput, Select, ListBox, ListBoxItem, Table, Chip, Checkbox, Avatar as HeroAvatar, Pagination } from "@heroui/react";
import type { Selection, SortDescriptor } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionMenu } from "@/components/ui/ActionMenus/ActionMenu";
import { CustomConfirmDialog } from "@/components/ui/Dialogs/CustomConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "../../../components/Styles/ToastContext";
import styles from "./AdminUsers.module.scss";
import { authService } from "../../../service/auth.service";
import { userService, type IUserItem } from "../../../service/user.service";
import { io } from "socket.io-client";

// Chuyển đổi role từ DB sang tiếng Việt để hiển thị
const roleToVi = (role: string): "Admin" | "Giáo viên" | "Học sinh" => {
  if (role === "admin") return "Admin";
  if (role === "teacher") return "Giáo viên";
  return "Học sinh";
};

// Chuyển đổi tiếng Việt sang role DB
const viToRole = (vi: string): "admin" | "teacher" | "student" => {
  if (vi === "Admin") return "admin";
  if (vi === "Giáo viên") return "teacher";
  return "student";
};

const normalizeString = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

// Định nghĩa User type dùng trong table (có thêm _id để gọi API)
export type User = {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Giáo viên" | "Học sinh";
  status: "Active" | "Locked" | "Pending";
  subject?: string;
  phone?: string;
  parentPhone?: string;
  createdAt?: string;
  avatar?: string;
  gender?: string;
  dob?: string;
  bio?: string;
  degree?: string;
};

// Chuyển từ IUserItem (API) sang User (table)
const mapApiToUser = (item: IUserItem): User => ({
  _id: item._id,
  name: item.name,
  email: item.email,
  role: roleToVi(item.role),
  status: item.status,
  subject: item.subject,
  phone: item.phone || item.parentPhone || "",
  parentPhone: item.parentPhone,
  createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : "---",
  avatar: item.avatar,
  gender: item.gender,
  dob: item.dob,
  bio: item.bio,
  degree: item.degree,
});

const PendingUserApprovalModal = ({
  user,
  onClose,
  onApprove,
  onReject
}: {
  user: User;
  onClose: () => void;
  onApprove: (user: User) => void;
  onReject: (user: User) => void;
}) => {
  const initials = user.name.split(" ").map(n => n[0]).slice(-2).join("").toUpperCase();

  return (
    <DialogContent className="!max-w-[550px] sm:max-w-[550px] w-[95vw] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl [&>button]:hover:bg-[#f47c20] [&>button]:hover:text-white [&>button]:transition-colors [&>button]:cursor-pointer">
      <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#f47c20]/10 via-[#f47c20]/5 to-transparent border-b border-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f47c20]/15 flex items-center justify-center text-[#f47c20] shadow-sm">
            <Clock size={28} weight="duotone" />
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#f47c20] px-2 py-0.5 rounded-md text-white shadow-sm">
                Yêu cầu duyệt tài khoản
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">{user.role}</span>
            </div>
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight leading-tight">
              {user.name}
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      <div className="p-6 space-y-4 bg-white">
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs leading-relaxed font-medium flex items-start gap-2.5 shadow-sm">
          <div className="p-1 rounded-md bg-amber-200/60 text-amber-800 shrink-0 mt-0.5">
            <Clock size={16} weight="bold" />
          </div>
          <div>
            <span className="font-bold text-amber-950 text-sm block mb-0.5">Tài khoản vừa đăng ký đang chờ xét duyệt</span>
            <p className="text-amber-800/90 leading-relaxed">
              Tài khoản này vừa xác thực OTP và đang chờ Ban giám hiệu phê duyệt. Bạn có thể chọn <strong className="text-emerald-700">Phê duyệt kích hoạt</strong> để cấp quyền sử dụng hệ thống hoặc <strong className="text-rose-700">Từ chối tài khoản</strong>.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <Avatar className="w-12 h-12 border-2 border-[#f47c20] shadow-sm shrink-0">
            <AvatarImage src={user.avatar || ""} />
            <AvatarFallback className="bg-[#f47c20] text-white font-black text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide truncate">
              {user.name}
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-bold text-[#f47c20] bg-[#f47c20]/10 px-2 py-0.5 rounded-md">
                {user.role} {user.subject ? `(${user.subject})` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Số điện thoại / Zalo</span>
            <p className="font-bold text-slate-800 text-xs truncate">{user.phone || "Chưa cập nhật"}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Bằng cấp / Trình độ</span>
            <p className="font-bold text-slate-800 text-xs truncate">{user.degree || (user.role === "Giáo viên" ? "Đại học Sư phạm" : "Chưa cập nhật")}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Môn học chuyên môn</span>
            <p className="font-bold text-slate-800 text-xs truncate">{user.subject || "Chưa phân loại"}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Ngày đăng ký</span>
            <p className="font-bold text-slate-800 text-xs truncate">{user.createdAt || "Vừa xong"}</p>
          </div>
        </div>

        {user.bio && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Giới thiệu bản thân</span>
            <p className="font-medium text-slate-700 text-xs italic">{user.bio}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-sm shadow-sm cursor-pointer"
          >
            Đóng
          </button>

          <button
            onClick={() => onReject(user)}
            className="px-4 py-2.5 rounded-xl font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <XCircle size={18} weight="bold" />
            Từ chối tài khoản
          </button>

          <button
            onClick={() => onApprove(user)}
            className="px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-600 border border-emerald-600 hover:bg-emerald-700 transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle size={18} weight="bold" />
            Phê duyệt kích hoạt
          </button>
        </div>
      </div>
    </DialogContent>
  );
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State cho Modal Xem Chi tiết Hồ sơ Người dùng
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [pendingApprovalUser, setPendingApprovalUser] = useState<User | null>(null);

  const handleOpenDetail = (user: User) => {
    setDetailUser(user);
    setShowDetailDialog(true);
  };

  // Table States
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const [searchParams] = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusParam);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const pendingCount = useMemo(() => users.filter(u => u.status === "Pending").length, [users]);

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    if (globalFilter) {
      const normalizedFilter = normalizeString(globalFilter);
      filtered = filtered.filter(u =>
        normalizeString(u.name).includes(normalizedFilter) ||
        normalizeString(u.email).includes(normalizedFilter) ||
        (u.phone && normalizeString(u.phone).includes(normalizedFilter))
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      // 🌟 ƯU TIÊN XẾP TÀI KHOẢN PENDING LÊN TRÊN CÙNG TRANG 1
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;

      const col = sortDescriptor.column as keyof User;
      const first = String(a[col] || "");
      const second = String(b[col] || "");
      let cmp = first.localeCompare(second);

      if (sortDescriptor.direction === "descending") {
        cmp *= -1;
      }
      return cmp;
    });
  }, [users, globalFilter, roleFilter, statusFilter, sortDescriptor]);
  const toast = useToast();

  // Pagination State
  const ROWS_PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredAndSortedUsers.length / ROWS_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredAndSortedUsers.slice(start, start + ROWS_PER_PAGE);
  }, [page, filteredAndSortedUsers]);

  const startIdx = (page - 1) * ROWS_PER_PAGE + 1;
  const endIdx = Math.min(page * ROWS_PER_PAGE, filteredAndSortedUsers.length);

  // Đặt lại trang 1 khi lọc
  useEffect(() => {
    setPage(1);
  }, [globalFilter, roleFilter, statusFilter]);

  // State cho dialog tạo giáo viên mới
  const [showDialog, setShowDialog] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher" as "teacher" | "student",
    subject: "Toán",
    customSubject: "",
  });

  // State cho dialog Chỉnh sửa thành viên
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    subject: "Toán",
    customSubject: "",
    role: "teacher" as "admin" | "teacher" | "student",
  });

  // State cho dialog Reset mật khẩu
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // State cho dialog Đổi quyền
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "teacher" | "student">("teacher");
  const [isChangingRole, setIsChangingRole] = useState(false);

  // State cho CustomConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    actionType?: 'danger' | 'warning' | 'success' | 'default';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionType: 'default',
    onConfirm: () => { },
  });

  // Tính số lượng đã chọn
  const selectedCount =
    selectedKeys === "all"
      ? filteredAndSortedUsers.length
      : selectedKeys instanceof Set
        ? selectedKeys.size
        : Array.from(selectedKeys || []).length;

  // Fetch danh sách users từ API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers();
      if (res.data) {
        setUsers(res.data.map(mapApiToUser));
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể tải danh sách người dùng", 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Kết nối Socket.IO để tự động tải lại danh sách khi có người mới đăng ký
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(backendUrl, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('⚡ [AdminUsers] Đã kết nối Socket.IO Real-time!');
    });

    socket.on('admin_stats_update', () => {
      console.log('🔄 [AdminUsers] Có thay đổi dữ liệu, đang tải lại danh sách người dùng...');
      fetchUsers();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchUsers]);

  // Handler: Phê duyệt tài khoản Giáo viên (Pending -> Active)
  const handleApproveUser = (user: User) => {
    setPendingApprovalUser(null);
    setConfirmDialog({
      isOpen: true,
      title: "Phê duyệt tài khoản Giáo viên",
      description: (
        <span>
          Bạn có chắc chắn muốn phê duyệt kích hoạt tài khoản Giáo viên{" "}
          <strong className="font-black text-slate-900 uppercase">{user.name}</strong> ({user.email})?
        </span>
      ),
      actionType: 'success',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await userService.updateUserStatus(user._id, "Active");
          setUsers((prev) =>
            prev.map((u) => (u._id === user._id ? { ...u, status: "Active" } : u))
          );
          toast.success(`Đã phê duyệt kích hoạt tài khoản ${user.name.toUpperCase()} thành công!`, 3000);
        } catch (error: any) {
          toast.error(error.message || "Phê duyệt tài khoản thất bại", 3000);
        }
      }
    });
  };

  // Handler: Từ chối tài khoản Giáo viên Pending
  const handleRejectUser = (user: User) => {
    setPendingApprovalUser(null);
    setConfirmDialog({
      isOpen: true,
      title: "Từ chối tài khoản này?",
      description: (
        <span>
          Bạn có chắc chắn muốn từ chối kích hoạt tài khoản Giáo viên{" "}
          <strong className="font-black text-slate-900 uppercase">{user.name}</strong> ({user.email})? Yêu cầu đăng ký sẽ bị từ chối và hủy khỏi hệ thống.
        </span>
      ),
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await userService.deleteUser(user._id);
          setUsers((prev) => prev.filter((u) => u._id !== user._id));
          toast.success(`Đã từ chối tài khoản ${user.name.toUpperCase()}!`, 3000);
        } catch (error: any) {
          toast.error(error.message || "Từ chối tài khoản thất bại", 3000);
        }
      }
    });
  };

  // Handler: Khóa / Mở khóa tài khoản
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "Active" ? "Locked" : "Active";
    const actionName = newStatus === "Locked" ? "Khóa" : "Mở khóa";

    setConfirmDialog({
      isOpen: true,
      title: `${actionName} tài khoản`,
      description: (
        <span>
          Bạn có chắc chắn muốn {actionName.toLowerCase()} tài khoản{" "}
          <strong className="font-black text-slate-900 uppercase">{user.name}</strong>?
        </span>
      ),
      actionType: newStatus === "Locked" ? 'warning' : 'success',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await userService.updateUserStatus(user._id, newStatus);
          setUsers((prev) =>
            prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
          );
          toast.success(
            `${newStatus === "Locked" ? "Đã khóa" : "Đã mở khóa"} tài khoản ${user.name.toUpperCase()}`,
            3000
          );
        } catch (error: any) {
          toast.error(error.message || "Cập nhật trạng thái thất bại", 3000);
        }
      }
    });
  };

  // Handler: Xóa tài khoản
  const handleDeleteUser = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa tài khoản",
      description: (
        <span>
          Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{" "}
          <strong className="font-black text-slate-900 uppercase">{user.name}</strong>? Hành động này không thể hoàn tác.
        </span>
      ),
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await userService.deleteUser(user._id);
          setUsers((prev) => prev.filter((u) => u._id !== user._id));
          toast.success(`Đã xóa tài khoản ${user.name.toUpperCase()}`, 3000);
        } catch (error: any) {
          toast.error(error.message || "Xóa tài khoản thất bại", 3000);
        }
      }
    });
  };

  // Handler: Xóa nhiều tài khoản
  const handleDeleteMultipleUsers = async () => {
    let idsToDelete: string[] = [];
    if (selectedKeys === "all") {
      idsToDelete = filteredAndSortedUsers.map(u => u._id);
    } else {
      idsToDelete = Array.from(selectedKeys) as string[];
    }

    if (idsToDelete.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xóa nhiều tài khoản",
      description: `Bạn có chắc chắn muốn xóa vĩnh viễn ${idsToDelete.length} tài khoản đã chọn? Hành động này không thể hoàn tác.`,
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);
          await Promise.all(idsToDelete.map(id => userService.deleteUser(id)));
          setUsers((prev) => prev.filter((u) => !idsToDelete.includes(u._id)));
          setSelectedKeys(new Set());
          toast.success(`Đã xóa ${idsToDelete.length} tài khoản`, 3000);
        } catch (error: any) {
          toast.error("Có lỗi xảy ra khi xóa nhiều tài khoản. Một số tài khoản có thể chưa được xóa.", 3000);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Handler: Mở dialog reset mật khẩu
  const handleOpenResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowResetDialog(true);
  };

  // Handler: Xác nhận reset mật khẩu
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsResetting(true);
    try {
      await userService.resetUserPassword(selectedUser._id, newPassword);
      toast.success(`Đã reset mật khẩu cho ${selectedUser.name}`, 3000);
      setShowResetDialog(false);
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Reset mật khẩu thất bại", 3000);
    } finally {
      setIsResetting(false);
    }
  };

  // Handler: Mở dialog đổi quyền
  const handleOpenChangeRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(viToRole(user.role));
    setShowRoleDialog(true);
  };

  // Handler: Xác nhận đổi quyền
  const handleConfirmChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsChangingRole(true);
    try {
      await userService.updateUserRole(selectedUser._id, selectedRole);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id ? { ...u, role: roleToVi(selectedRole) } : u
        )
      );
      toast.success(`Đã cập nhật quyền cho ${selectedUser.name}`, 3000);
      setShowRoleDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Đổi quyền thất bại", 3000);
    } finally {
      setIsChangingRole(false);
    }
  };

  // Handler: Mở dialog chỉnh sửa thành viên
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      id: user._id,
      name: user.name,
      email: user.email,
      subject: ["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"].includes(user.subject || "") ? user.subject! : "Khác",
      customSubject: !["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"].includes(user.subject || "") ? (user.subject || "") : "",
      role: viToRole(user.role),
    });
    setShowEditDialog(true);
  };

  // Handler: Xác nhận cập nhật thông tin thành viên
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await userService.updateUser(editFormData.id, {
        name: editFormData.name,
        email: editFormData.email,
        subject: editFormData.role === "teacher" ? (editFormData.subject === "Khác" ? editFormData.customSubject : editFormData.subject) : "",
        role: editFormData.role,
      });

      toast.success(response.message || "Cập nhật thành công!", 3000);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === editFormData.id
            ? {
              ...u,
              name: editFormData.name,
              email: editFormData.email,
              role: roleToVi(editFormData.role),
              subject: editFormData.role === "teacher" ? editFormData.subject : "",
            }
            : u
        )
      );

      setShowEditDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Cập nhật thất bại!", 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Đóng hộp thoại Tạo người dùng (có cảnh báo nếu chưa lưu)
  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      if (formData.name.trim() || formData.email.trim() || formData.password.trim()) {
        if (window.confirm("Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn đóng hộp thoại và hủy bỏ?")) {
          setShowDialog(false);
          setFormData({ name: "", email: "", password: "", role: "teacher", subject: "Toán", customSubject: "" });
        }
      } else {
        setShowDialog(false);
        setFormData({ name: "", email: "", password: "", role: "teacher", subject: "Toán", customSubject: "" });
      }
    } else {
      setShowDialog(true);
    }
  };

  // Handler: Tạo tài khoản mới (Giáo viên hoặc Học sinh)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const email = formData.email.trim().toLowerCase();

    if (!email || !strictEmailRegex.test(email)) {
      toast.error("Địa chỉ Email không đúng định dạng cú pháp chuẩn (ví dụ: name@school.edu.vn hoặc user@gmail.com)!", 4000);
      return;
    }

    const domain = email.split('@')[1] || '';
    const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'edu.vn', 'school.edu.vn', 'classroom.com'];
    const isStandardDomain = allowedDomains.some(d => domain === d || domain.endsWith('.' + d));

    // Nếu không phải domain phổ biến và chứa dãy số linh tinh rác dài hơn 3 số (ví dụ @g123213mail.com, @g123ail.com)
    if (!isStandardDomain && (/[0-9]{3,}/.test(domain) || domain.length > 20)) {
      toast.error("Tên miền Email nghi vấn rác (ví dụ: chứa dãy số ngẫu nhiên)! Vui lòng sử dụng email thật.", 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (formData.role === "teacher") {
        response = await authService.createTeacher({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          subject: formData.subject === "Khác" ? formData.customSubject : formData.subject,
        });
      } else {
        response = await authService.createStudent({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      toast.success(response.message || "Tạo tài khoản thành công!", 3000);

      // Fetch lại danh sách để đảm bảo đồng bộ
      await fetchUsers();

      setShowDialog(false);
      setFormData({ name: "", email: "", password: "", role: "teacher", subject: "Toán", customSubject: "" });
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo tài khoản!", 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed @tanstack/react-table setup. Using direct HeroUI table rendering instead.

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1400px] mx-auto bg-[#F8FAFC] min-h-screen">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight text-slate-900 ${styles.add}`}>
            Quản lý người dùng
          </h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Quản lý danh sách giáo viên, học sinh và phân quyền truy cập.
          </p>
        </div>
      </div>

      {/* TABLE TOOLBAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
            />
            <HeroInput
              placeholder="Tìm kiếm theo tên / email..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
          <Select
            className="w-full md:w-auto"
            aria-label="Lọc theo vai trò"
            selectedKey={roleFilter}
            onSelectionChange={(key) => setRoleFilter(key as string)}
          >
            <Select.Trigger className="w-full md:w-auto flex items-center justify-between bg-white gap-2 border border-slate-200 shadow-sm text-slate-600 font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
              <div className="flex items-center gap-2">
                <Funnel size={16} weight="bold" />
                <span>
                  Vai trò{" "}
                  {roleFilter !== "all" ? `: ${roleFilter}` : ""}
                </span>
              </div>
            </Select.Trigger>
            <Select.Popover className="w-48 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 z-50">
              <ListBox className="p-1 outline-none space-y-1">
                <ListBoxItem id="Admin" textValue="Admin" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-medium text-sm">
                  Admin
                </ListBoxItem>
                <ListBoxItem id="Giáo viên" textValue="Giáo viên" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-medium text-sm">
                  Giáo viên
                </ListBoxItem>
                <ListBoxItem id="Học sinh" textValue="Học sinh" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-medium text-sm">
                  Học sinh
                </ListBoxItem>
                <ListBoxItem id="all" textValue="Tất cả vai trò" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-bold text-slate-500 border-t border-slate-100 mt-1 text-sm">
                  Tất cả vai trò
                </ListBoxItem>
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="w-full md:w-auto"
            aria-label="Lọc theo trạng thái"
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as string)}
          >
            <Select.Trigger className="w-full md:w-auto flex items-center justify-between bg-white gap-2 border border-slate-200 shadow-sm text-slate-600 font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
              <div className="flex items-center gap-2">
                <Funnel size={16} weight="bold" />
                <span>
                  Trạng thái{" "}
                  {statusFilter !== "all"
                    ? `: ${statusFilter === "Active" ? "Hoạt động" : statusFilter === "Pending" ? "Chờ phê duyệt" : "Đang khóa"}`
                    : ""}
                </span>
              </div>
            </Select.Trigger>
            <Select.Popover className="w-48 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 z-50">
              <ListBox className="p-1 outline-none space-y-1">
                <ListBoxItem id="Active" textValue="Hoạt động" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Hoạt động
                  </div>
                </ListBoxItem>
                <ListBoxItem id="Pending" textValue="Chờ phê duyệt" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Chờ phê duyệt
                  </div>
                </ListBoxItem>
                <ListBoxItem id="Locked" textValue="Đang khóa" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Đang khóa
                  </div>
                </ListBoxItem>
                <ListBoxItem id="all" textValue="Tất cả trạng thái" className="px-3 py-2 hover:bg-slate-100 rounded cursor-pointer outline-none focus:bg-slate-100 font-bold text-slate-500 border-t border-slate-100 mt-1 text-sm">
                  Tất cả trạng thái
                </ListBoxItem>
              </ListBox>
            </Select.Popover>
          </Select>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "Pending" ? "all" : "Pending")}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border shrink-0 ${statusFilter === "Pending"
                ? "bg-[#2f8fa3] text-white border-[#2f8fa3] shadow-sm"
                : "bg-cyan-50/70 text-[#2f8fa3] border-cyan-200 hover:bg-cyan-100/80"
                }`}
            >
              <span>⏳ Chờ duyệt</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusFilter === "Pending" ? "bg-white text-[#2f8fa3]" : "bg-[#2f8fa3] text-white"
                  }`}
              >
                {pendingCount}
              </span>
            </button>
          )}

          {selectedCount > 0 && (
            <PrimaryButton
              variant="destructive"
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold flex items-center gap-2 px-4 py-2 h-auto"
              onClick={handleDeleteMultipleUsers}
            >
              <Trash size={16} weight="bold" />
              Xóa {selectedCount} tài khoản
            </PrimaryButton>
          )}
        </div>

        {/* Dialog Thêm người dùng */}
        <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <SecondaryButton size="lg" className="w-full md:w-auto shadow-md font-extrabold">
              + Thêm giáo viên
            </SecondaryButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold text-[#f47c20]">Thêm người dùng mới</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Nhập thông tin để tạo và cấp tài khoản.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-slate-700">
                    Họ và tên
                  </Label>
                  <HeroInput
                    id="name"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-slate-700">
                    Email
                  </Label>
                  <HeroInput
                    id="email"
                    type="email"
                    placeholder="Ví dụ: nva@school.edu.vn"
                    required
                    autoComplete="off"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-slate-700">
                    Mật khẩu khởi tạo
                  </Label>
                  <div className="relative">
                    <HeroInput
                      id="password"
                      type={showCreatePassword ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      autoComplete="new-password"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0 flex items-center justify-center z-10"
                      title={showCreatePassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showCreatePassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                    </button>
                  </div>
                </div>
                {formData.role === "teacher" && (
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="subject" className="font-semibold text-slate-700">
                      Môn học chuyên môn
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all text-sm font-semibold flex items-center justify-between"
                        >
                          <span>{formData.subject === "Khác" ? "Khác..." : `Môn ${formData.subject || "Toán"}`}</span>
                          <CaretDown size={16} className="text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[377px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1">
                        {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "GDCD", "Tin học", "Thể dục", "Khác"].map((subj) => (
                          <DropdownMenuItem
                            key={subj}
                            onClick={() => setFormData({ ...formData, subject: subj, customSubject: subj === "Khác" ? "" : formData.customSubject })}
                            className="px-4 py-2.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                          >
                            {subj === "Khác" ? "Khác..." : `Môn ${subj}`}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {formData.subject === "Khác" && (
                      <HeroInput
                        type="text"
                        placeholder="Nhập tên môn học..."
                        required
                        value={formData.customSubject}
                        onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                        className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all"
                      />
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => handleCloseDialog(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 border-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <SecondaryButton
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <ClimbingBoxLoader color="#ffffff" size={6} />
                      <span className="ml-2">Đang tạo...</span>
                    </span>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </SecondaryButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Reset mật khẩu */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleConfirmResetPassword}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Reset mật khẩu
                </DialogTitle>
                <DialogDescription>
                  Đặt mật khẩu mới cho{" "}
                  <strong>{selectedUser?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="font-semibold text-slate-700">
                    Mật khẩu mới
                  </Label>
                  <HeroInput
                    id="newPassword"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <DialogFooter>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetDialog(false)}
                  className="font-semibold"
                  disabled={isResetting}
                >
                  Hủy
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  className="bg-primary text-white font-semibold"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <span className="flex items-center gap-2">
                      <ClimbingBoxLoader color="#ffffff" size={6} />
                      <span className="ml-2">Đang xử lý...</span>
                    </span>
                  ) : (
                    "Xác nhận"
                  )}
                </PrimaryButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Đổi quyền */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleConfirmChangeRole}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Thay đổi vai trò
                </DialogTitle>
                <DialogDescription>
                  Cập nhật vai trò cho{" "}
                  <strong>{selectedUser?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">
                    Chọn vai trò mới
                  </Label>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        { value: "admin", label: "Admin", desc: "Toàn quyền quản trị hệ thống" },
                        { value: "teacher", label: "Giáo viên", desc: "Quản lý lớp học và học sinh" },
                        { value: "student", label: "Học sinh", desc: "Xem điểm và lịch học" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedRole(opt.value)}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors ${selectedRole === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${selectedRole === opt.value
                            ? "border-primary bg-primary"
                            : "border-slate-300"
                            }`}
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowRoleDialog(false)}
                  className="font-semibold"
                  disabled={isChangingRole}
                >
                  Hủy
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  className="bg-primary text-white font-semibold"
                  disabled={isChangingRole}
                >
                  {isChangingRole ? (
                    <span className="flex items-center gap-2">
                      <ClimbingBoxLoader color="#ffffff" size={6} />
                      <span className="ml-2">Đang cập nhật...</span>
                    </span>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </PrimaryButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Chỉnh sửa thành viên */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdateUser}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">Chỉnh sửa thành viên</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Cập nhật thông tin tài khoản người dùng.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="font-semibold text-slate-700">
                    Họ và tên
                  </Label>
                  <HeroInput
                    id="edit-name"
                    required
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="font-semibold text-slate-700">
                    Email
                  </Label>
                  <HeroInput
                    id="edit-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Vai trò</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-semibold flex items-center justify-between"
                      >
                        <span>{roleToVi(editFormData.role)}</span>
                        <CaretDown size={16} className="text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[377px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1">
                      {[
                        { value: "admin", label: "Admin" },
                        { value: "teacher", label: "Giáo viên" },
                        { value: "student", label: "Học sinh" },
                      ].map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => setEditFormData({ ...editFormData, role: opt.value as any })}
                          className="px-4 py-2.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {editFormData.role === "teacher" && (
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="edit-subject" className="font-semibold text-slate-700">
                      Môn học chuyên môn
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all text-sm font-semibold flex items-center justify-between"
                        >
                          <span>{editFormData.subject === "Khác" ? "Khác..." : `Môn ${editFormData.subject || "Toán"}`}</span>
                          <CaretDown size={16} className="text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[377px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1">
                        {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "GDCD", "Tin học", "Thể dục", "Khác"].map((subj) => (
                          <DropdownMenuItem
                            key={subj}
                            onClick={() => setEditFormData({ ...editFormData, subject: subj, customSubject: subj === "Khác" ? "" : editFormData.customSubject })}
                            className="px-4 py-2.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                          >
                            {subj === "Khác" ? "Khác..." : `Môn ${subj}`}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {editFormData.subject === "Khác" && (
                      <HeroInput
                        type="text"
                        placeholder="Nhập tên môn học..."
                        required
                        value={editFormData.customSubject}
                        onChange={(e) => setEditFormData({ ...editFormData, customSubject: e.target.value })}
                        className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f47c20]/20 focus:border-[#f47c20] transition-all"
                      />
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="font-semibold"
                  disabled={isSubmitting}
                >
                  Hủy
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  className="bg-primary text-white font-semibold"
                  disabled={isSubmitting}
                >
                  Lưu thay đổi
                </PrimaryButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Xem Chi tiết Hồ sơ Người dùng */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[740px] max-h-[90vh] p-5 rounded-3xl overflow-y-auto">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-lg font-bold text-[#f47c20] flex items-center gap-2">
                <Eye size={22} weight="bold" />
                <span>Thông tin chi tiết tài khoản</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Hồ sơ thông tin cá nhân, bằng cấp trình độ và quyền hạn trên hệ thống ClassRoom.
              </DialogDescription>
            </DialogHeader>
            {detailUser && (
              <div className="py-2 space-y-3 font-sans text-slate-800">
                {/* Header Card với Avatar */}
                <div className="flex items-center gap-4 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <Avatar className="w-14 h-14 border-2 border-[#f47c20] shadow-sm shrink-0">
                    <AvatarImage src={detailUser.avatar || ""} />
                    <AvatarFallback className="bg-[#f47c20] text-white font-black text-lg">
                      {detailUser.name.split(" ").map(n => n[0]).slice(-2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 text-base uppercase tracking-wide truncate">
                      {detailUser.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{detailUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Chip size="sm" variant="soft" className={detailUser.role === "Giáo viên" ? "bg-blue-50 text-blue-700 border-blue-200 font-bold" : "bg-slate-100 text-slate-700 font-medium"}>
                        {detailUser.role} {detailUser.subject ? `(${detailUser.subject})` : ""}
                      </Chip>
                      <Chip
                        size="sm"
                        variant="soft"
                        className={
                          detailUser.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                            : detailUser.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                              : "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                        }
                      >
                        {detailUser.status === "Active" ? "Hoạt động" : detailUser.status === "Pending" ? "Chờ phê duyệt" : "Đang khóa"}
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Grid 6 trường Chi tiết (3 cột giúp giảm chiều cao) */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Giới tính</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {detailUser.gender || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Ngày sinh (DOB)</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {detailUser.dob || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Số điện thoại / Zalo</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {detailUser.phone || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Bằng cấp / Trình độ</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {detailUser.degree || (detailUser.role === "Giáo viên" ? "Đại học Sư phạm" : "Chưa cập nhật")}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Môn học chuyên môn</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {detailUser.subject || "Chưa chọn môn"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Ngày đăng ký tham gia</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {detailUser.createdAt || "---"}
                    </span>
                  </div>
                </div>

                {/* Bio Card */}
                <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
                  <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Giới thiệu bản thân (Bio)</span>
                  <p className="font-semibold text-slate-700 text-xs leading-relaxed italic">
                    {detailUser.bio || "Chưa có thông tin giới thiệu bản thân."}
                  </p>
                </div>
              </div>
            )}

            {/* DialogFooter */}
            <DialogFooter className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-1">
              {detailUser?.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleRejectUser(detailUser);
                    }}
                    className="px-4 py-2 rounded-xl font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle size={16} weight="bold" />
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleApproveUser(detailUser);
                    }}
                    className="px-4 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all text-xs shadow-xs cursor-pointer border-none flex items-center gap-1.5"
                  >
                    <CheckCircle size={16} weight="bold" />
                    Phê duyệt kích hoạt
                  </button>
                </>
              )}
              <PrimaryButton
                type="button"
                variant="outline"
                onClick={() => setShowDetailDialog(false)}
                className="font-semibold text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Đóng
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cookie-style Confirm Dialog */}
        <CustomConfirmDialog
          isOpen={confirmDialog.isOpen}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          actionType={confirmDialog.actionType}
          onConfirm={confirmDialog.onConfirm}
        />
      </div>

      {/* DATA TABLE */}
      <div className="mt-4">
        <Table>
          <Table.ScrollContainer className="min-h-[400px]">
            <Table.Content
              aria-label="Danh sách người dùng"
              className="min-w-[950px]"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              selectionBehavior="toggle"
              sortDescriptor={sortDescriptor}
              onSelectionChange={setSelectedKeys}
              onSortChange={setSortDescriptor}
            >
              <Table.Header>
                <Table.Column className="after:hidden" id="selection">
                  <Checkbox aria-label="Select all" slot="selection">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Column>
                <Table.Column allowsSorting isRowHeader className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="stt">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      STT
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="name">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      Thành viên
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="phone">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      Số điện thoại
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="role">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      Vai trò
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="createdAt">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      Ngày đăng ký
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="status">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      Trạng thái
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column className="after:hidden text-end text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="actions">
                  Hành động
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {isLoading && filteredAndSortedUsers.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Table.Row key={`skeleton-${i}`} id={`skeleton-${i}`}>
                      <Table.Cell className="pr-0">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                      </Table.Cell>
                      <Table.Cell>
                        <Skeleton className="h-4 w-6" />
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-3 py-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Skeleton className="h-4 w-24" />
                      </Table.Cell>
                      <Table.Cell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </Table.Cell>
                      <Table.Cell>
                        <Skeleton className="h-4 w-20" />
                      </Table.Cell>
                      <Table.Cell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : filteredAndSortedUsers.length === 0 ? (
                  <Table.Row key="empty" id="empty">
                    <Table.Cell className="pr-0" />
                    <Table.Cell />
                    <Table.Cell>
                      <div className="py-10 opacity-0 pointer-events-none w-[200px]">.</div>
                      <div className="absolute inset-x-0 flex justify-center items-center text-slate-500 font-medium pointer-events-none" style={{ top: 0, bottom: 0 }}>
                        Không tìm thấy người dùng phù hợp
                      </div>
                    </Table.Cell>
                    <Table.Cell />
                    <Table.Cell />
                    <Table.Cell />
                    <Table.Cell />
                    <Table.Cell />
                  </Table.Row>
                ) : (
                  paginatedItems.map((user, idx) => {
                    const index = (page - 1) * ROWS_PER_PAGE + idx;
                    const isLocked = user.status === "Locked";
                    const isPending = user.status === "Pending";
                    const statusColorMap: Record<string, "success" | "danger" | "warning"> = {
                      Active: "success",
                      Locked: "danger",
                      Pending: "warning",
                    };
                    const initials = user.name.split(" ").map(n => n[0]).slice(-2).join("").toUpperCase();

                    return (
                      <Table.Row key={user._id} id={user._id}>
                        <Table.Cell>
                          <Checkbox aria-label={`Select ${user.name}`} slot="selection" variant="secondary">
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>
                        <Table.Cell
                          className="font-medium text-slate-500 cursor-pointer"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleOpenDetail(user);
                          }}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          #{index + 1}
                        </Table.Cell>
                        <Table.Cell
                          className="cursor-pointer"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleOpenDetail(user);
                          }}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 shrink-0 bg-primary text-white border border-slate-100 shadow-sm">
                              <AvatarImage src={user.avatar || ""} />
                              <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-[15px] hover:text-[#f47c20] transition-colors">
                                {user.name}
                              </span>
                              <span className="text-sm font-medium text-slate-500 mt-0.5">{user.email}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell
                          className="cursor-pointer"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleOpenDetail(user);
                          }}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          {user.phone ? (
                            <span className="text-xs font-semibold text-slate-700">
                              {user.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal italic">Chưa cập nhật</span>
                          )}
                        </Table.Cell>
                        <Table.Cell
                          className="cursor-pointer"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleOpenDetail(user);
                          }}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          {user.role === "Admin" ? (
                            <Chip size="sm" variant="soft" className="bg-red-50 text-red-600 font-semibold border border-red-200">
                              Admin
                            </Chip>
                          ) : user.role === "Giáo viên" ? (
                            <Chip size="sm" variant="soft" className="bg-blue-50 text-blue-600 font-semibold border border-blue-200">
                              Giáo viên {user.subject ? `(${user.subject})` : ""}
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="soft" className="bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              Học sinh
                            </Chip>
                          )}
                        </Table.Cell>
                        <Table.Cell
                          className="text-xs font-medium text-slate-500 whitespace-nowrap cursor-pointer"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleOpenDetail(user);
                          }}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          {user.createdAt || "---"}
                        </Table.Cell>
                        <Table.Cell
                          className="cursor-pointer"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            if (isPending) {
                              setPendingApprovalUser(user);
                            } else {
                              handleOpenDetail(user);
                            }
                          }}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          {isPending ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingApprovalUser(user);
                              }}
                              title="Nhấp để Phê duyệt hoặc Từ chối tài khoản"
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20 font-bold text-xs shadow-[0_0_10px_rgba(244,124,32,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              </span>
                              <span className="uppercase tracking-wide">Chờ phê duyệt</span>
                            </button>
                          ) : (
                            <Chip color={statusColorMap[user.status]} size="sm" variant="soft" className="font-medium">
                              {user.status === "Active" ? "Hoạt động" : "Đang khóa"}
                            </Chip>
                          )}
                        </Table.Cell>
                        <Table.Cell
                          onClick={(e: any) => e.stopPropagation()}
                          onPointerDown={(e: any) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5 relative">
                            {isPending ? (
                              <>
                                <PrimaryButton
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                  title="Phê duyệt tài khoản"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveUser(user);
                                  }}
                                >
                                  <CheckCircle size={16} weight="bold" />
                                </PrimaryButton>
                                <PrimaryButton
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                  title="Từ chối tài khoản"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectUser(user);
                                  }}
                                >
                                  <XCircle size={16} weight="bold" />
                                </PrimaryButton>
                              </>
                            ) : (
                              <ActionMenu
                                isLocked={isLocked}
                                isAdmin={user.role === "Admin"}
                                onEdit={() => handleOpenEdit(user)}
                                onRoleChange={() => handleOpenChangeRole(user)}
                                onResetPassword={() => handleOpenResetPassword(user)}
                                onToggleStatus={() => handleToggleStatus(user)}
                                onDelete={() => handleDeleteUser(user)}
                              />
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer>
            {totalPages > 0 && (
              <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-transparent">
                <Pagination.Summary className="text-sm text-slate-500 font-medium">
                  Hiển thị {startIdx} đến {endIdx} trong số {filteredAndSortedUsers.length} kết quả
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page === 1}
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <Pagination.PreviousIcon />
                      Trang trước
                    </Pagination.Previous>
                  </Pagination.Item>
                  {pages.map((p) => (
                    <Pagination.Item key={p}>
                      <Pagination.Link
                        isActive={p === page}
                        onPress={() => setPage(p)}
                        className={p === page ? "bg-primary text-white font-bold border-primary" : "text-slate-600 font-medium hover:bg-slate-100"}
                      >
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page === totalPages}
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Trang sau
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            )}
          </Table.Footer>
        </Table>
      </div>

      {/* Dialog Phê duyệt Người dùng Pending */}
      {pendingApprovalUser && (
        <Dialog open={!!pendingApprovalUser} onOpenChange={(open) => !open && setPendingApprovalUser(null)}>
          <PendingUserApprovalModal
            user={pendingApprovalUser}
            onClose={() => setPendingApprovalUser(null)}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
          />
        </Dialog>
      )}
    </div>
  );
}
