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
  SpinnerGap,
  Trash,
} from "phosphor-react";

import { Button } from "@/components/ui/button";
import { AnimatedAddButton } from "@/components/ui/AnimatedAddButton";
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
import { ActionMenu } from "@/components/ui/ActionMenu";
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

// Định nghĩa User type dùng trong table (có thêm _id để gọi API)
export type User = {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Giáo viên" | "Học sinh";
  status: "Active" | "Locked";
};

// Chuyển từ IUserItem (API) sang User (table)
const mapApiToUser = (item: IUserItem): User => ({
  _id: item._id,
  name: item.name,
  email: item.email,
  role: roleToVi(item.role),
  status: item.status,
});

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table States
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    if (globalFilter) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        u.email.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleToVi(roleFilter));
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === (statusFilter === "Active" ? "Active" : "Locked"));
    }

    return filtered.sort((a, b) => {
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
  const ROWS_PER_PAGE = 8;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher" as "teacher" | "student",
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

  // Handler: Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "Active" ? "Locked" : "Active";
    try {
      await userService.updateUserStatus(user._id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
      );
      toast.success(
        `${newStatus === "Locked" ? "Đã khóa" : "Đã mở khóa"} tài khoản ${user.name}`,
        3000
      );
    } catch (error: any) {
      toast.error(error.message || "Cập nhật trạng thái thất bại", 3000);
    }
  };

  // Handler: Xóa tài khoản
  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${user.name}? Hành động này không thể hoàn tác.`)) {
      try {
        await userService.deleteUser(user._id);
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        toast.success(`Đã xóa tài khoản ${user.name}`, 3000);
      } catch (error: any) {
        toast.error(error.message || "Xóa tài khoản thất bại", 3000);
      }
    }
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

    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${idsToDelete.length} tài khoản đã chọn? Hành động này không thể hoàn tác.`)) {
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

  // Handler: Đóng hộp thoại Tạo người dùng (có cảnh báo nếu chưa lưu)
  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      if (formData.name.trim() || formData.email.trim() || formData.password.trim()) {
        if (window.confirm("Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn đóng hộp thoại và hủy bỏ?")) {
          setShowDialog(false);
          setFormData({ name: "", email: "", password: "", role: "teacher" });
        }
      } else {
        setShowDialog(false);
        setFormData({ name: "", email: "", password: "", role: "teacher" });
      }
    } else {
      setShowDialog(true);
    }
  };

  // Handler: Tạo tài khoản mới (Giáo viên hoặc Học sinh)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let response;
      if (formData.role === "teacher") {
        response = await authService.createTeacher({
          name: formData.name,
          email: formData.email,
          password: formData.password,
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
      setFormData({ name: "", email: "", password: "", role: "teacher" });
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo tài khoản!", 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed @tanstack/react-table setup. Using direct HeroUI table rendering instead.

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1400px] mx-auto bg-[#fafafa] min-h-screen">

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
                    ? `: ${statusFilter === "Active" ? "Hoạt động" : "Đang khóa"}`
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

          {selectedCount > 0 && (
            <Button
              variant="destructive"
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold flex items-center gap-2 px-4 py-2 h-auto"
              onClick={handleDeleteMultipleUsers}
            >
              <Trash size={16} weight="bold" />
              Xóa {selectedCount} tài khoản
            </Button>
          )}
        </div>

        {/* Dialog Thêm người dùng */}
        <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <AnimatedAddButton className="w-full md:w-auto shadow-sm">
              Thêm giáo viên
            </AnimatedAddButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">Thêm người dùng mới</DialogTitle>
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-slate-700">
                    Mật khẩu khởi tạo
                  </Label>
                  <HeroInput
                    id="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseDialog(false)}
                  className="font-semibold"
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <SpinnerGap size={16} className="animate-spin" />
                      Đang tạo...
                    </span>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetDialog(false)}
                  className="font-semibold"
                  disabled={isResetting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white font-semibold"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <span className="flex items-center gap-2">
                      <SpinnerGap size={16} className="animate-spin" />
                      Đang xử lý...
                    </span>
                  ) : (
                    "Xác nhận"
                  )}
                </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRoleDialog(false)}
                  className="font-semibold"
                  disabled={isChangingRole}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white font-semibold"
                  disabled={isChangingRole}
                >
                  {isChangingRole ? (
                    <span className="flex items-center gap-2">
                      <SpinnerGap size={16} className="animate-spin" />
                      Đang cập nhật...
                    </span>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* DATA TABLE */}
      <div className="mt-4">
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Danh sách người dùng"
              className="min-w-[800px]"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
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
                <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="role">
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      Vai trò
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
                  <Table.Row key="loading" id="loading">
                    <Table.Cell className="pr-0" />
                    <Table.Cell />
                    <Table.Cell>
                      <div className="flex items-center gap-3 text-slate-400 py-10">
                        <SpinnerGap size={24} className="animate-spin text-primary" />
                        <span className="font-medium">Đang tải...</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell />
                    <Table.Cell />
                    <Table.Cell />
                  </Table.Row>
                ) : filteredAndSortedUsers.length === 0 ? (
                  <Table.Row key="empty" id="empty">
                    <Table.Cell className="pr-0" />
                    <Table.Cell />
                    <Table.Cell>
                      <div className="py-10 text-slate-500 font-medium">
                        Không tìm thấy kết quả nào.
                      </div>
                    </Table.Cell>
                    <Table.Cell />
                    <Table.Cell />
                    <Table.Cell />
                  </Table.Row>
                ) : (
                  paginatedItems.map((user, idx) => {
                    const index = (page - 1) * ROWS_PER_PAGE + idx;
                    const isLocked = user.status === "Locked";
                    const statusColorMap: Record<string, "success" | "danger" | "warning"> = {
                      Active: "success",
                      Locked: "danger",
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
                        <Table.Cell className="font-medium text-slate-500">
                          #{index + 1}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-3">
                            <HeroAvatar size="sm" className="bg-primary text-white border border-slate-100 shadow-sm">
                              <HeroAvatar.Fallback className="text-xs font-semibold">{initials}</HeroAvatar.Fallback>
                            </HeroAvatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-[15px]">{user.name}</span>
                              <span className="text-sm font-medium text-slate-500 mt-0.5">{user.email}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {user.role === "Admin" ? (
                            <Chip size="sm" variant="soft" className="bg-red-50 text-red-600 font-semibold border border-red-200">
                              Admin
                            </Chip>
                          ) : user.role === "Giáo viên" ? (
                            <Chip size="sm" variant="soft" className="bg-blue-50 text-blue-600 font-semibold border border-blue-200">
                              Giáo viên
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="soft" className="bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              Học sinh
                            </Chip>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Chip color={statusColorMap[user.status]} size="sm" variant="soft" className="font-medium">
                            {user.status === "Active" ? "Hoạt động" : "Đang khóa"}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center justify-end gap-1 relative">
                            <ActionMenu
                              isLocked={isLocked}
                              onRoleChange={() => handleOpenChangeRole(user)}
                              onResetPassword={() => handleOpenResetPassword(user)}
                              onToggleStatus={() => handleToggleStatus(user)}
                              onDelete={() => handleDeleteUser(user)}
                            />
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
                      <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
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
    </div>
  );
}
