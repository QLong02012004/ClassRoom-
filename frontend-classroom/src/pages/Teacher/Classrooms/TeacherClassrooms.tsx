import React, { useState, useEffect, useRef } from "react";
import { Plus, Chalkboard, Users, Key, PencilSimple, CaretDown, Check, ClipboardText, BookOpen, MagnifyingGlass, Funnel, CheckSquare, Clock, SquaresFour, List, PushPin, Archive, DotsThreeVertical } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useNavigate, Link } from "react-router-dom";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";
import { useAuth } from "../../../context/AuthContext";
import styles from "./TeacherClassrooms.module.scss";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../../../components/ui/dropdown-menu";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('teacherPinnedClasses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds(prev => {
      const isPinned = prev.includes(id);
      const newPinned = isPinned ? prev.filter(pId => pId !== id) : [...prev, id];
      localStorage.setItem('teacherPinnedClasses', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const [newClass, setNewClass] = useState({ className: "", subject: (user as any)?.subject || "Toán học" });

  useEffect(() => {
    if ((user as any)?.subject) {
      setNewClass(prev => ({ ...prev, subject: (user as any).subject }));
    }
  }, [(user as any)?.subject]);

  const selectedSubject = SUBJECT_OPTIONS.find(o => o.value === newClass.subject) || { value: newClass.subject, emoji: "📚", color: "#64748b" };

  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const semesterRef = useRef<HTMLDivElement>(null);

  const SEMESTER_OPTIONS = [
    { value: "all", label: "Tất cả học kỳ" },
    { value: "hk1-2024", label: "HK1 - 2024-2025" },
    { value: "hk2-2024", label: "HK2 - 2024-2025" },
    { value: "hk1-2025", label: "HK1 - 2025-2026" },
    { value: "hk2-2025", label: "HK2 - 2025-2026" },
  ];

  const selectedSemesterLabel = SEMESTER_OPTIONS.find(o => o.value === semesterFilter)?.label || "Tất cả học kỳ";

  const filteredClassrooms = React.useMemo(() => {
    const filtered = classrooms.filter((cls) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        cls.name.toLowerCase().includes(q) ||
        (cls.code || "").toLowerCase().includes(q);
      // Semester filter is UI-level only (no date metadata yet), so just show all when "all"
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

  const getClassProgress = (classId: string) => {
    const classSchedules = schedules.filter(s => (s.classId?._id || s.classId) === classId);
    if (!classSchedules.length) return 0;
    const totalProgress = classSchedules.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    return Math.round(totalProgress / classSchedules.length);
  };


  useEffect(() => {
    loadData();
    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("open-new-class-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-new-class-modal", handleOpenModal);
    };
  }, []);

  // Close both dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (semesterRef.current && !semesterRef.current.contains(e.target as Node)) {
        setSemesterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setNewClass({ className: "", subject: (user as any)?.subject || "Toán học" });
      setEditingId(null);
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(editingId ? "Đã xảy ra lỗi khi cập nhật lớp học!" : "Đã xảy ra lỗi khi tạo lớp học!");
    }
  };

  const handleEditClick = (e: React.MouseEvent, cls: ITeacherClassroom) => {
    e.stopPropagation();
    setEditingId(cls._id);
    setNewClass({ className: cls.name, subject: cls.subject || (user as any)?.subject || "Toán học" });
    setShowModal(true);
  };

  const handleArchiveClick = (e: React.MouseEvent, cls: ITeacherClassroom) => {
    e.stopPropagation();
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

  const columnHelper = createColumnHelper<ITeacherClassroom>();
  const columns = React.useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Tên lớp',
      cell: info => {
        const cls = info.row.original;
        const isPinned = pinnedIds.includes(cls._id);
        return (
          <div className="flex items-center gap-2">
            <button 
              className={`p-1 rounded-md transition-colors ${isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              onClick={(e) => togglePin(e, cls._id)}
              title={isPinned ? "Bỏ ghim" : "Ghim lớp học"}
            >
              <PushPin size={16} weight={isPinned ? "fill" : "regular"} />
            </button>
            <div className="font-bold text-slate-800 text-[14px]">{info.getValue()}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor('subject', {
      header: 'Môn học',
      cell: info => (
        <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg whitespace-nowrap">
          {info.getValue() || 'Khác'}
        </span>
      ),
    }),
    columnHelper.accessor('students', {
      header: 'Sĩ số',
      cell: info => (
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <Users size={14} weight="bold" className="text-slate-400" />
          <span>{info.getValue()?.length || 0}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'assignments',
      header: 'Bài tập',
      cell: info => {
        const cls = info.row.original;
        if (cls.pendingGrades !== undefined && cls.pendingGrades > 0) {
          return (
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md w-max border border-rose-100">
              <ClipboardText size={14} weight="bold" />
              <span>{cls.pendingGrades} bài cần chấm</span>
            </div>
          );
        }
        if (cls.latestAssignmentTitle) {
          return (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-max border border-blue-100">
              <BookOpen size={14} weight="duotone" />
              <span className="max-w-[120px] truncate" title={cls.latestAssignmentTitle}>
                {cls.latestAssignmentTitle}
              </span>
            </div>
          );
        }
        return (
          <div className="text-[12px] text-slate-400 font-medium italic">
            Chưa có bài tập
          </div>
        );
      }
    }),
    columnHelper.display({
      id: 'nextSchedule',
      header: 'Lịch học tiếp theo',
      cell: info => (
        <div className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium whitespace-nowrap">
          <Clock size={14} weight="duotone" className="text-orange-500" />
          {getNextScheduleText(info.row.original._id)}
        </div>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Hành động',
      cell: info => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-md transition-colors" title="Thêm thao tác">
              <DotsThreeVertical size={16} weight="bold" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/classrooms/${info.row.original._id}`)} className="cursor-pointer">
              <MagnifyingGlass size={16} weight="bold" className="mr-2 text-slate-500" />
              Chi tiết lớp học
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleEditClick(e as any, info.row.original)} className="cursor-pointer">
              <PencilSimple size={16} weight="bold" className="mr-2 text-blue-500" />
              Sửa thông tin
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/attendance?classId=${info.row.original._id}`)} className="cursor-pointer">
              <CheckSquare size={16} weight="bold" className="mr-2 text-emerald-500" />
              Điểm danh
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/gradebook?classId=${info.row.original._id}`)} className="cursor-pointer">
              <ClipboardText size={16} weight="bold" className="mr-2 text-purple-500" />
              Sổ điểm
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => handleArchiveClick(e as any, info.row.original)} className="cursor-pointer text-orange-600 focus:text-orange-700 focus:bg-orange-50">
              <Archive size={16} weight="bold" className="mr-2" />
              Lưu trữ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }),
  ], [schedules]);

  const table = useReactTable({
    data: filteredClassrooms,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

          {/* SEMESTER FILTER DROPDOWN */}
          <div className={styles.semesterDropdown} ref={semesterRef}>
            <button
              className={`${styles.semesterTrigger} ${semesterDropdownOpen ? styles.semesterOpen : ""}`}
              onClick={() => setSemesterDropdownOpen(p => !p)}
            >
              <Funnel size={15} weight="bold" />
              <span>{selectedSemesterLabel}</span>
              <CaretDown size={13} weight="bold" className={semesterDropdownOpen ? styles.caretFlip : ""} />
            </button>
            {semesterDropdownOpen && (
              <div className={styles.semesterPanel}>
                {SEMESTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.semesterOption} ${semesterFilter === opt.value ? styles.semesterActive : ""}`}
                    onClick={() => { setSemesterFilter(opt.value); setSemesterDropdownOpen(false); }}
                  >
                    {opt.label}
                    {semesterFilter === opt.value && <Check size={14} weight="bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>



          <AnimatedAddButton onClick={() => {
            setEditingId(null);
            setNewClass({ className: "", subject: (user as any)?.subject || "Toán học" });
            setShowModal(true);
          }}>
            Tạo lớp học mới
          </AnimatedAddButton>
        </div>
      </div>

      {/* VIEW CONTROLS & STATS */}
      <div className="flex justify-between items-center mb-4 px-1">
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
                  <span className={styles.subjectTag} style={{ color: '#0f172a', fontWeight: '700' }}>{cls.subject || 'Môn học chung'}</span>
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
                  <button className="p-1.5 text-orange-500 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors" onClick={(e) => handleArchiveClick(e, cls)}>
                    <Archive size={18} weight="bold" />
                  </button>
                </div>
              </div>

              <Link to={`/classrooms/${cls._id}`} className="block flex-1 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.cardMiddle}>
                  <h3 className={styles.classTitle}>{cls.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[13px] font-medium">
                    <Clock size={14} weight="duotone" className="text-orange-500" />
                    <span>Tiết tiếp theo: {getNextScheduleText(cls._id)}</span>
                  </div>
                </div>
              </Link>

              {/* ACTIONABLE INFO STRIP */}
              <Link to={`/classrooms/${cls._id}`} style={{ textDecoration: 'none' }}>
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
              </Link>

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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-slate-200">
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="text-[11px] font-extrabold px-5 py-4 whitespace-nowrap text-slate-500">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer border-b-slate-100">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-5 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {filteredClassrooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="px-5 py-12 text-center text-slate-500 h-32">
                      <div className="flex flex-col items-center gap-3">
                        <MagnifyingGlass size={40} weight="duotone" className="text-slate-300" />
                        <p className="font-semibold">Không tìm thấy lớp học nào khớp với "{searchQuery}"</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
                    {/* Read-only Button for Subject */}
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

      {/* MODAL ARCHIVE */}
      {showArchiveModal && classToArchive && (
        <div className={styles.modalOverlay} onClick={() => setShowArchiveModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerText}>
                <h3 className="text-orange-600">Lưu trữ lớp học</h3>
                <p>Bạn muốn lưu trữ lớp "{classToArchive.name}"?</p>
              </div>
              <button className={styles.btnClose} onClick={() => setShowArchiveModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className="flex flex-col gap-4 mb-6">
                <div className="bg-orange-50 text-orange-700 p-4 rounded-lg text-sm border border-orange-100 flex gap-3">
                  <Archive size={24} weight="duotone" className="shrink-0 text-orange-500" />
                  <p>
                    Lớp học sẽ được ẩn khỏi màn hình chính nhưng <strong>toàn bộ dữ liệu điểm số, bài tập, và danh sách học sinh vẫn được bảo lưu an toàn.</strong>
                  </p>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowArchiveModal(false)}>Hủy</button>
                <button type="button" className={`${styles.btnConfirm} !bg-orange-500 hover:!bg-orange-600`} onClick={confirmArchive}>Xác nhận Lưu trữ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
