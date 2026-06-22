import React, { useState, useEffect, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
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
} from "phosphor-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useToast();

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

  // Column Definitions
  const columns: ColumnDef<User>[] = [
    {
      id: "stt",
      header: "STT",
      cell: ({ row }) => (
        <span className="text-slate-500 font-medium text-sm">
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Họ và tên",
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.name
          .split(" ")
          .map((n) => n[0])
          .slice(-2)
          .join("")
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
              <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">{user.name}</span>
            </div>
          </div>
        );
      },
      filterFn: (row, _id, value) => {
        const nameMatch = row.original.name
          .toLowerCase()
          .includes(value.toLowerCase());
        const emailMatch = row.original.email
          .toLowerCase()
          .includes(value.toLowerCase());
        return nameMatch || emailMatch;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        if (role === "Admin")
          return (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              Admin
            </Badge>
          );
        if (role === "Giáo viên")
          return (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              Giáo viên
            </Badge>
          );
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
            Học sinh
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (status === "Active") {
          return (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1.5 px-2.5 py-0.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Hoạt động
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-200 gap-1.5 px-2.5 py-0.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Đang khóa
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "" || row.getValue(id) === value;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full">Hành động</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isLocked = user.status === "Locked";
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-slate-100"
                >
                  <span className="sr-only">Mở menu</span>
                  <DotsThree size={20} weight="bold" className="text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 font-medium text-slate-700"
                  onClick={() => handleOpenChangeRole(user)}
                >
                  <ShieldStar size={16} /> Đổi quyền
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 font-medium text-slate-700"
                  onClick={() => handleOpenResetPassword(user)}
                >
                  <Key size={16} /> Reset mật khẩu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={`cursor-pointer gap-2 font-bold focus:bg-${isLocked ? "emerald" : "red"}-50 ${isLocked
                    ? "text-emerald-600 focus:text-emerald-700"
                    : "text-red-600 focus:text-red-700"
                    }`}
                  onClick={() => handleToggleStatus(user)}
                >
                  {isLocked ? (
                    <>
                      <LockKeyOpen size={16} /> Mở khóa tài khoản
                    </>
                  ) : (
                    <>
                      <LockKey size={16} /> Khóa tài khoản
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 font-bold text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={() => handleDeleteUser(user)}
                >
                  Xóa tài khoản
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "auto",
  });

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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Tìm kiếm theo tên / email..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 bg-white shadow-sm border-slate-200"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-auto bg-white gap-2 border-slate-200 shadow-sm text-slate-600 font-semibold"
              >
                <Funnel size={16} weight="bold" />
                Vai trò{" "}
                {table.getColumn("role")?.getFilterValue()
                  ? `: ${table.getColumn("role")?.getFilterValue()}`
                  : ""}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem
                onClick={() => table.getColumn("role")?.setFilterValue("Admin")}
              >
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("role")?.setFilterValue("Giáo viên")
                }
              >
                Giáo viên
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("role")?.setFilterValue("Học sinh")
                }
              >
                Học sinh
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => table.getColumn("role")?.setFilterValue("")}
                className="font-bold text-slate-500"
              >
                Tất cả vai trò
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-auto bg-white gap-2 border-slate-200 shadow-sm text-slate-600 font-semibold"
              >
                <Funnel size={16} weight="bold" />
                Trạng thái{" "}
                {table.getColumn("status")?.getFilterValue()
                  ? `: ${table.getColumn("status")?.getFilterValue() === "Active"
                    ? "Hoạt động"
                    : "Đang khóa"
                  }`
                  : ""}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue("Active")
                }
              >
                Hoạt động
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue("Locked")
                }
              >
                Đang khóa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => table.getColumn("status")?.setFilterValue("")}
                className="font-bold text-slate-500"
              >
                Tất cả trạng thái
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dialog Thêm người dùng */}
        <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold shadow-sm w-full md:w-auto">
              <Plus size={16} weight="bold" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Thêm người dùng mới
                </DialogTitle>
                <DialogDescription>
                  Nhập thông tin để cấp tài khoản giáo viên hoặc học sinh.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Vai trò</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={formData.role === "teacher" ? "default" : "outline"}
                      className="flex-1 font-semibold"
                      onClick={() => setFormData({ ...formData, role: "teacher" })}
                    >
                      Giáo viên
                    </Button>
                    <Button
                      type="button"
                      variant={formData.role === "student" ? "default" : "outline"}
                      className="flex-1 font-semibold"
                      onClick={() => setFormData({ ...formData, role: "student" })}
                    >
                      Học sinh
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-slate-700">
                    Họ và tên
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ví dụ: nva@school.edu.vn"
                    required
                    autoComplete="off"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-slate-700">
                    Mật khẩu khởi tạo
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
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
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col mt-2">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b-slate-200"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 h-auto"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <SpinnerGap size={32} className="animate-spin text-primary" />
                    <span className="font-medium">Đang tải dữ liệu...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/80 cursor-default border-b-slate-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-slate-500 font-medium"
                >
                  Không tìm thấy kết quả nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-white">
          <div className="text-sm text-slate-500 font-medium">
            Hiển thị {table.getRowModel().rows?.length} trên tổng{" "}
            {table.getFilteredRowModel().rows.length} người dùng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-slate-600 font-semibold"
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-slate-600 font-semibold"
            >
              Trang tiếp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
