import React, { useState, useEffect, useCallback } from "react";
import {
  FloppyDisk,
  NotePencil,
  Article,
  Spinner,
  CaretDown,
  WarningCircle,
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { gradebookService } from "../../../service/gradebook.service";
import type { IAssignment, IGrade, IGradebookStudent } from "../../../service/gradebook.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import styles from "./TeacherGradebook.module.scss";

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

export default function TeacherGradebook() {
  const toast = useToast();

  const [classes, setClasses] = useState<ITeacherClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [students, setStudents] = useState<IGradebookStudent[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [grades, setGrades] = useState<IGrade[]>([]);

  // Form giao bài tập mới
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("15phut");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const selectedClass = classes.find(c => c._id === selectedClassId);

  // Điểm số đang được chỉnh sửa tạm thời trên bảng (chưa lưu xuống DB)
  // Cấu trúc: { [studentId_assignmentId]: scoreValue }
  const [editingScores, setEditingScores] = useState<{ [key: string]: string }>({});

  // Tải danh sách lớp
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

  // Tải bảng điểm của lớp được chọn
  const loadGradebook = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingData(true);
    try {
      const res = await gradebookService.getClassroomGrades(selectedClassId);
      if (res.data) {
        setStudents(res.data.students || []);
        setAssignments(res.data.assignments || []);
        setGrades(res.data.grades || []);

        // Khởi tạo các ô nhập điểm từ DB
        const initialScores: { [key: string]: string } = {};
        (res.data.grades || []).forEach(g => {
          initialScores[`${g.studentId}_${g.assignmentId}`] = String(g.score);
        });
        setEditingScores(initialScores);
      }
    } catch {
      toast.error("Không thể tải dữ liệu sổ điểm");
    } finally {
      setLoadingData(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadGradebook();
  }, [loadGradebook]);

  const handleScoreChange = (studentId: string, assignmentId: string, value: string) => {
    setEditingScores(prev => ({
      ...prev,
      [`${studentId}_${assignmentId}`]: value
    }));
  };

  // Lưu điểm số
  const handleSaveGrades = async () => {
    if (assignments.length === 0 || students.length === 0) return;
    setSaving(true);
    try {
      // Lưu điểm cho từng bài tập
      await Promise.all(
        assignments.map(async (assignment) => {
          const assignmentGrades = students
            .map(student => {
              const val = editingScores[`${student._id}_${assignment._id}`];
              if (val !== undefined && val !== "") {
                return {
                  studentId: student._id,
                  score: Number(val),
                };
              }
              return null;
            })
            .filter(item => item !== null) as { studentId: string; score: number }[];

          if (assignmentGrades.length > 0) {
            await gradebookService.saveGrades({
              assignmentId: assignment._id,
              grades: assignmentGrades
            });
          }
        })
      );
      toast.success("Đã lưu điểm số thành công!");
      loadGradebook();
    } catch {
      toast.error("Lưu điểm số thất bại!");
    } finally {
      setSaving(false);
    }
  };

  // Tạo bài tập mới
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error("Vui lòng chọn lớp học!");
      return;
    }
    if (!newTitle || !newDueDate) {
      toast.error("Vui lòng điền đủ Tiêu đề và Hạn nộp!");
      return;
    }

    setCreatingTask(true);
    try {
      await gradebookService.createAssignment({
        classId: selectedClassId,
        title: newTitle,
        dueDate: newDueDate,
        maxScore: newMaxScore,
        description: newDescription,
        category: newCategory
      });
      toast.success("Giao bài tập mới thành công!");
      // Reset form
      setNewTitle("");
      setNewDueDate("");
      setNewMaxScore(10);
      setNewDescription("");
      setNewCategory("15phut");
      // Reload danh sách
      loadGradebook();
    } catch {
      toast.error("Giao bài tập thất bại!");
    } finally {
      setCreatingTask(false);
    }
  };

  // Tính điểm trung bình của học sinh dựa theo các điểm số nhập vào (quy đổi về thang điểm 10)
  const calculateStudentAvg = (studentId: string) => {
    let sumWeightedScores = 0;
    let sumWeights = 0;

    const categoryWeights: Record<string, number> = {
      mieng: 1,
      "15phut": 1,
      giuaky: 2,
      cuoiky: 3,
    };

    assignments.forEach(a => {
      const val = editingScores[`${studentId}_${a._id}`];
      if (val !== undefined && val !== "") {
        const score = Number(val);
        const weight = categoryWeights[a.category] || 1;
        // Quy đổi điểm về thang 10 nếu maxScore khác 10
        const normalizedScore = a.maxScore > 0 ? (score / a.maxScore) * 10 : score;
        sumWeightedScores += normalizedScore * weight;
        sumWeights += weight;
      }
    });

    return sumWeights > 0 ? sumWeightedScores / sumWeights : null;
  };

  const getRank = (avg: number | null) => {
    if (avg === null) return { text: "Chưa có", cls: styles.rankAvg };
    if (avg >= 9.0) return { text: "Xuất sắc", cls: styles.rankExcellent };
    if (avg >= 8.0) return { text: "Giỏi", cls: styles.rankGood };
    if (avg >= 6.5) return { text: "Khá", cls: styles.rankGood };
    if (avg >= 5.0) return { text: "TB", cls: styles.rankAvg };
    return { text: "Yếu", cls: styles.rankAvg };
  };

  return (
    <div className={styles.gradebookContainer}>

      {/* 1. CHI TIẾT SỔ ĐIỂM (TOP TABLE) */}
      <section className={styles.topSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerInfo}>
            <h2>Chi tiết Sổ điểm</h2>
            <div className={styles.classSelectorArea} style={{ marginTop: 8 }}>
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
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnPrimary} onClick={handleSaveGrades} disabled={saving || students.length === 0}>
              {saving ? <Spinner size={18} className={styles.spinning} /> : <FloppyDisk size={18} weight="bold" />}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loadingData ? (
            <div className={styles.loadingWrapper}>
              <Spinner size={32} className={styles.spinning} />
              <p>Đang tải bảng điểm...</p>
            </div>
          ) : students.length === 0 ? (
            <div className={styles.emptyState}>
              <WarningCircle size={48} weight="duotone" color="#cbd5e1" />
              <p>Lớp học này chưa có học sinh nào.</p>
            </div>
          ) : (
            <table className={styles.scoresTable}>
              <thead>
                <tr>
                  <th className={styles.colStudent} style={{ textAlign: 'left' }}>Học sinh</th>
                  {assignments.map(a => {
                    const categoryLabels: Record<string, string> = {
                      mieng: "M miệng",
                      "15phut": "15 phút",
                      giuaky: "Giữa kỳ",
                      cuoiky: "Cuối kỳ",
                    };
                    const label = categoryLabels[a.category] || "15 phút";
                    return (
                      <th key={a._id} style={{ minWidth: 120 }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                        <div>{a.title}</div>
                      </th>
                    );
                  })}
                  <th className={styles.colAvg}>ĐTB</th>
                  <th className={styles.colRank}>Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const { bg, color } = getAvatarColor(student.name);
                  const avg = calculateStudentAvg(student._id);
                  const rank = getRank(avg);

                  return (
                    <tr key={student._id}>
                      <td className={styles.colStudent}>
                        <div className={styles.studentInfo}>
                          <div
                            className={styles.avatarInitials}
                            style={{ backgroundColor: bg, color: color }}
                          >
                            {getInitials(student.name)}
                          </div>
                          <div className={styles.nameDetails}>
                            <span className={styles.studentName}>{student.name}</span>
                            <span className={styles.studentId}>{student.email}</span>
                          </div>
                        </div>
                      </td>
                      {assignments.map(a => (
                        <td key={a._id}>
                          <input
                            type="number"
                            className={styles.scoreInput}
                            value={editingScores[`${student._id}_${a._id}`] || ""}
                            onChange={(e) => handleScoreChange(student._id, a._id, e.target.value)}
                            step="0.1"
                            min="0"
                            max={a.maxScore}
                            placeholder={`Max: ${a.maxScore}`}
                          />
                        </td>
                      ))}
                      <td className={styles.colAvg}>
                        <span className={styles.avgValue}>
                          {avg !== null ? avg.toFixed(1) : "-"}
                        </span>
                      </td>
                      <td className={styles.colRank}>
                        <span className={`${styles.rankBadge} ${rank.cls}`}>
                          {rank.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 2. BOTTOM SECTION: 2 COLUMNS */}
      <section className={styles.bottomSection}>

        {/* RIGHT COLUMN: Danh sách & Tổng quan */}
        <div className={styles.rightColumn} style={{ flex: 1 }}>

          <div className={styles.listHeader}>
            <h3>Danh sách bài đã giao</h3>
          </div>

          <div className={styles.assignmentList}>
            {assignments.length === 0 ? (
              <p className={styles.emptyText} style={{ padding: 20, color: '#94a3b8' }}>Chưa có bài tập nào được giao cho lớp này.</p>
            ) : (
              assignments.map((task) => (
                <div key={task._id} className={styles.assignmentCard}>
                  <div className={styles.taskLeft}>
                    <div
                      className={styles.taskIcon}
                      style={{ backgroundColor: '#ede9fe' }}
                    >
                      <Article size={24} color="#5b21b6" weight="fill" />
                    </div>
                    <div className={styles.taskInfo}>
                      <h4>{task.title}</h4>
                      <p>
                        {task.category === 'mieng' ? 'Điểm miệng' :
                         task.category === '15phut' ? 'Điểm 15 phút' :
                         task.category === 'giuaky' ? 'Điểm giữa kỳ' : 'Điểm cuối kỳ'} (Hệ số {task.category === 'giuaky' ? 2 : task.category === 'cuoiky' ? 3 : 1}) • Hạn nộp: {new Date(task.dueDate).toLocaleDateString('vi-VN')} • Max: {task.maxScore} điểm
                      </p>
                    </div>
                  </div>

                  <div className={styles.taskRight}>
                    <div className={styles.taskAction}>
                      <NotePencil size={20} color="#4b5563" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.behaviorOverview}>
            <div className={styles.overviewInfo}>
              <h4>TỔNG QUAN</h4>
              <span className={styles.overviewTitle}>Hoạt động lớp học</span>
              <p>Hệ thống hỗ trợ cập nhật điểm và quản lý lớp học trực tiếp theo thời gian thực.</p>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}
