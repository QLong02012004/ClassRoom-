import React, { useState, useEffect, useCallback } from "react";
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
import type { IStudent, IAttendanceRecord } from "../../../service/attendance.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
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

  const [classes, setClasses] = useState<ITeacherClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load danh sách lớp
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classroomService.getTeacherClassrooms();
        if (res.data && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClassId(res.data[0]._id);
        }
      } catch {
        toast.error("Không thể tải danh sách lớp học");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Load học sinh + điểm danh khi chọn lớp/ngày
  const loadStudentsAndAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        attendanceService.getClassroomStudents(selectedClassId),
        attendanceService.getAttendance(selectedClassId, selectedDate),
      ]);

      const studentList = studentsRes.data || [];
      const existingRecords: IAttendanceRecord[] = attendanceRes.data?.records || [];

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

      {/* FILTER & STATS SECTION */}
      <section className={styles.filterSection}>
        <div className={styles.filtersLeft}>
          {/* Chọn lớp */}
          <div className={styles.filterGroup}>
            <label>Chọn Lớp</label>
            {loadingClasses ? (
              <div className={styles.selectSkeleton} />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={styles.dropdownTriggerBtn}>
                    <span>
                      {selectedClass
                        ? `${selectedClass.name}${selectedClass.subject ? ` (${selectedClass.subject})` : ""}`
                        : "Chọn lớp học"}
                    </span>
                    <CaretDown size={14} weight="bold" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                  {classes.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Chưa có lớp nào</div>
                  ) : (
                    classes.map((cls) => (
                      <DropdownMenuItem
                        key={cls._id}
                        onClick={() => setSelectedClassId(cls._id)}
                        className={`px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedClassId === cls._id ? "bg-orange-50 text-orange-600 font-semibold" : ""
                          }`}
                      >
                        {cls.name} {cls.subject ? `(${cls.subject})` : ""}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Chọn ngày */}
          <div className={styles.filterGroup}>
            <label>Ngày Điểm Danh</label>
            <div className={styles.dateInputWrapper}>
              <CalendarBlank size={16} className={styles.dateIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Stats */}
          {!loadingStudents && students.length > 0 && (
            <div className={styles.statsGroup}>
              <div className={styles.statItem}>
                <span className={styles.statNum} style={{ color: "#1e293b" }}>{students.length}</span>
                <span className={styles.statLabel}>SĨ SỐ</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum} style={{ color: "#059669" }}>{presentCount}</span>
                <span className={styles.statLabel}>CÓ MẶT</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum} style={{ color: "#d97706" }}>{lateCount}</span>
                <span className={styles.statLabel}>MUỘN</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum} style={{ color: "#dc2626" }}>{absentCount}</span>
                <span className={styles.statLabel}>VẮNG</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.filtersRight}>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? <Spinner size={18} className={styles.spinning} /> : <FloppyDisk size={18} weight="bold" />}
            {saving ? "Đang lưu..." : "Lưu điểm danh"}
          </button>
        </div>
      </section>

      {/* CLASS INFO BAR */}
      {selectedClass && (
        <div className={styles.classInfoBar}>
          <div className={styles.classInfoLeft}>
            <div className={styles.classInfoIcon}>
              <Student size={20} weight="duotone" />
            </div>
            <div>
              <strong>{selectedClass.name}</strong>
              {selectedClass.subject && <span className={styles.subjectBadge}>{selectedClass.subject}</span>}
            </div>
          </div>
          <span className={styles.classInfoCode}>Mã lớp: <strong>{selectedClass.code}</strong></span>
        </div>
      )}

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
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: "left" }}>#</th>
                <th style={{ width: 260, textAlign: "left" }}>Học sinh</th>
                <th style={{ width: 340, textAlign: "left" }}>Trạng thái điểm danh</th>
                <th style={{ textAlign: "left" }}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const { bg, color } = getAvatarColor(student.name);
                return (
                  <tr key={student._id} className={styles[`row_${student.status}`]}>
                    {/* STT */}
                    <td className={styles.colIdx}>{idx + 1}</td>

                    {/* Học sinh */}
                    <td className={styles.colName}>
                      <div className={styles.studentInfo}>
                        <div className={styles.avatarInitials} style={{ backgroundColor: bg, color }}>
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <span className={styles.studentName}>{student.name}</span>
                          <span className={styles.studentEmail}>{student.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className={styles.colStatus}>
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
                    </td>

                    {/* Ghi chú */}
                    <td className={styles.colNote}>
                      {student.editingNote ? (
                        <input
                          autoFocus
                          className={styles.noteInput}
                          value={student.note}
                          onChange={(e) => handleNoteChange(student._id, e.target.value)}
                          onBlur={() => toggleEditNote(student._id)}
                          placeholder="Nhập lý do..."
                        />
                      ) : (
                        <button className={styles.noteBtn} onClick={() => toggleEditNote(student._id)}>
                          <NotePencil size={16} weight="duotone" color="#94a3b8" />
                          <span className={student.note ? styles.noteText : styles.notePlaceholder}>
                            {student.note || "Thêm ghi chú"}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* FOOTER */}
      <footer className={styles.footerSection}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#34d399" }} />
            Có mặt
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#fbbf24" }} />
            Đi muộn
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#f87171" }} />
            Vắng mặt
          </div>
        </div>
        <div className={styles.lastUpdate}>Cập nhật lần cuối: {lastUpdateStr}</div>
      </footer>
    </div>
  );
}
