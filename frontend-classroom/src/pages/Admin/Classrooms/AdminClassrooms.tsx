import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Checkbox,
  Chip
} from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Skeleton } from "@/components/ui/skeleton";
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
  MagnifyingGlass,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "phosphor-react";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import { CustomConfirmDialog } from "@/components/ui/CustomConfirmDialog";

import { classroomService, type IClassroomItem, type IClassroomActivities } from "../../../service/classroom.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { StudentsTable } from "../../../components/ui/StudentsTable";
import { attendanceService } from "../../../service/attendance.service";
import type { Student } from "../../../utils/mockDb";
import { getMockStudents } from "../../../utils/mockDb";

export default function AdminClassrooms() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const toast = useToast();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  const [classes, setClasses] = useState<IClassroomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<IClassroomItem | null>(null);
  const [classActivities, setClassActivities] = useState<IClassroomActivities | null>(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const handleOpenStudentsModal = async (classId: string) => {
    setIsStudentsModalOpen(true);
    setIsLoadingStudents(true);
    try {
      const res = await attendanceService.getClassroomStudents(classId);
      if (res && res.data) {
        const list = res.data.map((s: any) => ({
          _id: s._id,
          name: s.name,
          email: s.email,
          parentPhone: s.parentPhone || "Không có",
          studentCode: s.studentCode || `HS-${s._id.substring(0, 4)}`,
        })) as any[];
        setClassStudents(list);
      }
    } catch (err) {
      console.warn("Không thể tải danh sách học sinh từ API, dùng mock:", err);
      const list = getMockStudents(classId);
      setClassStudents(list);
    } finally {
      setIsLoadingStudents(false);
    }
  };

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

  useEffect(() => {
    if (selectedClass) {
      const fetchActivities = async () => {
        setIsLoadingActivities(true);
        try {
          const res = await classroomService.getAdminClassroomActivities(selectedClass._id);
          if (res.data) {
            setClassActivities(res.data);
          }
        } catch (error) {
          console.error("Lỗi khi tải hoạt động", error);
          setClassActivities(null);
        } finally {
          setIsLoadingActivities(false);
        }
      };
      fetchActivities();
    } else {
      setClassActivities(null);
    }
  }, [selectedClass]);

  // Compute stats from classes array
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'Active').length;
  const lockedClasses = classes.filter(c => c.status === 'Locked').length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const avgStudents = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

  const activePercentage = totalClasses > 0 ? Math.round((activeClasses / totalClasses) * 100) : 0;
  const lockedPercentage = totalClasses > 0 ? Math.round((lockedClasses / totalClasses) * 100) : 0;

  const uniqueSubjects = React.useMemo(() => {
    const subjects = new Set<string>();
    classes.forEach(c => {
      if (c.subject) subjects.add(c.subject);
    });
    return Array.from(subjects).sort();
  }, [classes]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await classroomService.getAdminClassrooms();
      if (res.data) setClasses(res.data);
    } catch (error: any) {
      toast.error("Không thể tải danh sách lớp học", 3000);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = React.useMemo(() => {
    let result = classes;
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(lowerFilter) || c.id.toLowerCase().includes(lowerFilter));
    }
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }
    if (subjectFilter && subjectFilter !== 'all') {
      result = result.filter(c => c.subject === subjectFilter);
    }
    return result;
  }, [classes, globalFilter, statusFilter, subjectFilter]);

  const totalPages = Math.ceil(filteredClasses.length / ROWS_PER_PAGE);
  const paginatedClasses = React.useMemo(() => {
    const startIdx = (page - 1) * ROWS_PER_PAGE;
    return filteredClasses.slice(startIdx, startIdx + ROWS_PER_PAGE);
  }, [page, filteredClasses]);

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all") {
      return filteredClasses.map(c => c._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, filteredClasses]);

  const handleDeleteClass = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cảnh báo xóa dữ liệu",
      description: `Lớp học ${name} cùng toàn bộ điểm số, bài tập và danh sách học sinh sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await classroomService.deleteClassroom(id);
          toast.success(`Đã xóa lớp học ${name} khỏi hệ thống!`, 3000);
          fetchClasses();
        } catch (error: any) {
          toast.error("Lỗi khi xóa: " + error.message, 3000);
        }
      }
    });
  };

  const handleLockClass = (id: string, name: string, isLocked: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: isLocked ? "Mở khóa lớp học này?" : "Khóa lớp học này?",
      description: isLocked
        ? `Lớp ${name} sẽ được mở lại bình thường.`
        : `Lớp ${name} sẽ bị tạm ngưng và giáo viên/học sinh không thể truy cập vào bài tập được nữa.`,
      actionType: isLocked ? 'success' : 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await classroomService.updateClassroomStatus(id, isLocked ? 'Active' : 'Locked');
          toast.success(`Đã ${isLocked ? 'mở khóa' : 'khóa'} lớp học ${name}!`, 3000);
          fetchClasses();
        } catch (error: any) {
          toast.error("Lỗi khi cập nhật: " + error.message, 3000);
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: "Cảnh báo xóa nhiều lớp",
      description: `Bạn sắp xóa vĩnh viễn ${selectedIds.length} lớp học cùng toàn bộ dữ liệu liên quan. Hành động này không thể hoàn tác.`,
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await Promise.all(selectedIds.map(id => classroomService.deleteClassroom(id)));
          toast.success(`Đã xóa ${selectedIds.length} lớp học thành công!`, 3000);
          setSelectedKeys(new Set());
          fetchClasses();
        } catch (error: any) {
          toast.error("Lỗi khi xóa hàng loạt: " + error.message, 3000);
        }
      }
    });
  };

  const handleBulkLock = () => {
    if (selectedIds.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: "Khóa nhiều lớp học?",
      description: `Bạn có chắc chắn muốn khóa ${selectedIds.length} lớp học đã chọn? Các lớp này sẽ bị tạm ngưng.`,
      actionType: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await Promise.all(selectedIds.map(id => classroomService.updateClassroomStatus(id, 'Locked')));
          toast.success(`Đã khóa ${selectedIds.length} lớp học!`, 3000);
          setSelectedKeys(new Set());
          fetchClasses();
        } catch (error: any) {
          toast.error("Lỗi khi cập nhật hàng loạt: " + error.message, 3000);
        }
      }
    });
  };



  return (
    <div className="flex h-full min-h-screen bg-[#fafafa]">
      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col gap-6 p-4 md:p-6 transition-all duration-300 ${selectedClass ? 'md:pr-[380px]' : ''}`}>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl tracking-tight font-bold text-slate-900">Quản lý lớp học </h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Giám sát và quản trị tất cả các hoạt động đào tạo trên toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số lớp học</CardTitle>
              <GraduationCap className="h-5 w-5 text-blue-500" weight="duotone" />
            </CardHeader>
            <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-20 mb-4" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tighter">{totalClasses.toLocaleString()}</div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                    Trên toàn hệ thống <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Cập nhật tự động
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-500" weight="duotone" />
            </CardHeader>
            <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-20 mb-4" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tighter">{activeClasses.toLocaleString()}</div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                    Chiếm {activePercentage}% <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Tỷ lệ lớp học đang mở
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lớp bị khóa</CardTitle>
              <PauseCircle className="h-5 w-5 text-red-500" weight="duotone" />
            </CardHeader>
            <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-20 mb-4" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tighter">{lockedClasses.toLocaleString()}</div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none text-red-500">
                    Chiếm {lockedPercentage}% <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Cần được xem xét lại
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng học sinh</CardTitle>
              <Users className="h-5 w-5 text-orange-500" weight="duotone" />
            </CardHeader>
            <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-20 mb-4" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tighter">{totalStudents.toLocaleString()}</div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                    Trung bình {avgStudents} HS/lớp <ArrowUpRight className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Đang tham gia các lớp
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BULK ACTION TOOLBAR */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 mb-2">
            <span className="text-sm font-medium text-blue-800">
              Đã chọn <strong className="text-blue-900 text-base mx-1">{selectedIds.length}</strong> lớp học
            </span>
            <div className="flex items-center gap-3">
              <PrimaryButton 
                className="bg-orange-100 text-orange-600 hover:bg-orange-200 font-medium flex items-center gap-2 h-9 border-none shadow-none"
                onClick={handleBulkLock}
              >
                <LockKey weight="bold" size={16} />
                Khóa các lớp đã chọn
              </PrimaryButton>
              <PrimaryButton 
                className="bg-rose-100 text-rose-600 hover:bg-rose-200 font-medium flex items-center gap-2 h-9 border-none shadow-none" 
                onClick={handleBulkDelete}
              >
                <Trash weight="bold" size={16} />
                Xóa các lớp đã chọn
              </PrimaryButton>
            </div>
          </div>
        )}

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
                <PrimaryButton variant="outline" className="w-full md:w-auto bg-white gap-2 border-slate-200 shadow-sm text-slate-600 font-semibold">
                  <Funnel size={16} weight="bold" />
                  Trạng thái {statusFilter ? `: ${statusFilter === "Active" ? "Đang hoạt động" : "Đã khóa"}` : ""}
                </PrimaryButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                <DropdownMenuItem onClick={() => setStatusFilter("Active")}>Đang hoạt động</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Locked")}>Đã khóa</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("")} className="font-bold text-slate-500">Tất cả trạng thái</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 overflow-hidden">
          <Tabs value={subjectFilter} className="w-full pt-2" onValueChange={setSubjectFilter}>
            <div className="px-4 border-b border-slate-100 flex justify-between items-center bg-white h-12 overflow-x-auto">
              <TabsList className="bg-transparent border-b border-transparent h-auto p-0 flex justify-start gap-6">
                <TabsTrigger value="all" className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm">Tất cả</TabsTrigger>
                {uniqueSubjects.map(sub => (
                  <TabsTrigger key={sub} value={sub} className="rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-500 font-semibold text-sm bg-transparent border-transparent">
                    {sub}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="overflow-x-auto flex-1 h-full flex flex-col">
            <Table>
              <Table.ScrollContainer className="max-h-[calc(100vh-320px)] overflow-scroll flex-1 min-h-[400px]">
                <Table.Content
                  selectedKeys={selectedKeys}
                  selectionMode="multiple"
                  onSelectionChange={setSelectedKeys}
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
                    <Table.Column className="after:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="name">Tên lớp học & Mã lớp</Table.Column>
                    <Table.Column className="after:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="teacher">Giáo viên phụ trách</Table.Column>
                    <Table.Column className="after:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="subject">Bộ môn</Table.Column>
                    <Table.Column className="after:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="students">Sĩ số</Table.Column>
                    <Table.Column className="after:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="createdAt">Ngày tạo</Table.Column>
                    <Table.Column className="after:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="status">Trạng thái</Table.Column>
                    <Table.Column className="after:hidden text-end text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap border-b border-slate-200" id="actions">Hành động</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {isLoading ? (
                      <Table.Row key="loading" id="loading">
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell>
                          <div className="py-10 text-slate-500 font-medium">Đang tải dữ liệu...</div>
                        </Table.Cell>
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                      </Table.Row>
                    ) : paginatedClasses.length === 0 ? (
                      <Table.Row key="empty" id="empty">
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell>
                          <div className="py-10 text-slate-500 font-medium">Không tìm thấy kết quả nào.</div>
                        </Table.Cell>
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                      </Table.Row>
                    ) : (
                      paginatedClasses.map((cls) => (
                        <Table.Row key={cls._id} id={cls._id}>
                          <Table.Cell className="py-4 border-b border-slate-100">
                            <Checkbox aria-label={`Select ${cls.name}`} slot="selection">
                              <Checkbox.Content>
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Content>
                            </Checkbox>
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100 cursor-pointer" onClick={() => setSelectedClass(cls)}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.status === "Locked" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                <GraduationCap size={20} weight="fill" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{cls.name}</span>
                                <span className="text-xs text-slate-500 font-medium">{cls.id}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100 cursor-pointer" onClick={() => setSelectedClass(cls)}>
                            <Link
                              to={`/admin/teachers`}
                              className="flex items-center gap-2 hover:underline text-blue-600 decoration-blue-300 transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Avatar className="h-7 w-7 border border-slate-100">
                                <AvatarImage src={cls.teacher.avatar} alt={cls.teacher.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{cls.teacher.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-sm">{cls.teacher.name}</span>
                            </Link>
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100 cursor-pointer" onClick={() => setSelectedClass(cls)}>
                            <span className="font-semibold text-slate-700">{cls.subject}</span>
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100 cursor-pointer" onClick={() => setSelectedClass(cls)}>
                            <span className="font-semibold text-slate-700">{cls.studentCount} HS</span>
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100 cursor-pointer" onClick={() => setSelectedClass(cls)}>
                            <span className="text-slate-600 font-medium text-sm">{new Date(cls.createdAt).toLocaleDateString("vi-VN")}</span>
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100 cursor-pointer" onClick={() => setSelectedClass(cls)}>
                            {cls.status === "Active" ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Đang hoạt động
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Đã khóa
                              </Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell className="py-4 border-b border-slate-100">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <PrimaryButton
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                title="Xem chi tiết lớp học"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClass(cls);
                                }}
                              >
                                <Eye size={16} weight="bold" />
                              </PrimaryButton>
                              <PrimaryButton
                                variant="outline"
                                size="icon"
                                className={`h-8 w-8 transition-colors ${cls.status === 'Locked' ? 'border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700' : 'text-slate-500 hover:text-slate-800'}`}
                                title={cls.status === 'Locked' ? "Mở khóa lớp học" : "Khóa lớp học"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockClass(cls._id, cls.name, cls.status === 'Locked');
                                }}
                              >
                                <LockKey size={16} weight="bold" />
                              </PrimaryButton>
                              <PrimaryButton
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                title="Xóa lớp học"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClass(cls._id, cls.name);
                                }}
                              >
                                <Trash size={16} weight="bold" />
                              </PrimaryButton>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>
                {totalPages > 0 && (
                  <Pagination size="sm" className="flex items-center justify-between w-full px-4 py-3 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                    <Pagination.Summary className="text-sm text-slate-500 font-medium">
                      Hiển thị {paginatedClasses.length} trên tổng {filteredClasses.length} kết quả
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
            <div className={`h-40 rounded-xl border flex items-center justify-center ${selectedClass.status === 'Locked' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
              <GraduationCap size={56} weight="duotone" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedClass.name}</h2>
              <p className={`text-sm font-semibold flex items-center gap-1.5 ${selectedClass.status === 'Locked' ? 'text-red-600' : 'text-orange-600'}`}>
                Trạng thái: {selectedClass.status === 'Locked' ? 'Đã khóa' : 'Đang hoạt động'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chủ đề bài giảng hiện tại</h4>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                {isLoadingActivities ? (
                  <p className="font-bold text-slate-500 text-sm mb-1">Đang tải...</p>
                ) : (
                  <p className="font-bold text-slate-800 text-sm mb-1">{classActivities?.currentTopic || "Chưa có dữ liệu"}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hoạt động mới nhất</h4>

              <div className="relative pl-5 border-l-2 border-slate-100 space-y-6">
                {isLoadingActivities ? (
                  <p className="text-sm text-slate-500">Đang tải...</p>
                ) : classActivities?.recentActivities && classActivities.recentActivities.length > 0 ? (
                  classActivities.recentActivities.map((activity, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${activity.type === 'assignment_created' ? 'bg-orange-500' : 'bg-blue-600'}`} />
                      <p className="text-sm font-semibold text-slate-800 mb-1">{activity.content}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(activity.time).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chưa có hoạt động nào.</p>
                )}
              </div>
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <PrimaryButton
                onClick={() => handleOpenStudentsModal(selectedClass._id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 shadow-sm"
              >
                Xem danh sách học sinh
              </PrimaryButton>
              <PrimaryButton className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 shadow-sm">
                Vào xem trực tiếp
              </PrimaryButton>
              <PrimaryButton variant="outline" className="w-full border-slate-200 text-slate-700 font-semibold py-6 shadow-sm">
                Tải báo cáo lớp học
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Students Modal */}
      <Dialog open={isStudentsModalOpen} onOpenChange={setIsStudentsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Danh sách học sinh - {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Xem danh sách các học sinh đang tham gia vào lớp học này. (Chế độ xem - Chỉ giáo viên mới có quyền chỉnh sửa)
            </DialogDescription>
          </DialogHeader>
          {isLoadingStudents ? (
            <div className="py-10 text-center text-slate-500">Đang tải danh sách học sinh...</div>
          ) : (
            <StudentsTable
              students={classStudents}
              readOnly={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Confirm Dialog */}
      <CustomConfirmDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        actionType={confirmDialog.actionType}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
