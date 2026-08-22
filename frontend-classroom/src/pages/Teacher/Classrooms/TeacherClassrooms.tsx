import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Users, PencilSimple, CaretDown, Check, ClipboardText, BookOpen, MagnifyingGlass, Funnel, CheckSquare, Clock, SquaresFour, List, PushPin, Archive, Trash, UserPlus, XCircle, CheckCircle } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { io } from "socket.io-client";
import { useNavigate, Link } from "react-router-dom";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { ShineButton } from "../../../components/ui/Buttons/ShineButton";
import ViewModeSwitch from "../../../components/ui/Buttons/ViewModeSwitch";
import { useAuth } from "../../../context/AuthContext";
import styles from "./TeacherClassrooms.module.scss";
import { Table, Pagination, Checkbox, Button } from "@heroui/react";
import { SmartSearchBar, type SearchSuggestionItem } from "../../../components/ui/Inputs/SmartSearchBar";
import { DropdownFilter } from "../../../components/ui/Dropdowns/DropdownFilter";
import type { Selection } from "@heroui/react";
import { ClassroomActionMenu } from "../../../components/ui/ActionMenus/ClassroomActionMenu";
import { ManageStudentsModal } from "../../../components/ui/Dialogs/ManageStudentsModal";
import { checkTeacherProfileComplete } from "../../../utils/profileChecker";
import { ProfileWarningModal } from "../../../components/ui/Dialogs/ProfileWarningModal";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../../components/ui/alert-dialog";
import { Checkbox as ApprovalCheckbox } from "../../../components/ui/checkbox";

const SUBJECT_OPTIONS = [
  { value: "Toán học", emoji: "🔢", color: "#3b82f6" },
  { value: "Vật lý", emoji: "⚡", color: "#f59e0b" },
  { value: "Hóa học", emoji: "🧪", color: "#10b981" },
  { value: "Ngữ văn", emoji: "📖", color: "#8b5cf6" },
  { value: "Tiếng Anh", emoji: "🌍", color: "#06b6d4" },
  { value: "Lịch sử", emoji: "🏛️", color: "#d97706" },
  { value: "Địa lý", emoji: "🗺️", color: "#16a34a" },
  { value: "Sinh học", emoji: "🌱", color: "#84cc16" },
  { value: "Tin học", emoji: "💻", color: "#6366f1" },
];

const capitalizeWords = (str: string) => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const removeAccents = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

export default function TeacherClassrooms() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<ITeacherClassroom[]>([]);
  const [schedules, setSchedules] = useState<ISchedule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classToArchive, setClassToArchive] = useState<ITeacherClassroom | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // Modal duyệt & Thêm học sinh state
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedClassForPending, setSelectedClassForPending] = useState<ITeacherClassroom | null>(null);
  const [modalTab, setModalTab] = useState<'pending' | 'add_existing' | 'create_new'>('pending');

  // Default to grid view
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = "Chào ngày mới";
    if (hour >= 5 && hour < 11) timeGreeting = "Chào buổi sáng";
    else if (hour >= 11 && hour < 14) timeGreeting = "Chào buổi trưa";
    else if (hour >= 14 && hour < 18) timeGreeting = "Chào buổi chiều";
    else timeGreeting = "Chào buổi tối";

    const titleText = user?.gender === "Female" ? "cô" : "thầy";
    const rawName = user?.name || '';
    const formattedName = rawName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${timeGreeting}, ${titleText === 'cô' ? 'Cô' : 'Thầy'} ${formattedName}!`;
  }, [user]);

  const activeClassesCount = useMemo(() => {
    return classrooms.filter(c => c.status === 'Active').length;
  }, [classrooms]);

  const archivedOrClosedClassesCount = useMemo(() => {
    return classrooms.filter(c => c.status === 'Archived' || c.status === 'Closed').length;
  }, [classrooms]);

  const totalStudentsCount = useMemo(() => {
    return classrooms.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  }, [classrooms]);

  const todaySchedules = useMemo(() => {
    const currentJSday = new Date().getDay();
    const todayDayOfWeek = currentJSday === 0 ? 7 : currentJSday;
    const todayScheds = schedules.filter(s => {
      const clsId = s.classId?._id || s.classId;
      return s.dayOfWeek === todayDayOfWeek && classrooms.some(c => c._id === clsId && c.status !== 'Archived');
    });
    return todayScheds.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, classrooms]);

  const todaySchedulesText = useMemo(() => {
    if (!todaySchedules.length) return "Hôm nay không có ca dạy nào.";
    return todaySchedules
      .map(s => {
        const clsName = s.classId?.name || "Lớp học";
        return `${s.startTime} ${clsName}`;
      })
      .join(", ");
  }, [todaySchedules]);

  // Table selection & pagination state
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 9;

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('teacherPinnedClasses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePin = (e: React.MouseEvent | null, id: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPinnedIds(prev => {
      const isPinned = prev.includes(id);
      const newPinned = isPinned ? prev.filter(pId => pId !== id) : [...prev, id];
      localStorage.setItem('teacherPinnedClasses', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const [newClass, setNewClass] = useState({ className: "", subject: (user as any)?.subject || "Toán học", requireApproval: true });

  useEffect(() => {
    if ((user as any)?.subject) {
      setNewClass(prev => ({ ...prev, subject: (user as any).subject }));
    }
  }, [(user as any)?.subject]);

  const selectedSubject = SUBJECT_OPTIONS.find(o => o.value === newClass.subject) || { value: newClass.subject, emoji: "📚", color: "#64748b" };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchSuggestions = useMemo<SearchSuggestionItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const qNormalized = removeAccents(searchQuery.toLowerCase().trim());
    return classrooms
      .filter(cls => {
        const nameNormalized = removeAccents(cls.name.toLowerCase());
        const codeNormalized = removeAccents((cls.code || "").toLowerCase());
        return nameNormalized.includes(qNormalized) || codeNormalized.includes(qNormalized);
      })
      .slice(0, 5)
      .map(cls => ({
        id: cls._id,
        title: cls.name,
        subtitle: cls.subject || "Môn học chung",
        tag: cls.code,
        rawData: cls
      }));
  }, [classrooms, searchQuery]);

  const filteredClassrooms = useMemo(() => {
    const qNormalized = removeAccents(searchQuery.toLowerCase().trim());
    const filtered = classrooms.filter((cls) => {
      // 1. Search Query Filter
      if (qNormalized) {
        const nameNormalized = removeAccents(cls.name.toLowerCase());
        const codeNormalized = removeAccents((cls.code || "").toLowerCase());
        const subjectNormalized = removeAccents((cls.subject || "").toLowerCase());
        const matchesSearch = nameNormalized.includes(qNormalized) ||
          codeNormalized.includes(qNormalized) ||
          subjectNormalized.includes(qNormalized);
        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        if (cls.status !== statusFilter) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      // 1. Ưu tiên các lớp đang có học sinh gửi yêu cầu chờ duyệt (pendingRequestsCount > 0)
      const aPending = (a.pendingRequestsCount || 0) > 0;
      const bPending = (b.pendingRequestsCount || 0) > 0;
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // 2. Ưu tiên các lớp được ghim (pinned)
      const aPinned = pinnedIds.includes(a._id);
      const bPinned = pinnedIds.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [classrooms, searchQuery, statusFilter, pinnedIds]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredClassrooms.length / ROWS_PER_PAGE) || 1;
  const startIdx = filteredClassrooms.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const endIdx = Math.min(page * ROWS_PER_PAGE, filteredClassrooms.length);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginatedClassrooms = useMemo(() => {
    return filteredClassrooms.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  }, [filteredClassrooms, page, ROWS_PER_PAGE]);

  const selectedIds = useMemo(() => {
    if (selectedKeys === "all") {
      return filteredClassrooms.map(c => c._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, filteredClassrooms]);

  const handleBulkArchiveClick = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => classroomService.softDeleteClassroom(id)));
      toast.success(`Đã đưa ${selectedIds.length} lớp học vào lưu trữ.`);
      setSelectedKeys(new Set());
      loadData();
    } catch (error) {
      toast.error("Không thể lưu trữ các lớp học này!");
    }
  };

  const loadData = async () => {
    try {
      const [classRes, schedRes] = await Promise.all([
        classroomService.getTeacherClassrooms(),
        scheduleService.getSchedule()
      ]);
      if (classRes.data) {
        setClassrooms(classRes.data);
      }
      if (schedRes.data) {
        setSchedules(schedRes.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách lớp học");
    }
  };

  const getNextScheduleText = (classId: string) => {
    const classSchedules = schedules.filter(s => (s.classId?._id || s.classId) === classId);
    if (!classSchedules.length) return "Chưa có lịch dạy";

    const currentJSday = new Date().getDay();
    const todayDayOfWeek = currentJSday === 0 ? 7 : currentJSday;

    const sorted = [...classSchedules].sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) {
        return a.startTime.localeCompare(b.startTime);
      }
      const aDist = (a.dayOfWeek - todayDayOfWeek + 7) % 7;
      const bDist = (b.dayOfWeek - todayDayOfWeek + 7) % 7;
      return aDist - bDist;
    });

    const next = sorted[0];
    const isToday = next.dayOfWeek === todayDayOfWeek;
    const dayText = isToday ? "Hôm nay" : next.dayOfWeek === 7 ? "Chủ nhật" : `Thứ ${next.dayOfWeek + 1}`;

    return `${next.startTime} - ${dayText}`;
  };

  // State Cảnh báo Hồ sơ chưa đầy đủ
  const [showProfileWarningModal, setShowProfileWarningModal] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);

  const handleAttemptCreateClass = () => {
    const { isComplete, missingFields } = checkTeacherProfileComplete(user);
    if (!isComplete) {
      setMissingProfileFields(missingFields);
      setShowProfileWarningModal(true);
      return;
    }
    setEditingId(null);
    setNewClass({ className: "", subject: (user as any)?.subject || "Toán học", requireApproval: true });
    setShowModal(true);
  };

  useEffect(() => {
    loadData();
    const handleOpenModal = () => {
      const { isComplete, missingFields } = checkTeacherProfileComplete(user);
      if (!isComplete) {
        setMissingProfileFields(missingFields);
        setShowProfileWarningModal(true);
        return;
      }
      setShowModal(true);
    };
    window.addEventListener("open-new-class-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-new-class-modal", handleOpenModal);
    };
  }, [user]);

  // Socket.io Real-time update cho Giáo viên khi có thay đổi lớp, bài nộp hoặc chấm điểm mới
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(backendUrl, {
      withCredentials: true,
    });

    socket.on('teacher_classrooms_update', () => {
      console.log('🔄 [Socket.io] Có thay đổi thông tin lớp học, đang làm mới...');
      loadData();
    });

    socket.on('submission_update', () => {
      console.log('🔄 [Socket.io] Có học sinh nộp bài hoặc điểm số mới, đang làm mới số bài cần chấm...');
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);



  const openPendingRequestsModal = (cls: ITeacherClassroom, defaultTab: 'pending' | 'add_existing' | 'create_new' = 'pending') => {
    setSelectedClassForPending(cls);
    setModalTab(defaultTab);
    setShowPendingModal(true);
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã lớp: ${code}`);
  };

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.className || !newClass.subject) {
      toast.error("Vui lòng điền đầy đủ thông tin tên lớp và môn học!");
      return;
    }

    if (isSubmittingClass) return;
    setIsSubmittingClass(true);

    const formattedClassName = capitalizeWords(newClass.className);
    const classData = { ...newClass, className: formattedClassName };

    try {
      if (editingId) {
        await classroomService.updateClassroom(editingId, classData);
        toast.success(`Cập nhật lớp học thành công!`);
      } else {
        await classroomService.createClassroom(classData);
        toast.success(`Tạo lớp học "${formattedClassName}" thành công!`);
      }
      setNewClass({ className: "", subject: (user as any)?.subject || "Toán học", requireApproval: false });
      setEditingId(null);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || (editingId ? "Đã xảy ra lỗi khi cập nhật lớp học!" : "Đã xảy ra lỗi khi tạo lớp học!"));
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent | null, cls: ITeacherClassroom) => {
    if (e) e.stopPropagation();
    setEditingId(cls._id);
    setNewClass({ className: cls.name, subject: cls.subject || (user as any)?.subject || "Toán học", requireApproval: cls.requireApproval ?? false });
    setShowModal(true);
  };

  const handleArchiveClick = (e: React.MouseEvent | null, cls: ITeacherClassroom) => {
    if (e) e.stopPropagation();
    setClassToArchive(cls);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!classToArchive) return;
    try {
      await classroomService.softDeleteClassroom(classToArchive._id);
      toast.success(`Đã đưa lớp "${classToArchive.name}" vào lưu trữ.`);
      setShowArchiveModal(false);
      setClassToArchive(null);
      loadData();
    } catch (error) {
      toast.error("Không thể lưu trữ lớp học này!");
    }
  };

  const handleToggleCloseClick = async (e: React.MouseEvent | null, cls: ITeacherClassroom) => {
    if (e) e.stopPropagation();
    try {
      await classroomService.toggleCloseClassroom(cls._id);
      toast.success(cls.status === 'Closed' ? `Đã mở lại lớp "${cls.name}"` : `Đã đóng lớp "${cls.name}"`);
      loadData();
    } catch (error) {
      toast.error("Không thể đóng/mở lớp học này!");
    }
  };

  return (
    <div className={styles.classroomsPage}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2>Danh sách lớp học phụ trách</h2>
          <p>Quản lý các lớp ôn luyện thêm, theo dõi sĩ số và phân phối mã code.</p>
        </div>
        <div className={styles.headerActions}>
          <ShineButton onClick={handleAttemptCreateClass}>
            <Plus size={16} weight="bold" />
            Tạo lớp học mới
          </ShineButton>
        </div>
      </div>

      {/* CỤM 3 THẺ KPI TÓM TẮT (Admin Dashboard style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Card 1: Tổng số lớp */}
        <div className="bg-[#e0f2fe]/50 border border-[#bae6fd]/30 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-[#0369a1] uppercase tracking-wider block">Tổng số lớp học</span>
              <strong className="text-4xl font-bold text-slate-800 block mt-1.5">{classrooms.length}</strong>
            </div>
            <div className="p-3 bg-white text-[#0369a1] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
              <BookOpen size={22} weight="bold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm font-semibold text-[#0369a1] block">↗ Lớp học của bạn</span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">{activeClassesCount} Hoạt động / {archivedOrClosedClassesCount} Lưu trữ & đóng</span>
          </div>
        </div>

        {/* Card 2: Tổng sĩ số */}
        <div className="bg-[#fef3c7]/50 border border-[#fde68a]/30 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-[#b45309] uppercase tracking-wider block">Tổng sĩ số học sinh</span>
              <strong className="text-4xl font-bold text-slate-800 block mt-1.5">{totalStudentsCount}</strong>
            </div>
            <div className="p-3 bg-white text-[#b45309] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
              <Users size={22} weight="bold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm font-semibold text-[#b45309] block">↗ Quản lý học tập</span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">Sĩ số học sinh đang quản lý trực tiếp</span>
          </div>
        </div>

        {/* Card 3: Ca dạy hôm nay */}
        <div className="bg-[#dcfce7]/50 border border-[#bbf7d0]/30 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[140px]">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider block">Ca dạy hôm nay</span>
              <strong className="text-4xl font-bold text-slate-800 block mt-1.5">{todaySchedules.length}</strong>
            </div>
            <div className="p-3 bg-white text-[#15803d] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
              <Clock size={22} weight="bold" />
            </div>
          </div>
          <div className="mt-4 min-w-0">
            <span className="text-sm font-semibold text-[#15803d] block">↗ Ca dạy hôm nay</span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5 truncate" title={todaySchedulesText}>
              {todaySchedulesText}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW CONTROLS & SEARCH BAR */}
      <div className="flex justify-between items-center mb-6 px-1 gap-4">
        <div className="flex items-center gap-3">
          <SmartSearchBar
            placeholder="Tìm theo tên, mã lớp... (Ấn /)"
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={searchSuggestions}
            onSelectSuggestion={(item) => {
              const cls = item.rawData;
              if (cls.status === 'Pending') {
                toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.');
              } else if (cls.status === 'Locked') {
                toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
              } else if (cls.status === 'Closed') {
                toast.warning('Lớp học đã bị đóng, không thể truy cập.');
              } else {
                navigate(`/classrooms/${cls._id}`);
              }
            }}
            recentSearchesKey="teacherClassroomSearches"
            widthClass="w-full md:w-[380px]"
          />

          <DropdownFilter
            label="Trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", label: "Tất cả trạng thái" },
              { id: "Active", label: "Đang hoạt động" },
              { id: "Pending", label: "Chờ duyệt" },
              { id: "Closed", label: "Đã đóng" },
              { id: "Locked", label: "Đã khóa" }
            ]}
            minWidthClass="min-w-[170px]"
          />
        </div>

        {/* VIEW MODE TOGGLE */}
        <ViewModeSwitch viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* BULK ACTION TOOLBAR (Synchronized with ActivitiesTable design) */}
      {selectedIds.length > 0 && viewMode === 'list' && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            Đã chọn <strong className="text-primary">{selectedIds.length}</strong> lớp học
          </span>
          <Button
            className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium flex items-center gap-2"
            size="sm"
            onPress={handleBulkArchiveClick}
          >
            <Archive weight="bold" size={16} />
            Lưu trữ các lớp đã chọn
          </Button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className={styles.classesGrid}>
          {filteredClassrooms.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-medium flex justify-center items-center w-full">
              <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                <MagnifyingGlass size={48} weight="duotone" className="text-[#f47c20] bg-[#f47c20]/10 p-3.5 rounded-full" />
                <p className="font-extrabold text-slate-800 text-sm">Không tìm thấy lớp học</p>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Không tìm thấy lớp học nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
              </div>
            </div>
          ) : paginatedClassrooms.map((cls) => (
            <div
              key={cls._id}
              className={styles.classCard}
            >
              <div className={styles.cardTop}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={styles.subjectTag}>{cls.subject || 'Môn học chung'}</span>
                  {cls.pendingRequestsCount !== undefined && cls.pendingRequestsCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPendingRequestsModal(cls);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2f8fa3] text-white font-extrabold text-[10px] shadow-xs hover:bg-[#257385] cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
                      title="Nhấn để duyệt học sinh đang chờ gia nhập lớp"
                    >
                      <UserPlus size={12} weight="bold" />
                      <span>Duyệt ({cls.pendingRequestsCount})</span>
                    </button>
                  )}
                  {cls.status === 'Pending' ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f47c20]/10 border border-[#f47c20]/30 text-[#d66b1a] font-bold text-[10px] shadow-[0_0_8px_rgba(244,124,32,0.25)]">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f47c20] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f47c20]"></span>
                      </span>
                      <span className="uppercase tracking-wider whitespace-nowrap">Chờ duyệt</span>
                    </div>
                  ) : cls.status === 'Locked' ? (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 uppercase whitespace-nowrap">Đã khóa</span>
                  ) : cls.status === 'Closed' ? (
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-300 uppercase whitespace-nowrap">Đã đóng</span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 uppercase whitespace-nowrap">Hoạt động</span>
                  )}
                </div>
                <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                  <ClassroomActionMenu
                    isPinned={pinnedIds.includes(cls._id)}
                    onTogglePin={() => togglePin(null, cls._id)}
                    isGridView
                    onViewDetail={() => {
                      if (cls.status === 'Pending') {
                        toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.');
                      } else if (cls.status === 'Locked') {
                        toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
                      } else if (cls.status === 'Closed') {
                        toast.warning('Lớp học đã bị đóng, không thể truy cập.');
                      } else {
                        navigate(`/classrooms/${cls._id}`);
                      }
                    }}
                    onEdit={() => handleEditClick(null, cls)}
                    onAddStudent={() => openPendingRequestsModal(cls)}
                    onArchive={() => handleArchiveClick(null, cls)}
                    onToggleClose={cls.status !== 'Locked' && cls.status !== 'Pending' && cls.status !== 'Archived' ? () => handleToggleCloseClick(null, cls) : undefined}
                    isClosed={cls.status === 'Closed'}
                  />
                </div>
              </div>

              <div
                className="block flex-1 transition-opacity"
                onClick={(e) => {
                  if (cls.status === 'Pending') {
                    e.preventDefault();
                    toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.');
                  } else if (cls.status === 'Locked') {
                    e.preventDefault();
                    toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
                  } else if (cls.status === 'Closed') {
                    e.preventDefault();
                    toast.warning('Lớp học đã bị đóng, không thể truy cập.');
                  } else {
                    navigate(`/classrooms/${cls._id}`);
                  }
                }}
                style={{ cursor: (cls.status === 'Pending' || cls.status === 'Locked' || cls.status === 'Closed') ? 'not-allowed' : 'pointer', opacity: (cls.status === 'Pending' || cls.status === 'Locked' || cls.status === 'Closed') ? 0.6 : 1 }}
              >
                <div className={styles.cardMiddle}>
                  <div className="flex justify-between items-center gap-3">
                    <h3 className={`${styles.classTitle} truncate flex-1`} title={cls.name}>
                      {cls.name}
                    </h3>
                    <button
                      onClick={(e) => handleCopyCode(e, cls.code)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-[#2f8fa3] bg-[#2f8fa3]/8 hover:bg-[#2f8fa3]/15 border border-[#2f8fa3]/20 rounded-md transition-all cursor-pointer select-none shadow-3xs shrink-0"
                      title="Nhấn để sao chép mã lớp"
                    >
                      <span className="font-mono uppercase tracking-wider">{cls.code || 'N/A'}</span>
                      <ClipboardText size={12} className="text-[#2f8fa3]/70" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 text-slate-500 text-[13px] font-medium">
                    <Clock size={14} weight="duotone" className="text-orange-500" />
                    <span>Tiết tiếp theo: {getNextScheduleText(cls._id)}</span>
                  </div>
                </div>
              </div>

              {/* ACTIONABLE INFO STRIP */}
              <div
                onClick={(e) => {
                  if (cls.pendingRequestsCount !== undefined && cls.pendingRequestsCount > 0) {
                    e.stopPropagation();
                    openPendingRequestsModal(cls);
                  } else if (cls.status === 'Pending' || cls.status === 'Locked' || cls.status === 'Closed') {
                    e.preventDefault();
                  } else {
                    navigate(`/classrooms/${cls._id}?tab=activities`);
                  }
                }}
                style={{ cursor: (cls.status === 'Pending' || cls.status === 'Locked' || cls.status === 'Closed') && !(cls.pendingRequestsCount && cls.pendingRequestsCount > 0) ? 'not-allowed' : 'pointer' }}
              >
                <div className={styles.actionableStrip}>
                  {cls.pendingRequestsCount !== undefined && cls.pendingRequestsCount > 0 ? (
                    <div className={styles.actionBadgePending} style={{ backgroundColor: '#e0f2fe', color: '#0284c7', borderColor: '#7dd3fc' }}>
                      <UserPlus size={14} weight="bold" />
                      <span>Có {cls.pendingRequestsCount} học sinh chờ duyệt</span>
                    </div>
                  ) : cls.pendingGrades !== undefined && cls.pendingGrades > 0 ? (
                    <div className={styles.actionBadgePending}>
                      <ClipboardText size={14} weight="bold" />
                      <span>{cls.pendingGrades} bài cần chấm</span>
                    </div>
                  ) : cls.latestAssignmentTitle ? (
                    <div className={styles.actionBadgeInfo}>
                      <BookOpen size={14} weight="duotone" />
                      <span className={styles.truncate}>BT: {cls.latestAssignmentTitle}</span>
                      {cls.latestAssignmentDue && (
                        <span className={styles.dueDate}>
                          &bull; {new Date(cls.latestAssignmentDue).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={styles.actionBadgeGood}>
                      <span>✔ Chưa có bài tập nào</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Link
                  to={`/classrooms/${cls._id}/students`}
                  className={styles.quickActionBtn}
                  title="Học sinh"
                >
                  <Users size={16} weight="bold" />
                  <span>Học sinh ({cls.students?.length || 0})</span>
                </Link>
                <Link
                  to={`/attendance?classId=${cls._id}`}
                  className={styles.attendanceBtn}
                  title="Điểm danh"
                >
                  <CheckSquare size={16} weight="bold" />
                  <span>Điểm danh</span>
                </Link>
                <Link
                  to={`/gradebook?classId=${cls._id}`}
                  className={styles.quickActionBtn}
                  title="Sổ điểm"
                >
                  <ClipboardText size={16} weight="bold" />
                  <span>Sổ điểm</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW - SYNCHRONIZED WITH ActivitiesTable & HeroUI Table */
        <div className="mt-2 flex flex-col gap-4">
          <Table>
            <Table.ScrollContainer className="min-h-[350px]">
              <Table.Content
                aria-label="Danh sách lớp học phụ trách"
                className="min-w-[800px]"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                onSelectionChange={setSelectedKeys}
                onRowAction={(key) => {
                  const cls = paginatedClassrooms.find(c => c._id === key);
                  if (cls && cls.status === 'Pending') {
                    toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.');
                    return;
                  }
                  if (cls && cls.status === 'Locked') {
                    toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
                    return;
                  }
                  if (cls && cls.status === 'Closed') {
                    toast.warning('Lớp học đã bị đóng, không thể truy cập.');
                    return;
                  }
                  navigate(`/classrooms/${key}`);
                }}
              >
                <Table.Header>
                  <Table.Column className="after:hidden w-[45px]" id="selection">
                    <Checkbox aria-label="Select all" slot="selection">
                      <Checkbox.Content>
                        <Checkbox.Control className="border-2 border-slate-400 bg-white rounded-md">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </Table.Column>
                  <Table.Column isRowHeader className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[220px] max-w-[220px] whitespace-nowrap" id="name">
                    Tên lớp
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[120px] whitespace-nowrap" id="code">
                    Mã lớp
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[120px] whitespace-nowrap" id="subject">
                    Môn học
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[120px] whitespace-nowrap" id="students">
                    Sĩ số
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[180px] whitespace-nowrap" id="assignments">
                    Bài tập
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[220px] whitespace-nowrap" id="nextSchedule">
                    Lịch học tiếp theo
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[140px] whitespace-nowrap" id="status">
                    Trạng thái
                  </Table.Column>
                  <Table.Column className="after:hidden text-end text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[130px] whitespace-nowrap" id="actions">
                    Hành động
                  </Table.Column>
                </Table.Header>
                <Table.Body>
                  {filteredClassrooms.length === 0 ? (
                    <Table.Row key="empty" id="empty">
                      <Table.Cell colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                        <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                          <MagnifyingGlass size={48} weight="duotone" className="text-[#f47c20] bg-[#f47c20]/10 p-3.5 rounded-full" />
                          <p className="font-extrabold text-slate-800 text-sm">Không tìm thấy lớp học</p>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed">Không tìm thấy lớp học nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedClassrooms.map((cls, idx) => {
                      const isPinned = pinnedIds.includes(cls._id);
                      return (
                        <Table.Row
                          key={cls._id}
                          id={cls._id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                        >
                          <Table.Cell>
                            <Checkbox aria-label={`Select ${cls.name}`} slot="selection">
                              <Checkbox.Content>
                                <Checkbox.Control className="border-2 border-slate-400 bg-white rounded-md">
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Content>
                            </Checkbox>
                          </Table.Cell>

                          <Table.Cell className="max-w-[220px]">
                            <div className="flex items-center gap-2 max-w-full overflow-hidden">
                              {isPinned && (
                                <span title="Lớp đã được ghim" className="shrink-0">
                                  <PushPin size={14} weight="fill" className="text-amber-500" />
                                </span>
                              )}
                              <span
                                className="font-bold text-primary text-sm hover:opacity-80 transition-opacity no-underline truncate block cursor-pointer"
                                title={cls.name}
                              >
                                {cls.name}
                              </span>
                            </div>
                          </Table.Cell>

                          <Table.Cell>
                            <span className="font-mono font-bold text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block">
                              {cls.code || `CLASS-${cls._id.substring(0, 4).toUpperCase()}`}
                            </span>
                          </Table.Cell>

                          <Table.Cell>
                            <span className="text-xs font-bold px-2.5 py-1 bg-[#2f8fa3]/10 text-[#2f8fa3] rounded-lg whitespace-nowrap border border-[#2f8fa3]/20">
                              {cls.subject || 'Khác'}
                            </span>
                          </Table.Cell>

                          <Table.Cell>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs shrink-0">
                                <Users size={14} weight="bold" className="text-slate-400" />
                                <span>{cls.students?.length || 0} HS</span>
                              </div>
                              {cls.pendingRequestsCount !== undefined && cls.pendingRequestsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPendingRequestsModal(cls);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#2f8fa3] hover:bg-[#257385] rounded-lg shadow-sm whitespace-nowrap cursor-pointer border-none transition-all hover:scale-105 active:scale-95 shrink-0"
                                  title="Nhấn để duyệt học sinh đang chờ gia nhập lớp"
                                >
                                  <UserPlus size={13} weight="bold" />
                                  <span>Duyệt ({cls.pendingRequestsCount})</span>
                                </button>
                              )}
                            </div>
                          </Table.Cell>

                          <Table.Cell>
                            {cls.pendingGrades !== undefined && cls.pendingGrades > 0 ? (
                              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md w-max border border-rose-100">
                                <ClipboardText size={14} weight="bold" />
                                <span>{cls.pendingGrades} bài cần chấm</span>
                              </div>
                            ) : cls.latestAssignmentTitle ? (
                              <div className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-max border border-blue-100">
                                <BookOpen size={14} weight="duotone" />
                                <span className="max-w-[140px] truncate" title={cls.latestAssignmentTitle}>
                                  {cls.latestAssignmentTitle}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[12px] text-slate-400 font-medium italic">
                                Chưa có bài tập
                              </div>
                            )}
                          </Table.Cell>

                          <Table.Cell>
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium whitespace-nowrap">
                              <Clock size={14} weight="duotone" className="text-orange-500" />
                              <span>{getNextScheduleText(cls._id)}</span>
                            </div>
                          </Table.Cell>

                          <Table.Cell>
                            {cls.status === 'Pending' ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f47c20]/10 border border-[#f47c20]/30 text-[#d66b1a] font-bold text-[10px] shadow-[0_0_8px_rgba(244,124,32,0.25)] whitespace-nowrap">
                                <span className="flex h-1.5 w-1.5 relative shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f47c20] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#f47c20]"></span>
                                </span>
                                <span className="uppercase tracking-wider">Chờ duyệt</span>
                              </div>
                            ) : cls.status === 'Locked' ? (
                              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold border border-red-200 uppercase whitespace-nowrap">Đã khóa</span>
                            ) : cls.status === 'Closed' ? (
                              <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold border border-slate-300 uppercase whitespace-nowrap">Đã đóng</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200 uppercase whitespace-nowrap">Hoạt động</span>
                            )}
                          </Table.Cell>

                          <Table.Cell onClick={(e: any) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 relative">
                              <ClassroomActionMenu
                                isPinned={isPinned}
                                onTogglePin={() => togglePin(null, cls._id)}
                                onViewDetail={() => {
                                  if (cls.status === 'Pending') {
                                    toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.');
                                    return;
                                  }
                                  if (cls.status === 'Locked') {
                                    toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
                                    return;
                                  }
                                  if (cls.status === 'Closed') {
                                    toast.warning('Lớp học đã bị đóng, không thể truy cập.');
                                    return;
                                  }
                                  navigate(`/classrooms/${cls._id}`);
                                }}
                                onEdit={() => handleEditClick(null, cls)}
                                onAttendance={() => navigate(`/attendance?classId=${cls._id}`)}
                                onAddStudent={() => openPendingRequestsModal(cls)}
                                onArchive={() => handleArchiveClick(null, cls)}
                                onToggleClose={cls.status !== 'Locked' && cls.status !== 'Pending' && cls.status !== 'Archived' ? () => handleToggleCloseClick(null, cls) : undefined}
                                isClosed={cls.status === 'Closed'}
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
          </Table>
        </div>
      )}

      {/* PAGINATION TOOLBAR */}
      {totalPages > 0 && filteredClassrooms.length > 0 && (
        <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-transparent mt-6 mb-8">
          <Pagination.Summary className="text-sm text-slate-500 font-medium">
            Hiển thị {startIdx} đến {endIdx} trong số {filteredClassrooms.length} kết quả
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

      {/* MODAL CREATE / UPDATE */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerText}>
                <h3>{editingId ? "Cập nhật lớp học" : "Tạo lớp học mới"}</h3>
                <p>{editingId ? "Chỉnh sửa thông tin lớp học" : "Điền thông tin để bắt đầu lớp học của bạn"}</p>
              </div>
              <button className={styles.btnClose} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleCreateOrUpdateClass}>
                <div className={styles.formGroup}>
                  <label htmlFor="modalClassName">Tên lớp học</label>
                  <input
                    id="modalClassName"
                    type="text"
                    required
                    placeholder="Ví dụ: Lớp 12A1 - Toán Học"
                    value={newClass.className}
                    onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Môn học phụ trách</label>
                  <div className={styles.customDropdown}>
                    <button
                      type="button"
                      className={`${styles.dropdownTrigger} opacity-75 cursor-not-allowed bg-slate-50 border-slate-200`}
                      disabled
                    >
                      <span className={styles.dropdownSelected}>
                        <span className={styles.subjectEmoji}>{selectedSubject.emoji}</span>
                        <span className="font-semibold text-slate-700">{selectedSubject.value}</span>
                      </span>
                      <div className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mr-1 whitespace-nowrap">
                        Mặc định
                      </div>
                    </button>
                    <p className="text-[12px] text-slate-500 mt-2 font-medium">
                      * Môn học được gán mặc định theo chuyên môn của giáo viên do Admin cấp.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl my-4">
                  <div className="flex flex-col gap-0.5 pr-2">
                    <label htmlFor="modalRequireApproval" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Yêu cầu duyệt học sinh khi tham gia bằng mã lớp
                    </label>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Học sinh nhập đúng mã sẽ phải chờ bạn phê duyệt trước khi vào lớp để tránh tài khoản lạ/spam.
                    </span>
                  </div>
                  <ApprovalCheckbox
                    id="modalRequireApproval"
                    checked={newClass.requireApproval}
                    onCheckedChange={(checked) => setNewClass({ ...newClass, requireApproval: checked === true })}
                    className="w-5 h-5 shrink-0 border-2 border-slate-300 data-checked:bg-[#f47c20] data-checked:border-[#f47c20]"
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)} disabled={isSubmittingClass}>
                    Hủy bỏ
                  </button>
                  <ShineButton type="submit" disabled={isSubmittingClass}>
                    {isSubmittingClass
                      ? (editingId ? "Đang cập nhật..." : "Đang tạo...")
                      : (editingId ? "Cập nhật" : "Tạo lớp học")
                    }
                  </ShineButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT & THÊM HỌC SINH THAM GIA LỚP */}
      <ManageStudentsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        classroom={selectedClassForPending}
        defaultTab={modalTab}
        onSuccess={loadData}
      />

      {/* MODAL ARCHIVE USING ALERTDIALOG */}
      <AlertDialog
        open={showArchiveModal && !!classToArchive}
        onOpenChange={(open) => {
          if (!open) setShowArchiveModal(false);
        }}
      >
        <AlertDialogContent className="bg-white max-w-md p-6 rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
          <AlertDialogHeader className="text-left pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f47c20]/10 text-[#f47c20] flex items-center justify-center shrink-0 border border-[#f47c20]/20">
                <Archive size={22} weight="duotone" />
              </div>
              <div>
                <AlertDialogTitle className="text-[#f47c20] text-lg font-extrabold">Lưu trữ lớp học</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-xs mt-0.5">
                  Bạn có chắc chắn muốn lưu trữ lớp <span className="font-semibold text-slate-800">"{classToArchive?.name}"</span> không?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="bg-gradient-to-r from-[#2f8fa3]/10 via-slate-50 to-[#2f8fa3]/5 text-slate-700 p-4 rounded-xl text-sm border border-[#2f8fa3]/25 my-3">
            <p className="leading-relaxed text-xs font-medium text-slate-600 m-0">
              Lớp học sẽ được ẩn khỏi màn hình chính nhưng <strong className="text-[#2f8fa3] font-bold">toàn bộ dữ liệu điểm số, bài tập, và danh sách học sinh vẫn được bảo lưu an toàn.</strong>
            </p>
          </div>

          <AlertDialogFooter className="flex gap-2.5 justify-end sm:justify-end mt-2 pt-3 border-t border-slate-100">
            <AlertDialogCancel
              onClick={() => setShowArchiveModal(false)}
              variant="outline"
              size="default"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={confirmArchive}
            >
              Xác nhận Lưu trữ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL CẢNH BÁO HOÀN THIỆN HỒ SƠ */}
      <ProfileWarningModal
        isOpen={showProfileWarningModal}
        onClose={() => setShowProfileWarningModal(false)}
        missingFields={missingProfileFields}
      />
    </div>
  );
}
