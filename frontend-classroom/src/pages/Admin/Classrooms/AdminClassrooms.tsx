import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import type { 
  ColumnDef as ColumnDefType 
} from "@tanstack/react-table";
import { 
  Plus, 
  Funnel,
  GraduationCap,
  CheckCircle,
  PauseCircle,
  Users,
  LockKey,
  Trash,
  X,
  MagnifyingGlass
} from "phosphor-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "../../../components/Styles/ToastContext";

import { classroomService, type IClassroomItem } from "../../../service/classroom.service";

export default function AdminClassrooms() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useToast();
  
  const [classes, setClasses] = useState<IClassroomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<IClassroomItem | null>(null);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await classroomService.getAdminClassrooms();
      if (res.data) setClasses(res.data);
    } catch (error: any) {
      toast.error("Không thể tải danh sách lớp học", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDeleteClass = async (id: string, name: string) => {
    try {
      await classroomService.deleteClassroom(id);
      toast.success(`Đã xóa lớp học ${name} khỏi hệ thống!`, 3000);
      fetchClasses();
    } catch (error: any) {
      toast.error("Lỗi khi xóa: " + error.message, 3000);
    }
  };

  const handleLockClass = async (id: string, name: string, isLocked: boolean) => {
    try {
      await classroomService.updateClassroomStatus(id, isLocked ? 'Active' : 'Locked');
      toast.success(`Đã ${isLocked ? 'mở khóa' : 'khóa'} lớp học ${name}!`, 3000);
      fetchClasses();
    } catch (error: any) {
      toast.error("Lỗi khi cập nhật: " + error.message, 3000);
    }
  };

  // Column Definitions
  const columns: ColumnDefType<IClassroomItem>[] = [
    {
      accessorKey: "name",
      header: "Tên lớp học & Mã lớp",
      cell: ({ row }) => {
        const cls = row.original;
        // Determine icon color based on status for visual flair
        let iconBg = "bg-blue-100";
        let iconColor = "text-blue-600";
        if (cls.status === "Locked") { iconBg = "bg-red-100"; iconColor = "text-red-600"; }
        
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
              <GraduationCap size={20} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">{cls.name}</span>
              <span className="text-xs text-slate-500 font-medium">{cls.id}</span>
            </div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const nameMatch = row.original.name.toLowerCase().includes(value.toLowerCase());
        const idMatch = row.original.id.toLowerCase().includes(value.toLowerCase());
        return nameMatch || idMatch;
      },
    },
    {
      accessorKey: "teacher",
      header: "Giáo viên phụ trách",
      cell: ({ row }) => {
        const teacher = row.original.teacher;
        return (
          <Link 
            to={`/admin/teachers`} 
            className="flex items-center gap-2 hover:underline text-blue-600 decoration-blue-300 transition-all"
            onClick={(e) => e.stopPropagation()} // Prevent row click
          >
            <Avatar className="h-7 w-7 border border-slate-100">
              <AvatarImage src={teacher.avatar} alt={teacher.name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{teacher.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{teacher.name}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "students",
      header: "Sĩ số",
      cell: ({ row }) => <span className="font-semibold text-slate-700">{row.original.studentCount} HS</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => <span className="text-slate-600 font-medium text-sm">{new Date(row.original.createdAt).toLocaleDateString("vi-VN")}</span>,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (status === "Active") {
          return (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Đang hoạt động
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Đã khóa
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "" || row.getValue(id) === value;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full">Can thiệp</div>,
      cell: ({ row }) => {
        const cls = row.original;
        const isViolation = cls.status === "Locked";
        
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-8 w-8 transition-colors ${isViolation ? 'border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700' : 'text-slate-500 hover:text-slate-800'}`}
                  title={isViolation ? "Mở khóa lớp học" : "Khóa lớp học"}
                >
                  <LockKey size={16} weight="bold" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{isViolation ? "Mở khóa lớp học này?" : "Khóa lớp học này?"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isViolation 
                      ? <>Lớp <strong>{cls.name}</strong> sẽ được mở lại bình thường.</>
                      : <>Lớp <strong>{cls.name}</strong> sẽ bị tạm ngưng và giáo viên/học sinh không thể truy cập vào bài tập được nữa.</>
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction className="bg-orange-600 hover:bg-orange-700" onClick={() => handleLockClass(cls._id, cls.name, isViolation)}>Đồng ý</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  title="Xóa lớp học"
                >
                  <Trash size={16} weight="bold" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                    <Trash size={20} weight="bold" /> 
                    Cảnh báo xóa dữ liệu
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-700 font-medium">
                    Hành động này không thể hoàn tác, bạn có chắc chắn muốn xóa lớp học <strong>{cls.name}</strong> này ra khỏi hệ thống vĩnh viễn? Mọi dữ liệu điểm số, bài tập sẽ bị mất.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-semibold">Hủy bỏ</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700 font-bold" onClick={() => handleDeleteClass(cls._id, cls.name)}>
                    Đồng ý Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: classes,
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
    <div className="flex h-full min-h-screen bg-[#fafafa]">
      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col gap-6 p-4 md:p-6 transition-all duration-300 ${selectedClass ? 'md:pr-[380px]' : ''}`}>
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl tracking-tight font-bold text-slate-900">Quản lý lớp học hệ thống</h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Giám sát và quản trị tất cả các hoạt động đào tạo trên toàn hệ thống.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-gray-100 bg-white">
            <CardContent className="p-4 relative">
              <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <GraduationCap size={20} weight="fill" />
              </div>
              <div className="absolute top-4 right-4 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-0.5 rounded">
                +12%
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng số lớp học</p>
              <h3 className="text-3xl font-extrabold text-slate-900">1,248</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100 bg-white">
            <CardContent className="p-4 relative">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle size={20} weight="fill" />
              </div>
              <div className="absolute top-4 right-4 text-emerald-600 text-xs font-bold">
                94%
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đang hoạt động</p>
              <h3 className="text-3xl font-extrabold text-slate-900">1,173</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100 bg-white">
            <CardContent className="p-4 relative">
              <div className="w-10 h-10 rounded-md bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <PauseCircle size={20} weight="fill" />
              </div>
              <div className="absolute top-4 right-4 text-red-600 text-xs font-bold">
                75
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lớp bị khóa</p>
              <h3 className="text-3xl font-extrabold text-slate-900">6.1%</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100 bg-white">
            <CardContent className="p-4 relative">
              <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center mb-4">
                <Users size={20} weight="fill" />
              </div>
              <div className="absolute top-4 right-4 text-slate-500 text-xs font-bold">
                Avg. 32
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Học sinh/lớp</p>
              <h3 className="text-3xl font-extrabold text-slate-900">39,936</h3>
            </CardContent>
          </Card>
        </div>

        {/* TABLE TOOLBAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm lớp học hoặc mã lớp..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 bg-white shadow-sm border-slate-200"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto bg-white gap-2 border-slate-200 shadow-sm text-slate-600 font-semibold">
                  <Funnel size={16} weight="bold" />
                  Trạng thái {table.getColumn("status")?.getFilterValue() ? `: ${table.getColumn("status")?.getFilterValue()}` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("Active")}>Đang hoạt động</DropdownMenuItem>
                <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("Locked")}>Đã khóa</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue("")} className="font-bold text-slate-500">Tất cả trạng thái</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 overflow-hidden">
          <Tabs defaultValue="all" className="w-full pt-2">
            <div className="px-4 border-b border-slate-100 flex justify-between items-center bg-white h-12">
              <TabsList className="bg-transparent border-b border-transparent h-auto p-0 flex justify-start gap-6">
                <TabsTrigger value="all" className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm">Tất cả</TabsTrigger>
                <TabsTrigger value="it" className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-500 font-semibold text-sm bg-transparent border-transparent">Công nghệ thông tin</TabsTrigger>
                <TabsTrigger value="lang" className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-500 font-semibold text-sm bg-transparent border-transparent">Ngoại ngữ</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-slate-50/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b-slate-200 hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow 
                      key={row.id} 
                      className={`border-b-slate-100 cursor-pointer transition-colors ${selectedClass?.id === row.original.id ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'hover:bg-slate-50/80'}`}
                      onClick={() => setSelectedClass(row.original)}
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
                    <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500 font-medium">
                      {isLoading ? "Đang tải dữ liệu..." : "Không tìm thấy kết quả nào."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* PAGINATION */}
          <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-white mt-auto">
            <p className="text-sm text-slate-500 font-medium">
              Hiển thị {table.getRowModel().rows?.length} trên tổng {table.getFilteredRowModel().rows.length} kết quả
            </p>
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

      {/* RIGHT SIDEBAR - XEM NHANH */}
      {selectedClass && (
        <div className="hidden md:flex w-[360px] bg-white border-l border-slate-200 fixed right-0 top-0 bottom-0 flex-col z-[150] shadow-2xl animate-in slide-in-from-right-8">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="font-bold text-slate-900 text-lg">Xem nhanh lớp học</h3>
            <button onClick={() => setSelectedClass(null)} className="text-slate-400 hover:text-slate-800 p-1.5 rounded hover:bg-slate-100 transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            <div className={`h-40 rounded-xl border flex items-center justify-center ${selectedClass.status === 'Locked' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
              <GraduationCap size={56} weight="duotone" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedClass.name}</h2>
              <p className={`text-sm font-semibold flex items-center gap-1.5 ${selectedClass.status === 'Locked' ? 'text-red-600' : 'text-blue-600'}`}>
                Trạng thái: {selectedClass.status === 'Locked' ? 'Đã khóa' : 'Đang hoạt động'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chủ đề bài giảng hiện tại</h4>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-sm mb-1">Quản lý State với Context API và Hooks</p>
                <p className="text-xs text-slate-500 font-medium">Bắt đầu lúc: 08:30 - Kết thúc: 10:30</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hoạt động mới nhất</h4>
              
              <div className="relative pl-5 border-l-2 border-slate-100 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <p className="text-sm font-semibold text-slate-800 mb-1">5 học sinh vừa nộp bài tập "Hooks Practice"</p>
                  <p className="text-xs text-slate-400 font-medium">2 phút trước</p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-white" />
                  <p className="text-sm font-semibold text-slate-800 mb-1">Giáo viên đã cập nhật tài liệu buổi 12</p>
                  <p className="text-xs text-slate-400 font-medium">15 phút trước</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-6 flex flex-col gap-3">
              <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-6 shadow-sm">
                Vào xem trực tiếp
              </Button>
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 font-semibold py-6 shadow-sm">
                Tải báo cáo lớp học
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
