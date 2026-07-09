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
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { classroomService } from "../../../service/classroom.service";
import { attendanceService } from "../../../service/attendance.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import type { IStudent, IAttendanceRecord, IAttendance } from "../../../service/attendance.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";
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

  const presentCount = students.filter((s) => s.status === "present").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const selectedClass = classes.find((c) => c._id === selectedClassId);

  const now = new Date();
  const lastUpdateStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} - ${now.toLocaleDateString("vi-VN")}`;

  return (
    <div className={styles.attendanceContainer}>

      {/* CLASS INFO & CONTROLS BAR */}
      <div className={styles.classInfoBar}>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div className={styles.classInfoLeft}>
            <div className={styles.classInfoIcon}>
              <Student size={20} weight="duotone" />
            </div>
            <div>
              {loadingClasses ? (
                <div className="w-32 h-6 bg-slate-100 rounded animate-pulse" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button style={{ background: 'transparent', border: 'none', padding: 0, fontWeight: 700, fontSize: '0.925rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                      <span>
                        {selectedClass
                          ? selectedClass.name
                          : "Chọn lớp học..."}
                      </span>
                      <CaretDown size={14} weight="bold" color="#64748b" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-auto min-w-[280px] max-w-[450px] bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
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
                          className={`px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 outline-none rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedClassId === cls._id ? "bg-orange-50 text-orange-600 font-semibold" : ""}`}
                        >
                          {cls.name} {cls.subject ? `(${cls.subject})` : ""}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {selectedClass?.subject && <span className={styles.subjectBadge}>{selectedClass.subject}</span>}
            </div>
          </div>
          <div className="relative w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Stats */}
        {!loadingStudents && students.length > 0 && selectedClass && (
          <div className={styles.statsGroup}>
            <div className={styles.statItem}>
              <span className={`${styles.statNum} ${styles.total}`}>{students.length}</span>
              <span className={styles.statLabel}>SĨ SỐ</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={`${styles.statNum} ${styles.present}`}>{presentCount}</span>
              <span className={styles.statLabel}>CÓ MẶT</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={`${styles.statNum} ${styles.late}`}>{lateCount}</span>
              <span className={styles.statLabel}>MUỘN</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={`${styles.statNum} ${styles.absent}`}>{absentCount}</span>
              <span className={styles.statLabel}>VẮNG</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <AnimatedAddButton onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner size={18} className="animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FloppyDisk size={18} weight="bold" />
                Lưu điểm danh
              </span>
            )}
          </AnimatedAddButton>
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
                onRowAction={() => {}}
                className="w-full bg-white p-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
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
                  <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200" id="student">Học sinh</Table.Column>
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
                            <Checkbox aria-label={`Select ${student.name}`} slot="selection" variant="secondary">
                              <Checkbox.Content>
                                <Checkbox.Control>
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
                          {/* Lịch sử 5 buổi */}
                          {attendanceHistory.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 items-center">
                              {[...attendanceHistory].reverse().map(historyRecord => {
                                const record = historyRecord.records.find(r => r.studentId === student._id);
                                const status = record?.status;
                                let dotColor = "bg-slate-200";
                                if (status === "present") dotColor = "bg-emerald-500";
                                else if (status === "late") dotColor = "bg-amber-500";
                                else if (status === "absent") dotColor = "bg-rose-500";
                                
                                const dateStr = new Date(historyRecord.date).toLocaleDateString("vi-VN");
                                
                                return (
                                  <div 
                                    key={historyRecord._id} 
                                    className={`w-2 h-2 rounded-full ${dotColor} cursor-help transition-transform hover:scale-125`}
                                    title={`${dateStr}: ${status === 'present' ? 'Có mặt' : status === 'late' ? 'Muộn' : status === 'absent' ? 'Vắng' : 'Chưa điểm danh'}`}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
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
    </div>
  );
}
