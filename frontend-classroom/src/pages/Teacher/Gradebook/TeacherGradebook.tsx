import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
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
import NumberStepper from "../../../components/ui/NumberStepper";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { gradebookService } from "../../../service/gradebook.service";
import type { IAssignment, IGrade, IGradebookStudent } from "../../../service/gradebook.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";
import { Table, Avatar as HeroAvatar } from "@heroui/react";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stateClassId = location.state?.classId || searchParams.get("classId");

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
  const [newCategory, setNewCategory] = useState("homework");

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

  // Tải bảng điểm của lớp được chọn
  const loadGradebook = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingData(true);
    try {
      const res = await gradebookService.getClassroomGrades(selectedClassId);
      if (res.data) {
        setStudents(res.data.students || []);
        const order: Record<string, number> = { attitude: 1, homework: 2, periodic: 3, mock_exam: 4 };
        const sortedAssignments = (res.data.assignments || []).sort((a, b) => (order[a.category] || 9) - (order[b.category] || 9));
        setAssignments(sortedAssignments);
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
      setNewCategory("homework");
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
      homework: 1,
      attitude: 1,
      periodic: 1,
      mock_exam: 1,
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
                  <DropdownMenuContent className="min-w-56 w-max bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
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
                          className={`px-3 py-2 text-sm whitespace-nowrap text-slate-700 hover:!bg-orange-50 hover:!text-orange-600 focus:!bg-orange-50 focus:!text-orange-600 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedClassId === cls._id ? "bg-orange-50 text-orange-600 font-semibold" : ""
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
            <AnimatedAddButton onClick={handleSaveGrades} disabled={saving || students.length === 0}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </AnimatedAddButton>
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
            <Table>
              <Table.ScrollContainer className="w-full">
                <Table.Content
                  aria-label="Bảng điểm học sinh"
                  className="w-full bg-white p-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                >
                  <Table.Header>
                    <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 left-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.03)]" id="student">Học sinh</Table.Column>
                    {(() => {
                      const renderAssignmentColumn = (a: any) => {
                        const categoryLabels: Record<string, string> = {
                          attitude: "Chuyên cần / Thái độ",
                          homework: "Bài tập về nhà",
                          periodic: "Kiểm tra định kỳ",
                          mock_exam: "Thi thử",
                        };
                        const categoryBgs: Record<string, string> = {
                          attitude: "bg-blue-50/60",
                          homework: "bg-emerald-50/60",
                          periodic: "bg-amber-50/60",
                          mock_exam: "bg-rose-50/60",
                        };
                        const categoryTexts: Record<string, string> = {
                          attitude: "text-blue-700",
                          homework: "text-emerald-700",
                          periodic: "text-amber-700",
                          mock_exam: "text-rose-700",
                        };
                        const label = categoryLabels[a.category] || a.category;
                        const bgClass = categoryBgs[a.category] || "bg-slate-50";
                        const textClass = categoryTexts[a.category] || "text-slate-600";

                        return (
                          <Table.Column className={`${bgClass} text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 z-20`} key={a._id} id={a._id}>
                            <div className={textClass} style={{ opacity: 0.9, marginBottom: 2 }}>{label}</div>
                            <div className="truncate max-w-[120px] capitalize font-medium text-slate-700" title={a.title}>{a.title}</div>
                          </Table.Column>
                        );
                      };

                      return (
                        <>
                          {assignments.map(renderAssignmentColumn)}
                        </>
                      );
                    })()}
                    <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 right-[120px] z-30 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]" id="avg">ĐTB</Table.Column>
                    <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 right-0 z-30" id="rank">Xếp loại</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {students.length === 0 ? (
                      <Table.Row key="empty" id="empty">
                        <Table.Cell />
                        {assignments.map(a => <Table.Cell key={a._id} />)}
                        <Table.Cell>
                          <div className="py-10 text-center text-slate-500 font-medium whitespace-nowrap">
                            Lớp học này chưa có học sinh nào.
                          </div>
                        </Table.Cell>
                        <Table.Cell />
                      </Table.Row>
                    ) : (
                      students.map((student) => {
                        const { bg, color } = getAvatarColor(student.name);
                        const avg = calculateStudentAvg(student._id);
                        const rank = getRank(avg);

                        return (
                          <Table.Row key={student._id} id={student._id} className="group hover:bg-slate-50/50 transition-colors">
                            <Table.Cell className="py-3 px-4 border-b border-slate-100 min-w-[250px] sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_12px_rgba(0,0,0,0.03)] transition-colors">
                              <div className="flex items-center gap-3">
                                <HeroAvatar size="md" className="border border-slate-100 shadow-sm font-semibold flex-shrink-0" style={{ backgroundColor: bg, color: color }}>
                                  <HeroAvatar.Fallback>{getInitials(student.name)}</HeroAvatar.Fallback>
                                </HeroAvatar>
                                <div className="min-w-0 flex-1">
                                  <span className="block font-bold text-slate-800 text-[14px] truncate max-w-[180px]" title={student.name}>{student.name}</span>
                                  <span className="block text-xs text-slate-500 mt-[2px] truncate max-w-[180px]" title={student.email}>{student.email}</span>
                                </div>
                              </div>
                            </Table.Cell>
                            {assignments.map(a => {
                              const categoryBgs: Record<string, string> = {
                                attitude: "bg-blue-50/30 hover:bg-blue-50/60",
                                homework: "bg-emerald-50/30 hover:bg-emerald-50/60",
                                periodic: "bg-amber-50/30 hover:bg-amber-50/60",
                                mock_exam: "bg-rose-50/30 hover:bg-rose-50/60",
                              };
                              const bgClass = categoryBgs[a.category] || "";

                              return (
                                <Table.Cell className={`py-3 px-4 border-b border-slate-100 ${bgClass} transition-colors`} key={a._id}>
                                  <NumberStepper
                                    value={editingScores[`${student._id}_${a._id}`] ?? ""}
                                    onChange={(val) => handleScoreChange(student._id, a._id, val.toString())}
                                    step={0.1}
                                    min={0}
                                    max={a.maxScore}
                                    onOutOfBounds={(val) => {
                                      if (val > a.maxScore) {
                                        toast.warning(`Điểm không được vượt quá ${a.maxScore}!`);
                                      } else if (val < 0) {
                                        toast.warning("Điểm không được nhỏ hơn 0!");
                                      }
                                    }}
                                  />
                                </Table.Cell>
                              );
                            })}
                            <Table.Cell className="py-3 px-4 border-b border-slate-100 sticky right-[120px] z-10 bg-white group-hover:bg-slate-50 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] transition-colors">
                              <span className={styles.avgValue}>
                                {avg !== null ? avg.toFixed(2) : "-"}
                              </span>
                            </Table.Cell>
                            <Table.Cell className="py-3 px-4 border-b border-slate-100 sticky right-0 z-10 bg-white group-hover:bg-slate-50 transition-colors">
                              <span className={`${styles.rankBadge} ${rank.cls}`}>
                                {rank.text}
                              </span>
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
                        {task.category === 'attitude' ? 'Chuyên cần / Thái độ' :
                          task.category === 'homework' ? 'Bài tập về nhà' :
                            task.category === 'periodic' ? 'Kiểm tra định kỳ' : 
                              task.category === 'mock_exam' ? 'Thi thử' : task.category} (Hệ số 1) • Hạn nộp: {new Date(task.dueDate).toLocaleDateString('vi-VN')} • Max: {task.maxScore} điểm
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
