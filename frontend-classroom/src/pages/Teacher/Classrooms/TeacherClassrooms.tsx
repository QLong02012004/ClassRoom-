import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Users, PencilSimple, CaretDown, Check, ClipboardText, BookOpen, MagnifyingGlass, Funnel, CheckSquare, Clock, SquaresFour, List, PushPin, Archive, Trash, UserPlus, XCircle, CheckCircle } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { io } from "socket.io-client";
import { useNavigate, Link } from "react-router-dom";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { AnimatedAddButton } from "../../../components/ui/Buttons/AnimatedAddButton";
import { useAuth } from "../../../context/AuthContext";
import styles from "./TeacherClassrooms.module.scss";
import { Table, Pagination, Checkbox, Button } from "@heroui/react";
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

  // Modal duyệt & Thêm học sinh state
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedClassForPending, setSelectedClassForPending] = useState<ITeacherClassroom | null>(null);
  const [modalTab, setModalTab] = useState<'pending' | 'add_existing' | 'create_new'>('pending');

  // Default to list view as requested
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Table selection & pagination state
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 8;

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

  const filteredClassrooms = useMemo(() => {
    const filtered = classrooms.filter((cls) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        cls.name.toLowerCase().includes(q) ||
        (cls.code || "").toLowerCase().includes(q);
      return matchSearch;
    });

    return filtered.sort((a, b) => {
      const aPinned = pinnedIds.includes(a._id);
      const bPinned = pinnedIds.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [classrooms, searchQuery, pinnedIds]);

  // Reset pagination on search
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

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

  // Socket.io Real-time update cho Giáo viên khi Admin duyệt / khóa / mở khóa lớp
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl, {
      withCredentials: true,
    });

    socket.on('teacher_classrooms_update', (socketTeacherId?: string) => {
      console.log('🔄 [Socket.io] Có thay đổi trạng thái lớp từ Admin, đang cập nhật...');
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

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.className || !newClass.subject) {
      toast.error("Vui lòng điền đầy đủ thông tin tên lớp và môn học!");
      return;
    }

    try {
      if (editingId) {
        await classroomService.updateClassroom(editingId, newClass);
        toast.success(`Cập nhật lớp học thành công!`);
      } else {
        await classroomService.createClassroom(newClass);
        toast.success(`Tạo lớp học "${newClass.className}" thành công!`);
      }
      setNewClass({ className: "", subject: (user as any)?.subject || "Toán học", requireApproval: false });
      setEditingId(null);
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(editingId ? "Đã xảy ra lỗi khi cập nhật lớp học!" : "Đã xảy ra lỗi khi tạo lớp học!");
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
          {/* SEARCH */}
          <div className={styles.searchBox}>
            <MagnifyingGlass size={16} weight="bold" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm theo tên, mã lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery("")}>×</button>
            )}
          </div>

          <AnimatedAddButton onClick={handleAttemptCreateClass}>
            Tạo lớp học mới
          </AnimatedAddButton>
        </div>
      </div>

      {/* VIEW CONTROLS & STATS */}
      <div className="flex justify-between items-center mb-1 px-1">
        <h3 className="text-slate-500 font-medium text-sm">
          Hiển thị <span className="text-slate-800 font-bold">{filteredClassrooms.length}</span> lớp học
        </h3>

        {/* VIEW MODE TOGGLE */}
        <div className="flex bg-slate-100/80 rounded-lg p-1 border border-slate-200/60 shadow-sm">
          <button
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('grid')}
            title="Dạng lưới (Grid)"
          >
            <SquaresFour size={18} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
          </button>
          <button
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('list')}
            title="Dạng danh sách (List)"
          >
            <List size={18} weight={viewMode === 'list' ? 'bold' : 'regular'} />
          </button>
        </div>
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
            <div className={styles.emptyState}>
              <MagnifyingGlass size={40} weight="duotone" />
              <p>Không tìm thấy lớp học nào khớp với "{searchQuery}"</p>
            </div>
          ) : filteredClassrooms.map((cls) => (
            <div
              key={cls._id}
              className={styles.classCard}
            >
              <div className={styles.cardTop}>
                <div className="flex items-center gap-3">
                  <span className={styles.subjectTag}>{cls.subject || 'Môn học chung'}</span>
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
                <div className="flex gap-2 items-center">
                  <button
                    className={`p-1.5 rounded-md transition-colors ${pinnedIds.includes(cls._id) ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'}`}
                    onClick={(e) => togglePin(e, cls._id)}
                    title={pinnedIds.includes(cls._id) ? "Bỏ ghim" : "Ghim lớp học"}
                  >
                    <PushPin size={18} weight={pinnedIds.includes(cls._id) ? "fill" : "regular"} />
                  </button>
                  <button className="p-1.5 text-blue-500 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" onClick={(e) => handleEditClick(e, cls)}>
                    <PencilSimple size={18} weight="bold" />
                  </button>
                  <button className="p-1.5 text-orange-500 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors" onClick={(e) => handleArchiveClick(e, cls)} title="Lưu trữ lớp">
                    <Archive size={18} weight="bold" />
                  </button>
                  {cls.status !== 'Locked' && cls.status !== 'Pending' && cls.status !== 'Archived' && (
                    <button className="p-1.5 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors" onClick={(e) => handleToggleCloseClick(e, cls)} title={cls.status === 'Closed' ? "Mở lại lớp" : "Đóng lớp"}>
                      {cls.status === 'Closed' ? <CheckSquare size={18} weight="bold" className="text-blue-500" /> : <ClipboardText size={18} weight="bold" />}
                    </button>
                  )}
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
                  <h3 className={styles.classTitle}>{cls.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[13px] font-medium">
                    <Clock size={14} weight="duotone" className="text-orange-500" />
                    <span>Tiết tiếp theo: {getNextScheduleText(cls._id)}</span>
                  </div>
                </div>
              </div>

              {/* ACTIONABLE INFO STRIP */}
              <div
                onClick={(e) => {
                  if (cls.status === 'Pending' || cls.status === 'Locked' || cls.status === 'Closed') {
                    e.preventDefault();
                  } else {
                    navigate(`/classrooms/${cls._id}`);
                  }
                }}
                style={{ cursor: (cls.status === 'Pending' || cls.status === 'Locked' || cls.status === 'Closed') ? 'not-allowed' : 'pointer' }}
              >
                <div className={styles.actionableStrip}>
                  {cls.pendingGrades !== undefined && cls.pendingGrades > 0 ? (
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
                  className={styles.quickActionBtn}
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
                  <Table.Column isRowHeader className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[220px] max-w-[220px]" id="name">
                    Tên lớp
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[120px]" id="code">
                    Mã lớp
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[120px]" id="subject">
                    Môn học
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[180px]" id="students">
                    Sĩ số
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[180px]" id="assignments">
                    Bài tập
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[170px]" id="nextSchedule">
                    Lịch học tiếp theo
                  </Table.Column>
                  <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[120px]" id="status">
                    Trạng thái
                  </Table.Column>
                  <Table.Column className="after:hidden text-end text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[130px] whitespace-nowrap" id="actions">
                    Hành động
                  </Table.Column>
                </Table.Header>
                <Table.Body>
                  {filteredClassrooms.length === 0 ? (
                    <Table.Row key="empty" id="empty">
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell>
                        <div className="py-12 text-center text-slate-500 font-medium">
                          <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                            <MagnifyingGlass size={36} weight="duotone" className="text-slate-300" />
                            <p className="font-semibold">Không tìm thấy lớp học nào khớp với "{searchQuery}"</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
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
            <Table.Footer>
              {totalPages > 0 && (
                <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-transparent">
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
            </Table.Footer>
          </Table>
        </div>
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
                  <input
                    id="modalRequireApproval"
                    type="checkbox"
                    checked={newClass.requireApproval}
                    onChange={(e) => setNewClass({ ...newClass, requireApproval: e.target.checked })}
                    className="w-5 h-5 accent-orange-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className={styles.btnConfirm}>
                    {editingId ? "Cập nhật" : "Tạo lớp học"}
                  </button>
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
          {/* Top Gradient Bar combining Ocean Blue ($secondary) & Sunscreen Orange ($primary) */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2f8fa3] via-[#f47c20] to-[#2f8fa3]" />

          <AlertDialogHeader className="text-left pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2f8fa3]/10 text-[#2f8fa3] flex items-center justify-center shrink-0 border border-[#2f8fa3]/20">
                <Archive size={22} weight="duotone" />
              </div>
              <div>
                <AlertDialogTitle className="text-slate-900 text-lg font-extrabold">Lưu trữ lớp học</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-xs mt-0.5">
                  Bạn có chắc chắn muốn lưu trữ lớp <span className="font-semibold text-slate-800">"{classToArchive?.name}"</span> không?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="bg-gradient-to-r from-[#2f8fa3]/10 via-slate-50 to-[#2f8fa3]/5 text-slate-700 p-4 rounded-xl text-sm border border-[#2f8fa3]/25 flex gap-3 items-start my-3">
            <Archive size={22} weight="duotone" className="shrink-0 text-[#2f8fa3] mt-0.5" />
            <p className="leading-relaxed text-xs font-medium text-slate-600">
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
              onClick={confirmArchive}
              className="bg-[#2f8fa3] hover:bg-[#247485] text-white border-none shadow-md shadow-[#2f8fa3]/20 font-semibold"
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
