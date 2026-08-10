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
import type { Selection, SortDescriptor } from "@heroui/react";
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
  Eye,
  CalendarBlank,
  XCircle,
  Clock
} from "phosphor-react";

import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
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
import { CustomConfirmDialog } from "@/components/ui/Dialogs/CustomConfirmDialog";

import { classroomService, type IClassroomItem, type IClassroomActivities } from "../../../service/classroom.service";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { StudentsTable } from "../../../components/ui/Tables/StudentsTable";
import { attendanceService } from "../../../service/attendance.service";
import type { Student } from "../../../utils/mockDb";
import { getMockStudents } from "../../../utils/mockDb";

import type { ITeacherClassroom } from "../../../service/classroom.service";
import { useNavigate } from "react-router-dom";

const ClassDetailModalContent = ({
  classItem,
  onClose,
  onEnter,
  onApprove,
  onReject
}: {
  classItem: IClassroomItem;
  onClose: () => void;
  onEnter: () => void;
  onApprove?: (id: string, name: string) => void;
  onReject?: (id: string, name: string) => void;
}) => {
  const [details, setDetails] = useState<ITeacherClassroom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await classroomService.getClassroomDetail(classItem._id);
        if (isMounted && res.data) {
          setDetails(res.data);
        }
      } catch (err) {
        console.error("Error fetching classroom details for modal", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [classItem._id]);

  return (
    <DialogContent className="!max-w-[850px] sm:max-w-[850px] md:max-w-[900px] w-[95vw] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl [&>button]:hover:bg-[#f47c20] [&>button]:hover:text-white [&>button]:transition-colors [&>button]:cursor-pointer">
      {/* STANDARD HEADER */}
      <DialogHeader className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f47c20]/10 flex items-center justify-center text-[#f47c20]">
            <GraduationCap size={24} weight="duotone" />
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#f47c20] px-2 py-0.5 rounded-md text-white shadow-sm">
                {classItem.subject || "Khóa học"}
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">#{classItem.id}</span>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              {classItem.name}
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      {/* COMPACT BODY - 3 COLUMN GRID */}
      <div className="px-6 pb-6 pt-2 bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#f47c20] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Đang tải dữ liệu chi tiết...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-slate-100">

            {/* COL 1: TEACHER & STATUS */}
            <div className="col-span-3 sm:col-span-1 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center h-[88px]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#2f8fa3]/5 rounded-bl-full -z-0 opacity-100"></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2f8fa3]"></div>
                  Giáo viên phụ trách
                </h4>
                <div className="flex items-center gap-3 relative z-10">
                  <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                    <AvatarImage src={classItem.teacher?.avatar} />
                    <AvatarFallback className="bg-gradient-to-tr from-[#2f8fa3] to-[#1c6575] text-white font-bold">{classItem.teacher?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden flex-1">
                    <p className="font-bold text-slate-800 text-[13px] truncate leading-tight">{classItem.teacher?.name}</p>
                    <p className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5" title={(classItem.teacher as any)?.email}>{(classItem.teacher as any)?.email || "Chưa cập nhật email"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between h-[72px]">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</h4>
                  <p className="text-[12px] font-bold text-slate-600">
                    {classItem.status === "Active" ? "Hoạt động" : classItem.status === "Pending" ? "Chờ phê duyệt" : "Đã khóa"}
                  </p>
                </div>
                {classItem.status === "Active" ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                    <CheckCircle size={16} weight="fill" />
                    <span className="text-[12px] font-bold">Đang mở</span>
                  </div>
                ) : classItem.status === "Pending" ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-600">
                    <Clock size={16} weight="fill" />
                    <span className="text-[12px] font-bold">Chờ duyệt</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
                    <PauseCircle size={16} weight="fill" />
                    <span className="text-[12px] font-bold">Đã khóa</span>
                  </div>
                )}
              </div>
            </div>

            {/* COL 2: CORE STATS (Students, Approvals) */}
            <div className="col-span-3 sm:col-span-1 flex flex-col gap-4">
              <div className="bg-gradient-to-br from-[#f47c20]/5 to-[#f47c20]/10 p-4 rounded-xl border border-[#f47c20]/20 shadow-sm flex items-center justify-between h-[88px]">
                <div>
                  <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
                    {classItem.studentCount || 0}
                  </p>
                  <p className="text-[10px] font-black text-[#f47c20]/90 uppercase tracking-widest">Học sinh tham gia</p>
                </div>
                <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-[#f47c20] border border-[#f47c20]/10">
                  <Users size={22} weight="fill" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between h-[72px]">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yêu cầu chờ duyệt</h4>
                  <p className="text-[12px] font-bold text-slate-600">Học sinh xin vào lớp</p>
                </div>
                <div className={`flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg font-bold text-[13px] ${details?.pendingRequestsCount && details.pendingRequestsCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                  {details?.pendingRequestsCount || 0}
                </div>
              </div>
            </div>

            {/* COL 3: ACADEMIC STATS (Grades, Latest Assignment, Date) */}
            <div className="col-span-3 sm:col-span-1 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-[88px]">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A9d6e5]"></div>
                  Hoạt động gần nhất
                </h4>
                <p className="text-[13px] font-bold text-slate-800 truncate" title={details?.latestAssignmentTitle || "Chưa có bài tập nào"}>
                  {details?.latestAssignmentTitle || "Chưa có bài tập/hoạt động"}
                </p>
                {details?.latestAssignmentDue && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">
                    Hạn: {new Date(details.latestAssignmentDue).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 h-[72px]">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-xl font-black text-[#2f8fa3] leading-none mb-1">{details?.pendingGrades || 0}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bài chờ chấm</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-[13px] font-black text-slate-700 leading-none mb-1.5">
                    {new Date(classItem.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4">
          <p className="text-[11px] text-slate-400 font-semibold hidden sm:block">Dữ liệu chi tiết &bull; Dành cho Quản trị viên</p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {classItem.status === 'Pending' && onApprove && onReject ? (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onReject(classItem._id, classItem.name);
                  }}
                  className="px-4 py-2 rounded-lg font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle size={16} weight="bold" />
                  Từ chối
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onApprove(classItem._id, classItem.name);
                  }}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 border border-emerald-600 hover:bg-emerald-700 transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={16} weight="bold" />
                  Phê duyệt lớp
                </button>
              </>
            ) : null}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-[#f47c20] hover:text-white hover:border-[#f47c20] transition-colors text-sm shadow-sm cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

const PendingClassApprovalModal = ({
  classItem,
  onClose,
  onApprove,
  onReject
}: {
  classItem: IClassroomItem;
  onClose: () => void;
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
}) => {
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
                Yêu cầu duyệt lớp học
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">#{classItem.id}</span>
            </div>
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight leading-tight">
              {classItem.name}
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
            <span className="font-bold text-amber-950 text-sm block mb-0.5">Lớp học đang chờ Ban giám hiệu phê duyệt</span>
            <p className="text-amber-800/90 leading-relaxed">
              Giáo viên đã khởi tạo lớp học này và đang chờ Admin xét duyệt. Bạn có thể chọn <strong className="text-emerald-700">Phê duyệt</strong> để đưa lớp học vào hoạt động hoặc <strong className="text-rose-700">Từ chối</strong> yêu cầu tạo lớp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Bộ môn</span>
            <p className="font-bold text-slate-800 text-sm">{classItem.subject || "Khác"}</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Ngày khởi tạo</span>
            <p className="font-bold text-slate-800 text-sm">
              {new Date(classItem.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Giáo viên phụ trách</span>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
              <AvatarImage src={classItem.teacher?.avatar} />
              <AvatarFallback className="bg-gradient-to-tr from-[#2f8fa3] to-[#1c6575] text-white font-bold">
                {classItem.teacher?.name?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-bold text-slate-800 text-sm truncate">{classItem.teacher?.name}</p>
              <p className="text-xs text-slate-500 font-medium truncate">{(classItem.teacher as any)?.email || "Chưa cập nhật email"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-sm shadow-sm cursor-pointer"
          >
            Đóng
          </button>

          <button
            onClick={() => onReject(classItem._id, classItem.name)}
            className="px-4 py-2.5 rounded-xl font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <XCircle size={18} weight="bold" />
            Từ chối lớp học
          </button>

          <button
            onClick={() => onApprove(classItem._id, classItem.name)}
            className="px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-600 border border-emerald-600 hover:bg-emerald-700 transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle size={18} weight="bold" />
            Phê duyệt lớp học
          </button>
        </div>
      </div>
    </DialogContent>
  );
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

export default function AdminClassrooms() {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const toast = useToast();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);

  const [classes, setClasses] = useState<IClassroomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<IClassroomItem | null>(null);
  const [pendingApprovalClass, setPendingApprovalClass] = useState<IClassroomItem | null>(null);
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

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  useEffect(() => {
    fetchClasses();

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('admin_stats_update', () => {
      console.log('🔄 [Socket.io] Có thay đổi trạng thái lớp, đang tải lại...');
      fetchClasses();
    });

    socket.on('teacher_classrooms_update', () => {
      fetchClasses();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredAndSortedClasses = React.useMemo(() => {
    let result = classes;
    if (globalFilter) {
      const normalizedFilter = normalizeString(globalFilter);
      result = result.filter(c =>
        normalizeString(c.name).includes(normalizedFilter) ||
        normalizeString(c.id).includes(normalizedFilter)
      );
    }
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }
    if (subjectFilter && subjectFilter !== 'all') {
      result = result.filter(c => c.subject === subjectFilter);
    }

    return result.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;

      let first: any;
      let second: any;
      if (sortDescriptor.column === "teacher") {
        first = a.teacher?.name || "";
        second = b.teacher?.name || "";
      } else {
        first = (a as any)[sortDescriptor.column] || "";
        second = (b as any)[sortDescriptor.column] || "";
      }
      let cmp = String(first).localeCompare(String(second), "vi", { numeric: true });
      if (sortDescriptor.direction === "descending") {
        cmp *= -1;
      }
      return cmp;
    });
  }, [classes, globalFilter, statusFilter, subjectFilter, sortDescriptor]);

  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredAndSortedClasses.length / ROWS_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const startIdx = (page - 1) * ROWS_PER_PAGE + 1;
  const endIdx = Math.min(page * ROWS_PER_PAGE, filteredAndSortedClasses.length);

  useEffect(() => {
    setPage(1);
  }, [globalFilter, statusFilter, subjectFilter]);

  const paginatedClasses = React.useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredAndSortedClasses.slice(start, start + ROWS_PER_PAGE);
  }, [page, filteredAndSortedClasses]);

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all") {
      return filteredAndSortedClasses.map(c => c._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, filteredAndSortedClasses]);

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

  const handleApproveClass = (id: string, name: string) => {
    setPendingApprovalClass(null);
    setConfirmDialog({
      isOpen: true,
      title: "Phê duyệt lớp học",
      description: `Bạn có chắc chắn muốn duyệt lớp học "${name}"? Sau khi duyệt, giáo viên và học sinh có thể bắt đầu truy cập hoạt động.`,
      actionType: 'success',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await classroomService.updateClassroomStatus(id, 'Active');
          toast.success(`Đã phê duyệt lớp học ${name} thành công!`, 3000);
          fetchClasses();
        } catch (error: any) {
          toast.error("Lỗi khi duyệt: " + error.message, 3000);
        }
      }
    });
  };

  const handleRejectClass = (id: string, name: string) => {
    setPendingApprovalClass(null);
    setConfirmDialog({
      isOpen: true,
      title: "Từ chối lớp học này?",
      description: `Bạn có chắc chắn muốn từ chối lớp học "${name}"? Yêu cầu tạo lớp sẽ bị hủy và thông báo từ chối sẽ được gửi đến giáo viên phụ trách.`,
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await classroomService.deleteClassroom(id);
          toast.success(`Đã từ chối lớp học ${name}!`, 3000);
          fetchClasses();
        } catch (error: any) {
          toast.error("Lỗi khi từ chối: " + error.message, 3000);
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
    <div className="flex w-full bg-[#F8FAFC]">
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-6 transition-all duration-300">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl tracking-tight font-bold text-[#f47c20]">Quản lý lớp học</h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Giám sát và quản trị tất cả các hoạt động đào tạo trên toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Tổng số lớp học */}
          <div className="flex flex-col justify-between rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 bg-gradient-to-br from-[#E0F7FA]/80 via-[#E0F7FA]/40 to-[#B2EBF2]/30 border border-[#B2EBF2]/50">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#006064]">Tổng số lớp học</p>
              {isLoading ? (
                <div className="mt-3">
                  <Skeleton className="h-9 w-20 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">
                    {totalClasses.toLocaleString()}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/95 shadow-sm flex items-center justify-center text-[#2f8fa3]">
                    <GraduationCap size={24} weight="bold" />
                  </div>
                </div>
              )}
            </div>
            {!isLoading && (
              <div className="mt-4 pt-2 border-t border-[#006064]/10">
                <div className="flex items-center gap-1 text-[#00838F] font-bold text-xs">
                  <ArrowUpRight size={14} weight="bold" />
                  <span>Trên toàn hệ thống</span>
                </div>
                <p className="text-[11px] font-semibold text-[#006064]/60 mt-0.5">Cập nhật tự động</p>
              </div>
            )}
          </div>

          {/* Card 2: Lớp đang hoạt động */}
          <div className="flex flex-col justify-between rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 bg-gradient-to-br from-[#FFF8E1]/80 via-[#FFF8E1]/40 to-[#FFE0B2]/30 border border-[#FFE0B2]/50">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#E65100]">Đang hoạt động</p>
              {isLoading ? (
                <div className="mt-3">
                  <Skeleton className="h-9 w-20 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">
                    {activeClasses.toLocaleString()}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/95 shadow-sm flex items-center justify-center text-[#f47c20]">
                    <CheckCircle size={24} weight="bold" />
                  </div>
                </div>
              )}
            </div>
            {!isLoading && (
              <div className="mt-4 pt-2 border-t border-[#E65100]/10">
                <div className="flex items-center gap-1 text-[#EF6C00] font-bold text-xs">
                  <ArrowUpRight size={14} weight="bold" />
                  <span>Chiếm {activePercentage}%</span>
                </div>
                <p className="text-[11px] font-semibold text-[#E65100]/60 mt-0.5">Tỷ lệ lớp học đang mở</p>
              </div>
            )}
          </div>

          {/* Card 3: Lớp bị khóa */}
          <div className="flex flex-col justify-between rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 bg-gradient-to-br from-[#E8F5E9]/80 via-[#E8F5E9]/40 to-[#E0F2F1]/30 border border-[#C8E6C9]/50">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#004D40]">Lớp bị khóa</p>
              {isLoading ? (
                <div className="mt-3">
                  <Skeleton className="h-9 w-20 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">
                    {lockedClasses.toLocaleString()}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/95 shadow-sm flex items-center justify-center text-[#00796B]">
                    <PauseCircle size={24} weight="bold" />
                  </div>
                </div>
              )}
            </div>
            {!isLoading && (
              <div className="mt-4 pt-2 border-t border-[#004D40]/10">
                <div className="flex items-center gap-1 text-[#00695C] font-bold text-xs">
                  <ArrowDownRight size={14} weight="bold" />
                  <span>Chiếm {lockedPercentage}%</span>
                </div>
                <p className="text-[11px] font-semibold text-[#004D40]/60 mt-0.5">Cần được xem xét lại</p>
              </div>
            )}
          </div>

          {/* Card 4: Tổng học sinh */}
          <div className="flex flex-col justify-between rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 bg-gradient-to-br from-[#FFEBEE]/80 via-[#FFEBEE]/40 to-[#FFCCBC]/30 border border-[#FFCDD2]/50">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#BF360C]">Tổng học sinh</p>
              {isLoading ? (
                <div className="mt-3">
                  <Skeleton className="h-9 w-20 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">
                    {totalStudents.toLocaleString()}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/95 shadow-sm flex items-center justify-center text-[#D84315]">
                    <Users size={24} weight="bold" />
                  </div>
                </div>
              )}
            </div>
            {!isLoading && (
              <div className="mt-4 pt-2 border-t border-[#BF360C]/10">
                <div className="flex items-center gap-1 text-[#D84315] font-bold text-xs">
                  <ArrowUpRight size={14} weight="bold" />
                  <span>Trung bình {avgStudents} HS/lớp</span>
                </div>
                <p className="text-[11px] font-semibold text-[#BF360C]/60 mt-0.5">Đang tham gia các lớp</p>
              </div>
            )}
          </div>
        </div>

        {/* BULK ACTION TOOLBAR */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-[#f47c20]/10 border border-[#f47c20]/20 px-4 py-3 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 mb-2">
            <span className="text-sm font-medium text-[#f47c20]">
              Đã chọn <strong className="text-[#f47c20] text-base mx-1">{selectedIds.length}</strong> lớp học
            </span>
            <div className="flex items-center gap-3">
              <PrimaryButton
                className="bg-[#f47c20]/20 text-[#f47c20] hover:bg-[#f47c20]/30 font-medium flex items-center gap-2 h-9 border-none shadow-none"
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
                  Trạng thái {statusFilter ? `: ${statusFilter === "Active" ? "Đang hoạt động" : statusFilter === "Pending" ? "Chờ duyệt" : "Đã khóa"}` : ""}
                </PrimaryButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                <DropdownMenuItem onClick={() => setStatusFilter("Active")}>Đang hoạt động</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>Chờ duyệt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Locked")}>Đã khóa</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("")} className="font-bold text-slate-500">Tất cả trạng thái</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PrimaryButton variant="outline" className="w-full md:w-auto bg-white gap-2 border-slate-200 shadow-sm text-slate-600 font-semibold">
                  <Funnel size={16} weight="bold" />
                  Bộ môn {subjectFilter && subjectFilter !== 'all' ? `: ${subjectFilter}` : ""}
                </PrimaryButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                <DropdownMenuItem onClick={() => setSubjectFilter("all")} className="font-bold text-slate-500">Tất cả bộ môn</DropdownMenuItem>
                <DropdownMenuSeparator />
                {uniqueSubjects.map(sub => (
                  <DropdownMenuItem key={sub} onClick={() => setSubjectFilter(sub)}>{sub}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-2">

          <Table>
            <Table.ScrollContainer className="min-h-[400px]">
              <Table.Content
                aria-label="Danh sách lớp học"
                className="min-w-[800px]"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                onSelectionChange={setSelectedKeys}
                onSortChange={setSortDescriptor}
                onRowAction={(key) => {
                  const cls = paginatedClasses.find((c) => c._id === key);
                  if (cls) setSelectedClass(cls);
                }}
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
                        Tên lớp học & Mã lớp
                      </Table.SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="teacher">
                    {({ sortDirection }) => (
                      <Table.SortableColumnHeader sortDirection={sortDirection}>
                        Giáo viên phụ trách
                      </Table.SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="subject">
                    {({ sortDirection }) => (
                      <Table.SortableColumnHeader sortDirection={sortDirection}>
                        Bộ môn
                      </Table.SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="studentCount">
                    {({ sortDirection }) => (
                      <Table.SortableColumnHeader sortDirection={sortDirection}>
                        Sĩ số
                      </Table.SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="createdAt">
                    {({ sortDirection }) => (
                      <Table.SortableColumnHeader sortDirection={sortDirection}>
                        Ngày tạo
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
                  {isLoading ? (
                    <Table.Row key="loading" id="loading">
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell>
                        <div className="flex flex-col items-center justify-center py-10">
                          <div className="w-8 h-8 border-4 border-[#2f8fa3] border-t-transparent rounded-full animate-spin"></div>
                          <p className="mt-3 text-sm text-slate-500 font-medium">Đang tải dữ liệu chi tiết...</p>
                        </div>
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
                    paginatedClasses.map((cls, idx) => {
                      const index = (page - 1) * ROWS_PER_PAGE + idx;
                      return (
                        <Table.Row key={cls._id} id={cls._id}>
                          <Table.Cell className="py-3">
                            <Checkbox aria-label={`Select ${cls.name}`} slot="selection" variant="secondary">
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
                          <Table.Cell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls.status === "Locked" ? "bg-[#f47c20]/10 text-[#f47c20]" : "bg-[#2f8fa3]/10 text-[#2f8fa3]"}`}>
                                <GraduationCap size={18} weight="fill" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 text-[15px]">{cls.name}</span>
                                <span className="text-xs text-slate-500 font-medium">{cls.id}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="py-3">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Avatar className="h-7 w-7 border border-slate-100">
                                <AvatarImage src={cls.teacher.avatar} alt={cls.teacher.name} />
                                <AvatarFallback className="bg-[#2f8fa3]/10 text-[#2f8fa3] text-xs font-bold">{cls.teacher.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-sm">{cls.teacher.name}</span>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="py-3">
                            <span className="font-semibold text-slate-700">{cls.subject}</span>
                          </Table.Cell>
                          <Table.Cell className="py-3">
                            <span className="font-semibold text-slate-700">{cls.studentCount} HS</span>
                          </Table.Cell>
                          <Table.Cell className="py-3">
                            <span className="text-slate-600 font-medium text-sm">{new Date(cls.createdAt).toLocaleDateString("vi-VN")}</span>
                          </Table.Cell>
                          <Table.Cell className="py-3">
                            {cls.status === "Pending" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingApprovalClass(cls);
                                }}
                                title="Nhấp để Duyệt hoặc Từ chối lớp học"
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20 font-bold text-xs shadow-[0_0_10px_rgba(244,124,32,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              >
                                <span className="flex h-2.5 w-2.5 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <span className="uppercase tracking-wide">Chờ duyệt</span>
                              </button>
                            ) : (
                              <Chip color={cls.status === "Active" ? "success" : "danger"} size="sm" variant="soft" className="font-medium">
                                {cls.status === "Active" ? "Hoạt động" : "Đã khóa"}
                              </Chip>
                            )}
                          </Table.Cell>
                          <Table.Cell className="py-3">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {cls.status === 'Pending' ? (
                                <>
                                  <PrimaryButton
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                    title="Phê duyệt lớp học"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveClass(cls._id, cls.name);
                                    }}
                                  >
                                    <CheckCircle size={16} weight="bold" />
                                  </PrimaryButton>
                                  <PrimaryButton
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                    title="Từ chối lớp học"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectClass(cls._id, cls.name);
                                    }}
                                  >
                                    <XCircle size={16} weight="bold" />
                                  </PrimaryButton>
                                </>
                              ) : (
                                <>
                                  <PrimaryButton
                                    variant="outline"
                                    size="icon"
                                    className={`h-8 w-8 transition-colors ${cls.status === 'Locked' ? 'border-[#f47c20]/20 text-[#f47c20] hover:bg-[#f47c20]/5 hover:text-[#f47c20]' : 'text-slate-500 hover:text-slate-800'}`}
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
                                </>
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
                    Hiển thị {startIdx} đến {endIdx} trong số {filteredAndSortedClasses.length} kết quả
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
                          className={p === page ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
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

      {/* Class Details Modal */}
      {selectedClass && (
        <Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
          <ClassDetailModalContent
            classItem={selectedClass}
            onClose={() => setSelectedClass(null)}
            onEnter={() => navigate(`/classrooms/${selectedClass._id}`)}
            onApprove={handleApproveClass}
            onReject={handleRejectClass}
          />
        </Dialog>
      )}

      {/* Pending Class Approval Modal */}
      {pendingApprovalClass && (
        <Dialog open={!!pendingApprovalClass} onOpenChange={(open) => !open && setPendingApprovalClass(null)}>
          <PendingClassApprovalModal
            classItem={pendingApprovalClass}
            onClose={() => setPendingApprovalClass(null)}
            onApprove={handleApproveClass}
            onReject={handleRejectClass}
          />
        </Dialog>
      )}

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
