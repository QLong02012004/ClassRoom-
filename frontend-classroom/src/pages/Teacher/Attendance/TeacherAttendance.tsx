import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FloppyDisk,
  CheckCircle,
  Clock,
  XCircle,
  CalendarBlank,
  Student,
  Spinner,
  WarningCircle,
  NotePencil,
  CaretDown,
  MagnifyingGlass,
  ClockClockwise,
  Check,
  FileText,
  ChartPieSlice,
  ChartLineUp,
  TrendUp,
  BookOpen,
  Users,
  Sparkle,
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import { classroomService } from "../../../service/classroom.service";
import { attendanceService } from "../../../service/attendance.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import type { IStudent, IAttendanceRecord, IAttendance } from "../../../service/attendance.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatedAddButton } from "../../../components/ui/Buttons/AnimatedAddButton";
import { BackButton } from "../../../components/ui/Buttons/BackButton";
import { Table, Avatar as HeroAvatar, Checkbox } from "@heroui/react";
import type { Selection } from "@heroui/react";
import styles from "./TeacherAttendance.module.scss";

// Màu avatar dựa trên tên
const getAvatarColor = (name: string) => {
  const colors = [
    { bg: "#dbeafe", color: "#1d4ed8" },
    { bg: "#d1fae5", color: "#065f46" },
    { bg: "#fce7f3", color: "#9d174d" },
    { bg: "#ede9fe", color: "#5b21b6" },
    { bg: "#fef3c7", color: "#92400e" },
    { bg: "#ffedd5", color: "#9a3412" },
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

const getInitials = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

// Format ngày hôm nay thành YYYY-MM-DD
const todayStr = () => new Date().toISOString().split("T")[0];

// Format ngày theo chuẩn Việt Nam DD/MM/YYYY
const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

type StatusType = "present" | "absent" | "late";

interface StudentRow extends IStudent {
  status: StatusType;
  note: string;
  editingNote: boolean;
}

export default function TeacherAttendance() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stateClassId = location.state?.classId || searchParams.get("classId");

  const [classes, setClasses] = useState<ITeacherClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<IAttendance[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

  const selectedStudentIds = useMemo(() => {
    if (selectedKeys === "all") {
      return students.map(s => s._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, students]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingSheet, setCreatingSheet] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inputSheetUrl, setInputSheetUrl] = useState("");
  const [linkingSheet, setLinkingSheet] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const BOT_EMAIL = "sheet-bot@extreme-cycling-503907-r0.iam.gserviceaccount.com";

  const handleLinkSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !inputSheetUrl.trim()) return;

    setLinkingSheet(true);
    try {
      const res = await classroomService.linkGoogleSheet(selectedClassId, inputSheetUrl.trim());
      if (res.data) {
        toast.success("Liên kết Google Sheet thành công!");
        setClasses(prev => prev.map(c => c._id === selectedClassId ? { ...c, ...res.data } : c));
        setShowLinkModal(false);
        setInputSheetUrl("");
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Liên kết Google Sheet thất bại!";
      toast.error(errMsg);
    } finally {
      setLinkingSheet(false);
    }
  };

  const handleGenerateSheet = async () => {
    if (!selectedClassId) return;
    setCreatingSheet(true);
    try {
      const res = await classroomService.generateGoogleSheet(selectedClassId);
      if (res.data) {
        toast.success("Khởi tạo Google Sheet cho lớp thành công!");
        setClasses(prev => prev.map(c => c._id === selectedClassId ? { ...c, ...res.data } : c));
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Khởi tạo Google Sheet thất bại!";
      toast.error(errMsg);
    } finally {
      setCreatingSheet(false);
    }
  };

  const [filterStatus, setFilterStatus] = useState<"all" | "present" | "late" | "absent">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    let result = students;
    if (filterStatus !== "all") {
      result = result.filter((s) => s.status === filterStatus);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    return result;
  }, [students, filterStatus, searchQuery]);

  // Load danh sách lớp
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classroomService.getTeacherClassrooms();
        if (res.data && res.data.length > 0) {
          setClasses(res.data);
          if (stateClassId && res.data.find(c => c._id === stateClassId)) {
            setSelectedClassId(stateClassId);
          } else {
            setSelectedClassId(res.data[0]._id);
          }
        }
      } catch {
        toast.error("Không thể tải danh sách lớp học");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [stateClassId]);

  // Load học sinh + điểm danh khi chọn lớp/ngày
  const loadStudentsAndAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    try {
      const [studentsRes, attendanceRes, historyRes] = await Promise.all([
        attendanceService.getClassroomStudents(selectedClassId),
        attendanceService.getAttendance(selectedClassId, selectedDate),
        attendanceService.getAttendanceHistory(selectedClassId),
      ]);

      const studentList = studentsRes.data || [];
      const existingRecords: IAttendanceRecord[] = attendanceRes.data?.records || [];
      setAttendanceHistory(historyRes.data || []);

      // Map trạng thái cũ (nếu có) vào từng học sinh
      const rows: StudentRow[] = studentList.map((s) => {
        const existing = existingRecords.find((r) => r.studentId === s._id);
        return {
          ...s,
          status: existing?.status || "present",
          note: existing?.note || "",
          editingNote: false,
        };
      });

      setStudents(rows);
    } catch {
      toast.error("Không thể tải dữ liệu điểm danh");
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    loadStudentsAndAttendance();
  }, [loadStudentsAndAttendance]);

  const handleStatusChange = (id: string, status: StatusType) => {
    setStudents((prev) =>
      prev.map((s) => (s._id === id ? { ...s, status } : s))
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setStudents((prev) =>
      prev.map((s) => (s._id === id ? { ...s, note } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: "present" as StatusType })));
    toast.info("Đã đánh dấu tất cả học sinh có mặt!");
  };

  const toggleEditNote = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s._id === id ? { ...s, editingNote: !s.editingNote } : s))
    );
  };

  const handleBulkStatusChange = (status: StatusType) => {
    setStudents(prev => prev.map(s => {
      if (selectedStudentIds.includes(s._id)) {
        return { ...s, status };
      }
      return s;
    }));
    setSelectedKeys(new Set());
  };

  const handleSave = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);
    try {
      await attendanceService.saveAttendance({
        classId: selectedClassId,
        date: selectedDate,
        records: students.map((s) => ({
          studentId: s._id,
          status: s.status,
          note: s.note,
        })),
      });
      toast.success("Đã lưu điểm danh thành công!");
    } catch {
      toast.error("Lưu điểm danh thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const totalStudents = students.length;
  const presentCount = students.filter((s) => s.status === "present").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const presentPercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const latePercent = totalStudents > 0 ? Math.round((lateCount / totalStudents) * 100) : 0;
  const absentPercent = totalStudents > 0 ? Math.max(0, 100 - presentPercent - latePercent) : 0;

  const historyStats = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return null;
    let totalRecords = 0;
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;

    attendanceHistory.forEach((att) => {
      if (att.records && Array.isArray(att.records)) {
        att.records.forEach((r) => {
          totalRecords++;
          if (r.status === "present") totalPresent++;
          else if (r.status === "late") totalLate++;
          else if (r.status === "absent") totalAbsent++;
        });
      }
    });

    if (totalRecords === 0) return null;

    return {
      sessionCount: attendanceHistory.length,
      totalRecords,
      totalPresent,
      totalLate,
      totalAbsent,
      avgPresentPercent: Math.round((totalPresent / totalRecords) * 100),
      avgLatePercent: Math.round((totalLate / totalRecords) * 100),
      avgAbsentPercent: Math.round((totalAbsent / totalRecords) * 100),
      overallScore: Math.round(((totalPresent + totalLate * 0.5) / totalRecords) * 100)
    };
  }, [attendanceHistory]);

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  const now = new Date();
  const lastUpdateStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} - ${now.toLocaleDateString("vi-VN")}`;

  return (
    <div className={styles.attendanceContainer}>
      <div className="mb-4">
        <BackButton onClick={() => navigate("/classrooms")}>
          Quay lại danh sách lớp
        </BackButton>
      </div>

      {/* CLASS INFO & CONTROLS BAR */}
      <div className={styles.classInfoBar} style={{ flexDirection: 'column', gap: '12px' }}>
        {/* ROW 1: Header Status & Action (Tên lớp + Thống kê + Nút Lưu) */}
        <div className="flex items-center justify-between w-full flex-wrap gap-4">
          {/* Tên Lớp (ở trên) & Môn học (ở dưới) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f47c20] flex items-center justify-center shrink-0 shadow-2xs">
              <Student size={22} weight="duotone" />
            </div>

            <div className="flex flex-col items-start min-w-0">
              {loadingClasses ? (
                <div className="flex flex-col gap-1.5">
                  <div className="w-32 h-5 bg-slate-100 rounded animate-pulse" />
                  <div className="w-16 h-3.5 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center gap-1.5 p-0 bg-transparent border-0 cursor-pointer outline-none text-left"
                      title="Click để đổi lớp học"
                    >
                      <span className="font-extrabold text-[1.05rem] text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors line-clamp-1 max-w-[260px] sm:max-w-[340px]">
                        {selectedClass ? selectedClass.name : "Chọn lớp học..."}
                      </span>
                      <CaretDown size={14} weight="bold" className="text-slate-400 group-hover:text-orange-600 transition-colors shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-auto min-w-[280px] max-w-[450px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Danh sách lớp học của bạn
                    </div>
                    {classes.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500 text-center">Chưa có lớp nào</div>
                    ) : (
                      classes.map((cls) => (
                        <DropdownMenuItem
                          key={cls._id}
                          onClick={() => {
                            setSelectedClassId(cls._id);
                            setSearchParams({ classId: cls._id }, { replace: true });
                          }}
                          className={`px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 outline-none rounded-lg cursor-pointer flex justify-between items-center transition-colors my-0.5 ${selectedClassId === cls._id ? "bg-orange-50 text-orange-600 font-bold" : ""}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{cls.name}</span>
                            {cls.subject && <span className="text-[11px] text-slate-400 font-medium">Môn: {cls.subject}</span>}
                          </div>
                          {selectedClassId === cls._id && <Check size={14} weight="bold" className="text-orange-600" />}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Môn học ở bên dưới */}
              {selectedClass?.subject ? (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200/70 shadow-2xs">
                    <BookOpen size={12} weight="bold" />
                    Môn {selectedClass.subject}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">Chưa phân môn</span>
              )}
            </div>
          </div>

          {/* Cụm 4 chỉ số thống kê */}
          {!loadingStudents && students.length > 0 && selectedClass && (
            <div className={styles.statsGroup}>
              <div className={styles.statItem}>
                <span className={`${styles.statNum} ${styles.total}`}>{students.length}</span>
                <span className={styles.statLabel}>SĨ SỐ</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem} title={`Tỷ lệ có mặt: ${presentPercent}%`}>
                <span className={`${styles.statNum} ${styles.present}`}>
                  {presentCount} <span className="text-[11px] font-bold text-emerald-600 font-sans">({presentPercent}%)</span>
                </span>
                <span className={styles.statLabel}>CÓ MẶT</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem} title={`Tỷ lệ đi muộn: ${latePercent}%`}>
                <span className={`${styles.statNum} ${styles.late}`}>
                  {lateCount} <span className="text-[11px] font-bold text-amber-600 font-sans">({latePercent}%)</span>
                </span>
                <span className={styles.statLabel}>MUỘN</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem} title={`Tỷ lệ vắng mặt: ${absentPercent}%`}>
                <span className={`${styles.statNum} ${styles.absent}`}>
                  {absentCount} <span className="text-[11px] font-bold text-rose-600 font-sans">({absentPercent}%)</span>
                </span>
                <span className={styles.statLabel}>VẮNG</span>
              </div>
            </div>
          )}

          {/* Nút Lưu điểm danh (Primary Action ở góc phải) */}
          <AnimatedAddButton icon={null} onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? (
              <span className="flex items-center gap-2 whitespace-nowrap px-1">
                <Spinner size={16} className="animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center gap-2 whitespace-nowrap px-1">
                <FloppyDisk size={18} weight="bold" />
                Lưu điểm danh
              </span>
            )}
          </AnimatedAddButton>
        </div>

        {/* ROW 2: Filter & Quick Tools (Ngày + Ô tìm kiếm + Nút "Tất cả có mặt") */}
        <div className="flex items-center justify-between w-full flex-wrap gap-3 pt-2.5 border-t border-orange-100/70">
          <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
            {/* Nút chọn Ngày điểm danh */}
            <div className="relative inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 hover:border-orange-400 transition-all shadow-xs cursor-pointer flex-shrink-0">
              <CalendarBlank size={18} weight="duotone" className="text-orange-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Ngày điểm danh</span>
                <span className="text-xs font-extrabold text-slate-800 tracking-wide font-mono mt-0.5">
                  {formatDateVN(selectedDate)}
                </span>
              </div>
              {selectedDate === todayStr() ? (
                <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full ml-1">Hôm nay</span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(todayStr());
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 font-bold px-2 py-0.5 rounded-full ml-1 transition-colors border border-slate-200 z-20"
                  title="Quay về ngày hôm nay"
                >
                  Về hôm nay
                </button>
              )}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                title="Click để chọn ngày khác"
              />
            </div>

            {/* Menu xem Lịch sử các buổi điểm danh đã lưu */}
            {attendanceHistory.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer outline-none flex-shrink-0">
                    <ClockClockwise size={16} weight="bold" className="text-orange-500" />
                    <span>Lịch sử ({attendanceHistory.length} buổi)</span>
                    <CaretDown size={12} weight="bold" className="text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Các buổi đã lưu điểm danh
                  </div>
                  {attendanceHistory.map((item) => {
                    const itemDateStr = new Date(item.date).toISOString().split("T")[0];
                    const isSelected = itemDateStr === selectedDate;
                    const present = item.records ? item.records.filter((r: any) => r.status === "present").length : 0;
                    const late = item.records ? item.records.filter((r: any) => r.status === "late").length : 0;
                    const absent = item.records ? item.records.filter((r: any) => r.status === "absent").length : 0;

                    return (
                      <DropdownMenuItem
                        key={item._id}
                        onClick={() => setSelectedDate(itemDateStr)}
                        className={`px-3 py-2 text-xs rounded-lg cursor-pointer flex justify-between items-center transition-colors my-0.5 ${isSelected ? "bg-orange-50 text-orange-600 font-bold" : "text-slate-700 hover:bg-slate-50"}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-xs">{formatDateVN(itemDateStr)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {present} có mặt • {late} muộn • {absent} vắng
                          </span>
                        </div>
                        {isSelected && <Check size={16} weight="bold" className="text-orange-600" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Thanh tìm kiếm học sinh */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm học sinh theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Nút phím tắt: Tất cả có mặt (Màu trang web #2f8fa3) */}
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={students.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2f8fa3]/10 hover:bg-[#2f8fa3]/20 text-[#2f8fa3] border border-[#2f8fa3]/30 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
              title="Đánh dấu tất cả học sinh trong lớp là Có mặt"
            >
              <CheckCircle size={16} weight="bold" className="text-[#2f8fa3]" />
              <span>Tất cả có mặt</span>
            </button>

            {/* Nút Google Sheet Lớp (Màu xanh lá cây) */}
            {selectedClass?.googleSheetUrl || selectedClass?.googleSheetId ? (
              <div className="flex items-center gap-1">
                <a
                  href={selectedClass.googleSheetUrl || `https://docs.google.com/spreadsheets/d/${selectedClass.googleSheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 cursor-pointer no-underline"
                  title="Mở Google Sheet lưu lịch sử điểm danh tự động của lớp này"
                >
                  <FileText size={16} weight="bold" className="text-emerald-600" />
                  <span>Google Sheet Lớp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setInputSheetUrl(selectedClass.googleSheetUrl || "");
                    setShowLinkModal(true);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Thay đổi đường dẫn Google Sheet khác"
                >
                  <NotePencil size={14} weight="bold" />
                </button>
              </div>
            ) : selectedClass ? (
              <button
                type="button"
                onClick={() => {
                  setInputSheetUrl("");
                  setShowLinkModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 cursor-pointer"
                title="Liên kết file Google Sheet từ Google Drive cá nhân của bạn"
              >
                <FileText size={16} weight="bold" className="text-emerald-600" />
                <span>🔗 Liên kết Google Sheet</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>


      {/* TABLE SECTION */}
      <section className={styles.tableSection}>
        {loadingStudents ? (
          // Loading skeleton
          <div className={styles.skeletonWrapper}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skelAvatar} />
                <div className={styles.skelLines}>
                  <div className={styles.skelLine} style={{ width: "140px" }} />
                  <div className={styles.skelLine} style={{ width: "80px", height: "10px" }} />
                </div>
                <div className={styles.skelButtons}>
                  <div className={styles.skelBtn} />
                  <div className={styles.skelBtn} />
                  <div className={styles.skelBtn} />
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          // Empty state
          <div className={styles.emptyState}>
            <WarningCircle size={48} weight="duotone" color="#cbd5e1" />
            <p>Lớp này chưa có học sinh nào.</p>
            <span>Học sinh cần tham gia lớp bằng mã code trước khi điểm danh.</span>
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer className="min-h-[400px]">
              <Table.Content
                aria-label="Bảng điểm danh"
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                onRowAction={() => { }}
                className="w-full bg-white p-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
              >
                <Table.Header>
                  <Table.Column className="after:hidden" id="selection">
                    <Checkbox aria-label="Select all" slot="selection">
                      <Checkbox.Content>
                        <Checkbox.Control className="border-2 border-slate-400 rounded-md bg-white">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </Table.Column>
                  <Table.Column isRowHeader className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200" id="student">Học sinh</Table.Column>
                  <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200" id="date">Ngày điểm danh</Table.Column>
                  <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200" id="status">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button style={{ background: 'transparent', border: 'none', padding: 0, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                          Trạng thái {filterStatus !== 'all' && <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md lowercase">({filterStatus === 'present' ? 'Có mặt' : filterStatus === 'late' ? 'Muộn' : 'Vắng'})</span>}
                          <CaretDown size={14} weight="bold" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                        <DropdownMenuItem onClick={() => setFilterStatus("all")} className={`px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 outline-none rounded-lg cursor-pointer flex justify-between items-center transition-colors ${filterStatus === "all" ? "bg-orange-50 text-orange-600 font-semibold" : ""}`}>
                          Tất cả <span>{students.length}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("present")} className={`px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 outline-none rounded-lg cursor-pointer flex justify-between items-center transition-colors ${filterStatus === "present" ? "bg-orange-50 text-orange-600 font-semibold" : ""}`}>
                          Có mặt <span>{presentCount}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("late")} className={`px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 outline-none rounded-lg cursor-pointer flex justify-between items-center transition-colors ${filterStatus === "late" ? "bg-orange-50 text-orange-600 font-semibold" : ""}`}>
                          Muộn <span>{lateCount}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("absent")} className={`px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 outline-none rounded-lg cursor-pointer flex justify-between items-center transition-colors ${filterStatus === "absent" ? "bg-orange-50 text-orange-600 font-semibold" : ""}`}>
                          Vắng <span>{absentCount}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Table.Column>
                  <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200" id="note">Ghi chú</Table.Column>
                </Table.Header>
                <Table.Body>
                  {filteredStudents.length === 0 ? (
                    <Table.Row key="empty" id="empty">
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell />
                      <Table.Cell>
                        <div className="py-10 text-center text-slate-500 font-medium">
                          Không có học sinh nào ở trạng thái này.
                        </div>
                      </Table.Cell>
                      <Table.Cell />
                    </Table.Row>
                  ) : (
                    filteredStudents.map((student) => {
                      const { bg, color } = getAvatarColor(student.name);
                      const initials = getInitials(student.name);

                      return (
                        <Table.Row key={student._id} id={student._id} className="hover:bg-slate-50/50 transition-colors">
                          <Table.Cell className="py-3 px-4 border-b border-slate-100">
                            <Checkbox aria-label={`Select ${student.name}`} slot="selection">
                              <Checkbox.Content>
                                <Checkbox.Control className="border-2 border-slate-400 rounded-md bg-white">
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Content>
                            </Checkbox>
                          </Table.Cell>
                          <Table.Cell className="py-3 px-4 border-b border-slate-100">
                            <div className={styles.studentInfo}>
                              <HeroAvatar size="md" className="border border-slate-100 shadow-sm font-semibold flex-shrink-0" style={{ backgroundColor: bg, color: color }}>
                                <HeroAvatar.Fallback>{initials}</HeroAvatar.Fallback>
                              </HeroAvatar>
                              <div className="min-w-0 flex-1">
                                <span className={`${styles.studentName} truncate max-w-[200px] block`} title={student.name}>{student.name}</span>
                                <span className={`${styles.studentEmail} truncate max-w-[200px] block`} title={student.email}>{student.email}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="py-3 px-4 border-b border-slate-100">
                            <span className="text-xs font-semibold text-slate-700 font-mono bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap">
                              <CalendarBlank size={14} weight="duotone" className="text-orange-500 flex-shrink-0" />
                              {formatDateVN(selectedDate)}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="py-3 px-4 border-b border-slate-100">
                            <div className={styles.statusButtons}>
                              <button
                                className={`${styles.statusBtn} ${student.status === "present" ? styles.activePresent : ""}`}
                                onClick={() => handleStatusChange(student._id, "present")}
                              >
                                <CheckCircle size={16} weight="bold" />
                                Có mặt
                              </button>
                              <button
                                className={`${styles.statusBtn} ${student.status === "late" ? styles.activeLate : ""}`}
                                onClick={() => handleStatusChange(student._id, "late")}
                              >
                                <Clock size={16} weight="bold" />
                                Muộn
                              </button>
                              <button
                                className={`${styles.statusBtn} ${student.status === "absent" ? styles.activeAbsent : ""}`}
                                onClick={() => handleStatusChange(student._id, "absent")}
                              >
                                <XCircle size={16} weight="bold" />
                                Vắng
                              </button>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="py-3 px-4 border-b border-slate-100">
                            {student.editingNote ? (
                              <input
                                autoFocus
                                className={styles.noteInput}
                                value={student.note}
                                onChange={(e) => handleNoteChange(student._id, e.target.value)}
                                onBlur={() => toggleEditNote(student._id)}
                                onKeyDown={(e) => { if (e.key === "Enter") toggleEditNote(student._id); }}
                                placeholder="Nhập lý do..."
                              />
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className={styles.noteBtn}>
                                    <NotePencil size={16} weight="duotone" color="#94a3b8" />
                                    <span className={student.note ? styles.noteText : styles.notePlaceholder}>
                                      {student.note || "Thêm ghi chú"}
                                    </span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                                  {["Có phép", "Không phép", "Hỏng thiết bị", "Ốm/Mệt", "Muộn do thời tiết"].map(reason => (
                                    <DropdownMenuItem
                                      key={reason}
                                      onClick={() => handleNoteChange(student._id, reason)}
                                      className="px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 transition-colors rounded-lg cursor-pointer"
                                    >
                                      {reason}
                                    </DropdownMenuItem>
                                  ))}
                                  <div className="h-px bg-slate-200 my-1"></div>
                                  <DropdownMenuItem
                                    onClick={() => toggleEditNote(student._id)}
                                    className="px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 transition-colors rounded-lg cursor-pointer"
                                  >
                                    Nhập lý do khác...
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </section>

      {/* =========================================================================
          BẢNG TỔNG KẾT TỶ LỆ CHUYÊN CẦN CẢ LỚP (STATS VIEW - TC-TCH-25.4)
          Hiển thị tỷ lệ Có mặt, Đi muộn, Vắng mặt dạng phần trăm và biểu đồ phân bổ
         ========================================================================= */}
      {!loadingStudents && students.length > 0 && selectedClass && (
        <section className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Ambient Decorative Blurs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-emerald-100/30 via-teal-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

          {/* Header của bảng thống kê */}
          <div className="relative z-10 flex items-start sm:items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 ring-4 ring-orange-100/70 shrink-0">
                <ChartPieSlice size={24} weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight m-0">
                    Bảng thống kê tỷ lệ chuyên cần cả lớp
                  </h3>
                  <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Stats View
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 font-semibold border border-slate-200/80 shadow-2xs">
                    <BookOpen size={13} weight="bold" className="text-orange-500" />
                    Lớp: <strong className="text-slate-800">{selectedClass.name}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 font-semibold border border-slate-200/80 shadow-2xs">
                    <CalendarBlank size={13} weight="bold" className="text-blue-500" />
                    Ngày: <strong className="text-slate-800">{formatDateVN(selectedDate)}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 font-semibold border border-slate-200/80 shadow-2xs">
                    <Users size={13} weight="bold" className="text-emerald-600" />
                    Sĩ số: <strong className="text-slate-800 font-mono">{totalStudents}</strong> HS
                  </span>
                </div>
              </div>
            </div>

            {/* Đánh giá ngày này */}
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">Đánh giá ngày:</span>
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm transition-all ${
                presentPercent >= 90
                  ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 text-emerald-800 border-emerald-300/80 shadow-emerald-500/10"
                  : presentPercent >= 75
                  ? "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 text-amber-800 border-amber-300/80 shadow-amber-500/10"
                  : "bg-gradient-to-r from-rose-50 via-red-50 to-rose-100/70 text-rose-800 border-rose-300/80 shadow-rose-500/10"
              }`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    presentPercent >= 90 ? "bg-emerald-400" : presentPercent >= 75 ? "bg-amber-400" : "bg-rose-400"
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    presentPercent >= 90 ? "bg-emerald-500" : presentPercent >= 75 ? "bg-amber-500" : "bg-rose-500"
                  }`} />
                </span>
                <span className="text-xs font-black tracking-tight">
                  {presentPercent >= 90 ? "Chuyên cần Xuất sắc" : presentPercent >= 75 ? "Chuyên cần Khá tốt" : "Cần lưu ý chuyên cần"}
                </span>
                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border ${
                  presentPercent >= 90
                    ? "bg-white text-emerald-700 border-emerald-200"
                    : presentPercent >= 75
                    ? "bg-white text-amber-700 border-amber-200"
                    : "bg-white text-rose-700 border-rose-200"
                }`}>
                  {presentPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* 3 Thẻ tỷ lệ phần trăm trực quan */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Thẻ 1: Có mặt */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 border border-emerald-200/80 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-100/50 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                      <CheckCircle size={20} weight="fill" />
                    </div>
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">Tỷ lệ Có mặt</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200/90 px-2.5 py-1 rounded-lg font-mono shadow-2xs">
                    {presentCount}/{totalStudents} HS
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                    {presentPercent}%
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">học sinh tham gia đầy đủ</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-emerald-100/80 rounded-full overflow-hidden p-0.5 ring-1 ring-emerald-200/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${presentPercent}%` }}
                />
              </div>
            </div>

            {/* Thẻ 2: Đi muộn */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border border-amber-200/80 hover:border-amber-300 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-100/50 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                      <Clock size={20} weight="fill" />
                    </div>
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Tỷ lệ Đi muộn</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100/90 border border-amber-200/90 px-2.5 py-1 rounded-lg font-mono shadow-2xs">
                    {lateCount}/{totalStudents} HS
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl sm:text-4xl font-black text-amber-700 font-mono tracking-tight">
                    {latePercent}%
                  </span>
                  <span className="text-xs text-amber-600 font-medium">học sinh vào lớp chậm</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-amber-100/80 rounded-full overflow-hidden p-0.5 ring-1 ring-amber-200/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${latePercent}%` }}
                />
              </div>
            </div>

            {/* Thẻ 3: Vắng mặt */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/70 via-white to-red-50/30 border border-rose-200/80 hover:border-rose-300 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:shadow-rose-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-100/50 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-xs">
                      <XCircle size={20} weight="fill" />
                    </div>
                    <span className="text-xs font-black text-rose-900 uppercase tracking-wider">Tỷ lệ Vắng mặt</span>
                  </div>
                  <span className="text-xs font-extrabold text-rose-800 bg-rose-100/90 border border-rose-200/90 px-2.5 py-1 rounded-lg font-mono shadow-2xs">
                    {absentCount}/{totalStudents} HS
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl sm:text-4xl font-black text-rose-700 font-mono tracking-tight">
                    {absentPercent}%
                  </span>
                  <span className="text-xs text-rose-600 font-medium">học sinh không tham gia</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-rose-100/80 rounded-full overflow-hidden p-0.5 ring-1 ring-rose-200/60">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 via-red-500 to-rose-600 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${absentPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Biểu đồ thanh phân bổ 100% tỷ lệ chuyên cần */}
          <div className="relative z-10 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 flex-wrap gap-2">
              <span className="flex items-center gap-2 font-black uppercase tracking-wider text-slate-800">
                <ChartLineUp size={18} className="text-orange-500" weight="bold" />
                Biểu đồ thanh phân bổ chuyên cần ngày {formatDateVN(selectedDate)}
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                Tổng quy mô: 100%
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-6 bg-slate-200/80 rounded-xl overflow-hidden flex p-0.5 gap-0.5 shadow-inner border border-slate-200/60">
              {presentPercent > 0 && (
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-lg flex items-center justify-center text-[11px] text-white font-black transition-all duration-700 shadow-xs"
                  style={{ width: `${presentPercent}%` }}
                  title={`Có mặt: ${presentPercent}% (${presentCount} học sinh)`}
                >
                  {presentPercent >= 10 ? `${presentPercent}%` : ""}
                </div>
              )}
              {latePercent > 0 && (
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-lg flex items-center justify-center text-[11px] text-white font-black transition-all duration-700 shadow-xs"
                  style={{ width: `${latePercent}%` }}
                  title={`Đi muộn: ${latePercent}% (${lateCount} học sinh)`}
                >
                  {latePercent >= 10 ? `${latePercent}%` : ""}
                </div>
              )}
              {absentPercent > 0 && (
                <div
                  className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-lg flex items-center justify-center text-[11px] text-white font-black transition-all duration-700 shadow-xs"
                  style={{ width: `${absentPercent}%` }}
                  title={`Vắng mặt: ${absentPercent}% (${absentCount} học sinh)`}
                >
                  {absentPercent >= 10 ? `${absentPercent}%` : ""}
                </div>
              )}
            </div>

            {/* Chú thích chi tiết bên dưới thanh biểu đồ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2.5 bg-white border border-emerald-100 px-3.5 py-2 rounded-xl shadow-2xs">
                <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 inline-block shrink-0" />
                <div className="flex-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Có mặt</span>
                  <span className="text-xs font-black text-emerald-700 font-mono">
                    {presentCount} HS <span className="text-emerald-600/80 font-semibold">({presentPercent}%)</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white border border-amber-100 px-3.5 py-2 rounded-xl shadow-2xs">
                <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100 inline-block shrink-0" />
                <div className="flex-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Đi muộn</span>
                  <span className="text-xs font-black text-amber-700 font-mono">
                    {lateCount} HS <span className="text-amber-600/80 font-semibold">({latePercent}%)</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white border border-rose-100 px-3.5 py-2 rounded-xl shadow-2xs">
                <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100 inline-block shrink-0" />
                <div className="flex-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Vắng mặt</span>
                  <span className="text-xs font-black text-rose-700 font-mono">
                    {absentCount} HS <span className="text-rose-600/80 font-semibold">({absentPercent}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê tích lũy lịch sử các buổi (nếu có lịch sử) */}
          {historyStats && (
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 border border-orange-200/80 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 z-10">
              {/* Subtle Warm Ambient Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100/60 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />

              {/* Left Details */}
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 ring-4 ring-orange-100/80 shrink-0">
                  <TrendUp size={24} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs md:text-sm font-black text-slate-800 m-0 uppercase tracking-wider">
                      Thống kê chuyên cần tích lũy cả lớp
                    </h4>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200/80 shadow-2xs">
                      {historyStats.sessionCount} buổi đã lưu
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 m-0 mt-1.5 flex items-center gap-2 flex-wrap">
                    <span>Tổng: <strong className="text-slate-900 font-mono">{historyStats.totalRecords}</strong> lượt điểm danh</span>
                    <span className="text-slate-300">•</span>
                    <span>Có mặt: <strong className="text-emerald-700 font-mono">{historyStats.totalPresent}</strong> lượt</span>
                    <span className="text-slate-300">•</span>
                    <span>Đi muộn: <strong className="text-amber-700 font-mono">{historyStats.totalLate}</strong> lượt</span>
                    <span className="text-slate-300">•</span>
                    <span>Vắng: <strong className="text-rose-700 font-mono">{historyStats.totalAbsent}</strong> lượt</span>
                  </p>
                </div>
              </div>

              {/* Right KPI Cards */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-orange-100 z-10">
                <div className="bg-white/95 border border-emerald-200/80 px-4 py-2.5 rounded-xl text-center min-w-[125px] shadow-xs">
                  <span className="text-[10px] text-emerald-800 block uppercase font-bold tracking-wider">Tỷ lệ có mặt TB</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight">{historyStats.avgPresentPercent}%</span>
                </div>
                <div className="bg-white/95 border border-orange-200/80 px-4 py-2.5 rounded-xl text-center min-w-[135px] shadow-xs">
                  <span className="text-[10px] text-orange-800 block uppercase font-bold tracking-wider">Chỉ số chuyên cần TB</span>
                  <span className="text-2xl font-black text-orange-600 font-mono tracking-tight">{historyStats.overallScore}%</span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* FOOTER */}
      <footer className={styles.footerSection}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.present}`} />
            Có mặt
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.late}`} />
            Đi muộn
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.absent}`} />
            Vắng mặt
          </div>
        </div>
        <div className={styles.lastUpdate}>Cập nhật lần cuối: {lastUpdateStr}</div>
      </footer>

      {/* BULK ACTION BAR */}
      {selectedStudentIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 px-6 py-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs">
              {selectedStudentIds.length}
            </span>
            <span className="text-sm font-semibold text-slate-700">Đã chọn</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkStatusChange("present")}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} weight="bold" /> Có mặt
            </button>
            <button
              onClick={() => handleBulkStatusChange("late")}
              className="px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Clock size={16} weight="bold" /> Muộn
            </button>
            <button
              onClick={() => handleBulkStatusChange("absent")}
              className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <XCircle size={16} weight="bold" /> Vắng
            </button>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Hủy bỏ
          </button>
        </div>
      )}

      {/* MODAL LIÊN KẾT GOOGLE SHEET CÁ NHÂN */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="sm:max-w-[540px] bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={22} className="text-emerald-600 font-bold" />
              <span>Liên kết Google Sheet Lớp</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Liên kết file Google Sheet từ Google Drive cá nhân của bạn để tự động đồng bộ điểm danh.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 my-2 text-xs text-slate-700">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="font-bold text-slate-800 text-xs">📋 Hướng dẫn liên kết nhanh:</span>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 font-medium leading-relaxed">
                <li>
                  Tạo 1 file Google Sheet mới trên Google Drive cá nhân của bạn.
                </li>
                <li>
                  Bấm nút <strong>Chia sẻ (Share)</strong> ➔ Thêm email Bot làm <strong>Người chỉnh sửa (Editor)</strong>:
                  <div className="mt-1.5 flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg font-mono text-[11px] text-slate-800">
                    <span className="truncate flex-1 font-semibold text-orange-700">{BOT_EMAIL}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(BOT_EMAIL);
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex-shrink-0"
                    >
                      {copiedEmail ? "✓ Đã Copy!" : "Copy Email Bot"}
                    </button>
                  </div>
                </li>
                <li>
                  Copy đường dẫn (URL) của file Google Sheet dán vào ô bên dưới và bấm <strong>Lưu liên kết</strong>.
                </li>
              </ol>
            </div>

            <form onSubmit={handleLinkSheet} className="flex flex-col gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs">Đường dẫn Google Sheet (URL):</label>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit"
                  value={inputSheetUrl}
                  onChange={(e) => setInputSheetUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <DialogFooter className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={linkingSheet || !inputSheetUrl.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {linkingSheet ? <Spinner className="animate-spin" size={14} /> : <Check size={16} weight="bold" />}
                  <span>Lưu & Liên kết Sheet</span>
                </button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
