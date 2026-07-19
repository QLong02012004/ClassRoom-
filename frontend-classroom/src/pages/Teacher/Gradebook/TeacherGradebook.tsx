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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import * as XLSX from "xlsx";
import { ExcelImportButton, ExcelExportButton } from "../../../components/ui/ExcelButtons";
import { activityService } from "../../../service/activity.service";
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

  // State chọn học sinh để xem chi tiết
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<IGradebookStudent | null>(null);

  // Điểm số đang được chỉnh sửa tạm thời trên bảng (chưa lưu xuống DB)
  // Cấu trúc: { [studentId_assignmentId]: scoreValue }
  const [editingScores, setEditingScores] = useState<{ [key: string]: string }>({});

  // State chỉnh sửa bài tập nhanh
  const [selectedAssignmentForEdit, setSelectedAssignmentForEdit] = useState<IAssignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(10);
  const [editCategory, setEditCategory] = useState("homework");
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = React.useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

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

  // Xuất bảng điểm Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.warning("Không có dữ liệu học sinh để xuất!");
      return;
    }

    // Tạo headers: Email, Học sinh, sau đó là tên các bài tập
    const headers = ["Email", "Học sinh", ...assignments.map(a => `${a.title} (Max: ${a.maxScore})`)];

    // Tạo dữ liệu cho từng hàng
    const rows = students.map(student => {
      const rowData: Record<string, any> = {
        "Email": student.email,
        "Học sinh": student.name,
      };

      assignments.forEach(a => {
        const scoreVal = editingScores[`${student._id}_${a._id}`];
        rowData[`${a.title} (Max: ${a.maxScore})`] = scoreVal !== undefined && scoreVal !== "" ? Number(scoreVal) : "";
      });

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bảng điểm");

    const className = selectedClass ? selectedClass.name : "Lop_hoc";
    XLSX.writeFile(wb, `Bang_diem_${className.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Đã xuất bảng điểm thành công!");
  };

  // Nhập điểm từ file Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (rawRows.length < 2) {
          toast.warning("File Excel không có dữ liệu hoặc sai định dạng!");
          return;
        }

        const headers = rawRows[0] as string[];
        const emailIndex = headers.indexOf("Email");
        const nameIndex = headers.indexOf("Học sinh");

        if (emailIndex === -1) {
          toast.error("Không tìm thấy cột 'Email' trong file Excel!");
          return;
        }

        const assignmentColumnMap: { [colIndex: number]: IAssignment } = {};

        headers.forEach((header, index) => {
          if (index === emailIndex || index === nameIndex || !header) return;

          const foundAssignment = assignments.find(a => {
            const cleanHeader = header.toLowerCase();
            const cleanTitle = a.title.toLowerCase();
            return cleanHeader === cleanTitle || cleanHeader.startsWith(cleanTitle) || cleanTitle.startsWith(cleanHeader);
          });

          if (foundAssignment) {
            assignmentColumnMap[index] = foundAssignment;
          }
        });

        const newScores: { [key: string]: string } = { ...editingScores };
        let importCount = 0;
        let warningCount = 0;

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const email = String(row[emailIndex] || "").trim().toLowerCase();
          if (!email) continue;

          const student = students.find(s => s.email.toLowerCase() === email);
          if (!student) continue;

          Object.keys(assignmentColumnMap).forEach(colIndexStr => {
            const colIndex = Number(colIndexStr);
            const assignment = assignmentColumnMap[colIndex];
            const rawScore = row[colIndex];

            if (rawScore !== undefined && rawScore !== null && rawScore !== "") {
              const scoreNum = Number(rawScore);
              if (isNaN(scoreNum)) {
                warningCount++;
                return;
              }

              if (scoreNum < 0 || scoreNum > assignment.maxScore) {
                warningCount++;
                const boundedScore = Math.max(0, Math.min(assignment.maxScore, scoreNum));
                newScores[`${student._id}_${assignment._id}`] = String(boundedScore);
              } else {
                newScores[`${student._id}_${assignment._id}`] = String(scoreNum);
              }
              importCount++;
            }
          });
        }

        setEditingScores(newScores);
        if (warningCount > 0) {
          toast.warning(`Đã nhập ${importCount} cột điểm. Có ${warningCount} điểm số không hợp lệ đã được tự động điều chỉnh.`);
        } else if (importCount > 0) {
          toast.success(`Đã nhập điểm từ Excel thành công cho ${importCount} lượt điểm!`);
        } else {
          toast.warning("Không tìm thấy cột điểm phù hợp để nhập!");
        }

      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi đọc file Excel, vui lòng kiểm tra lại định dạng!");
      }

      e.target.value = "";
    };

    reader.readAsBinaryString(file);
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

  // Mở modal chỉnh sửa nhanh bài tập
  const handleOpenEditAssignment = (task: IAssignment) => {
    setSelectedAssignmentForEdit(task);
    setEditTitle(task.title);
    const dateStr = task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 16) : "";
    setEditDueDate(dateStr);
    setEditMaxScore(task.maxScore);
    setEditCategory(task.category);
    setEditAllowMultiple(task.allowMultipleSubmissions ?? false);
  };

  // Lưu chỉnh sửa bài tập
  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForEdit) return;

    setUpdatingAssignment(true);
    try {
      await activityService.updateActivity(selectedAssignmentForEdit._id, {
        title: editTitle,
        dueDate: editDueDate,
        maxScore: editMaxScore,
        category: editCategory,
        allowMultipleSubmissions: editAllowMultiple
      });
      toast.success("Cập nhật bài tập thành công!");
      setSelectedAssignmentForEdit(null);
      loadGradebook();
    } catch {
      toast.error("Cập nhật bài tập thất bại!");
    } finally {
      setUpdatingAssignment(false);
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
          <div className={styles.headerActions} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {students.length > 0 && (
              <input
                type="text"
                placeholder="Tìm kiếm học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '200px',
                  transition: 'all 0.15s',
                }}
                className="focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            )}
            {students.length > 0 && (
              <>
                <ExcelImportButton onFileSelect={handleImportExcel} disabled={saving} />
                <ExcelExportButton onClick={handleExportExcel} disabled={saving} />
              </>
            )}
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
                    <Table.Column isRowHeader className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 left-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.03)]" id="student">Học sinh</Table.Column>
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
                          <Table.Column
                            className={`${bgClass} text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 z-20 cursor-pointer hover:bg-slate-100/85 transition-colors`}
                            key={a._id}
                            id={a._id}
                            onClick={() => handleOpenEditAssignment(a)}
                          >
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
                    {filteredStudents.length === 0 ? (
                      <Table.Row key="empty" id="empty">
                        <Table.Cell />
                        {assignments.map(a => <Table.Cell key={a._id} />)}
                        <Table.Cell>
                          <div className="py-10 text-center text-slate-500 font-medium whitespace-nowrap">
                            Không tìm thấy học sinh nào phù hợp.
                          </div>
                        </Table.Cell>
                        <Table.Cell />
                      </Table.Row>
                    ) : (
                      filteredStudents.map((student) => {
                        const { bg, color } = getAvatarColor(student.name);
                        const avg = calculateStudentAvg(student._id);
                        const rank = getRank(avg);

                        return (
                          <Table.Row key={student._id} id={student._id} className="group hover:bg-slate-50/50 transition-colors">
                            <Table.Cell
                              className="py-3 px-4 border-b border-slate-100 min-w-[250px] sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_12px_rgba(0,0,0,0.03)] transition-colors cursor-pointer"
                              onClick={() => setSelectedStudentForDetails(student)}
                            >
                              <div className="flex items-center gap-3" title="Click để xem bảng điểm chi tiết">
                                <HeroAvatar size="md" className="border border-slate-100 shadow-sm font-semibold flex-shrink-0" style={{ backgroundColor: bg, color: color }}>
                                  <HeroAvatar.Fallback>{getInitials(student.name)}</HeroAvatar.Fallback>
                                </HeroAvatar>
                                <div className="min-w-0 flex-1">
                                  <span className="block font-bold text-slate-800 text-[14px] truncate max-w-[180px] group-hover:text-primary transition-colors" title={student.name}>{student.name}</span>
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
                <div
                  key={task._id}
                  className={styles.assignmentCard}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenEditAssignment(task)}
                >
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
                    <button
                      type="button"
                      className={styles.taskAction}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditAssignment(task);
                      }}
                    >
                      <NotePencil size={20} color="#4b5563" />
                    </button>
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
      {/* Modal Chi tiết điểm học sinh */}
      <Dialog open={selectedStudentForDetails !== null} onOpenChange={(open) => { if (!open) setSelectedStudentForDetails(null); }}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <HeroAvatar size="md" className="border border-slate-100 shadow-sm font-semibold" style={selectedStudentForDetails ? getAvatarColor(selectedStudentForDetails.name) : {}}>
                <HeroAvatar.Fallback>{selectedStudentForDetails ? getInitials(selectedStudentForDetails.name) : ""}</HeroAvatar.Fallback>
              </HeroAvatar>
              <div>
                <span className="block text-slate-800 font-bold">{selectedStudentForDetails?.name}</span>
                <span className="block text-xs font-semibold text-slate-400 mt-0.5">{selectedStudentForDetails?.email}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
              Báo cáo học tập chi tiết của học sinh trong lớp học hiện tại.
            </DialogDescription>
          </DialogHeader>

          {selectedStudentForDetails && (
            <div className="mt-4 flex flex-col gap-6">
              {/* Thống kê chung */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center">
                  <span className="block text-xs font-bold text-orange-600 uppercase">Điểm trung bình (ĐTB)</span>
                  <span className="block text-3xl font-black text-orange-700 mt-1">
                    {calculateStudentAvg(selectedStudentForDetails._id) !== null
                      ? calculateStudentAvg(selectedStudentForDetails._id)!.toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <span className="block text-xs font-bold text-emerald-600 uppercase">Xếp loại học lực</span>
                  <span className="block text-3xl font-black text-emerald-700 mt-1">
                    {getRank(calculateStudentAvg(selectedStudentForDetails._id)).text}
                  </span>
                </div>
              </div>

              {/* Bảng điểm chi tiết */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-600">Bài tập / Bài kiểm tra</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Loại</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center w-[120px]">Điểm đạt được</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {assignments.map(a => {
                      const val = editingScores[`${selectedStudentForDetails._id}_${a._id}`];
                      const categoryLabels: Record<string, string> = {
                        attitude: "Chuyên cần",
                        homework: "Bài tập",
                        periodic: "Định kỳ",
                        mock_exam: "Thi thử",
                      };
                      const categoryColors: Record<string, string> = {
                        attitude: "bg-blue-50 text-blue-600",
                        homework: "bg-emerald-50 text-emerald-600",
                        periodic: "bg-amber-50 text-amber-600",
                        mock_exam: "bg-rose-50 text-rose-600",
                      };
                      return (
                        <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-slate-800 capitalize">{a.title}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${categoryColors[a.category] || 'bg-slate-100 text-slate-600'}`}>
                              {categoryLabels[a.category] || a.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                            {val !== undefined && val !== "" ? `${val} / ${a.maxScore}` : <span className="text-slate-300 italic">Chưa nhập</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Chỉnh sửa nhanh bài tập */}
      <Dialog open={selectedAssignmentForEdit !== null} onOpenChange={(open) => { if (!open) setSelectedAssignmentForEdit(null); }}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
              Chỉnh sửa bài tập
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
              Cập nhật các thông tin cơ bản cho bài tập này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAssignment} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Tiêu đề bài tập</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Phân loại điểm</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              >
                <option value="attitude">Chuyên cần / Thái độ</option>
                <option value="homework">Bài tập về nhà</option>
                <option value="periodic">Kiểm tra định kỳ</option>
                <option value="mock_exam">Thi thử</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Hạn nộp</label>
                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Điểm tối đa</label>
                <div style={{ display: 'flex' }}>
                  <NumberStepper
                    value={editMaxScore}
                    onChange={(val) => setEditMaxScore(Number(val))}
                    min={1}
                    max={100}
                    step={1}
                    fullWidth
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="editAllowMultiple"
                checked={editAllowMultiple}
                onChange={(e) => setEditAllowMultiple(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#FE6747' }}
              />
              <label htmlFor="editAllowMultiple" style={{ cursor: 'pointer', margin: 0, fontWeight: 500, fontSize: '0.9rem', color: '#475569' }}>
                Cho phép học sinh nộp bài nhiều lần
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setSelectedAssignmentForEdit(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={updatingAssignment}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {updatingAssignment ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
