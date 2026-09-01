/**
 * ============================================================================
 * TÊN FILE: TeacherGradebook.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Teacher/Gradebook/TeacherGradebook.tsx
 * MỤC ĐÍCH:
 *   Giao diện Sổ Điểm Điện Tử (Teacher Gradebook) cho Giáo viên.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Hiển thị ma trận Bảng điểm: Hàng = Danh sách học sinh trong lớp; Cột = Danh sách các bài tập/đề thi.
 *   - Cho phép nhập điểm trực tiếp trên ô bảng, tính tự động Điểm trung bình môn (GPA) của từng học sinh.
 *   - Hỗ trợ xuất dữ liệu Sổ điểm ra tệp Excel (`ExportExcelBtn`) và nhập danh sách điểm từ file Excel (`ImportExcelBtn`).
 *   - Lọc học sinh theo từ khóa tìm kiếm và chọn nhanh lớp học qua combobox.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  NotePencil,
  Article,
  Spinner,
  CaretDown,
  WarningCircle,
  Funnel,
  MagnifyingGlass,
  Paperclip,
  FileText,
  CheckCircle,
  Clock,
} from "phosphor-react";
import { CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import NumberStepper from "../../../components/ui/FormControls/NumberStepper";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { gradebookService } from "../../../service/gradebook.service";
import type { IAssignment, IGrade, IGradebookStudent } from "../../../service/gradebook.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { AnimatedAddButton } from "../../../components/ui/Buttons/AnimatedAddButton";
import { Table, Avatar as HeroAvatar } from "@heroui/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import * as XLSX from "xlsx";
import { ExcelImportButton, ExcelExportButton } from "../../../components/ui/Buttons/ExcelButtons";
import { activityService } from "../../../service/activity.service";
import { io } from "socket.io-client";
import FocusGradingModal from "../ClassroomDetail/components/grading/FocusGradingModal";
import styles from "./TeacherGradebook.module.scss";

// Helpers xử lý định dạng file cho FocusGradingModal
const getFileExt = (filename?: string) => {
  if (!filename) return "";
  const clean = filename.split("?")[0].split("#")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

const formatCleanFileName = (rawName?: string, rawUrl?: string) => {
  if (rawName && rawName.trim()) return rawName;
  if (!rawUrl) return "Tệp đính kèm";
  try {
    const clean = rawUrl.split("?")[0].split("#")[0];
    const filename = clean.split("/").pop() || "Tệp đính kèm";
    return decodeURIComponent(filename);
  } catch {
    return "Tệp đính kèm";
  }
};

const formatFileSize = (bytes?: any) => {
  if (bytes === undefined || bytes === null || isNaN(Number(bytes))) return null;
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const formatFileUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

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
  const [submissions, setSubmissions] = useState<any[]>([]);

  const submissionsMap = useMemo(() => {
    const map: Record<string, any> = {};
    submissions.forEach(s => {
      const sId = typeof s.studentId === 'object' && s.studentId !== null ? s.studentId._id : s.studentId;
      const aId = typeof s.assignmentId === 'object' && s.assignmentId !== null ? s.assignmentId._id : s.assignmentId;
      if (sId && aId) {
        map[`${sId}_${aId}`] = s;
      }
    });
    return map;
  }, [submissions]);

  // Hiển thị trạng thái ô khi chưa có điểm trong Sổ điểm (Chưa chấm / Chưa nhập)
  const getNoScoreDisplay = (student: IGradebookStudent, assignment: IAssignment) => {
    const cellKey = `${student._id}_${assignment._id}`;
    const sub = submissionsMap[cellKey];

    // Nếu học sinh đã nộp bài làm/file nhưng chưa được chấm điểm
    if (sub && (sub.submissionText || (sub.attachments && sub.attachments.length > 0) || sub.status === 'submitted' || sub.status === 'late')) {
      return {
        text: "Chưa chấm",
        cls: "text-amber-700 bg-amber-50 border-amber-200/90 hover:bg-amber-100"
      };
    }

    // Trạng thái mặc định khi chưa có điểm
    return {
      text: "Chưa nhập",
      cls: "text-slate-400 bg-slate-50 border-slate-200/70 hover:bg-slate-100 hover:text-slate-600"
    };
  };

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

  // Modal Chấm bài chi tiết & Sửa điểm nhanh (FocusGradingModal)
  const [focusGradingSub, setFocusGradingSub] = useState<any | null>(null);
  const [focusGradingAssignment, setFocusGradingAssignment] = useState<IAssignment | null>(null);
  const [focusGradingSubmissions, setFocusGradingSubmissions] = useState<any[]>([]);
  const [gradingData, setGradingData] = useState<Record<string, { score: number | string; feedback: string }>>({});
  const [isSavingFocusGrades, setIsSavingFocusGrades] = useState(false);

  // Mở FocusGradingModal khi click vào bất kỳ ô điểm nào trên bảng Sổ điểm
  const handleOpenFocusGradingModal = (student: IGradebookStudent, assignment: IAssignment) => {
    const cellKey = `${student._id}_${assignment._id}`;
    const existingSub = submissionsMap[cellKey];
    const currentScore = editingScores[cellKey] ?? "";

    // Danh sách bài nộp (thật hoặc ảo) của toàn bộ học sinh trong lớp đối với bài tập này
    const allSubsForAssignment = students.map((s) => {
      const sKey = `${s._id}_${assignment._id}`;
      const sub = submissionsMap[sKey];
      const sScore = editingScores[sKey] ?? "";
      return (
        sub || {
          _id: `virtual_${s._id}_${assignment._id}`,
          studentId: s,
          assignmentId: assignment._id,
          submissionText: "",
          attachments: [],
          score: sScore !== "" ? Number(sScore) : undefined,
          status: "pending",
          submittedAt: null,
          feedback: ""
        }
      );
    });

    const activeSub =
      existingSub ||
      allSubsForAssignment.find((sub) => {
        const subStudentId = typeof sub.studentId === "object" ? sub.studentId._id : sub.studentId;
        return subStudentId === student._id;
      }) || {
        _id: `virtual_${student._id}_${assignment._id}`,
        studentId: student,
        assignmentId: assignment._id,
        submissionText: "",
        attachments: [],
        score: currentScore !== "" ? Number(currentScore) : undefined,
        status: "pending",
        submittedAt: null,
        feedback: ""
      };

    // Khởi tạo gradingData cho tất cả học sinh trong lớp
    const initialGradingData: Record<string, { score: number | string; feedback: string }> = {};
    students.forEach((s) => {
      const sKey = `${s._id}_${assignment._id}`;
      const sSub = submissionsMap[sKey];
      const sScore = editingScores[sKey] ?? "";
      initialGradingData[s._id] = {
        score: sScore !== "" ? sScore : sSub?.score !== undefined && sSub?.score !== null ? String(sSub.score) : "",
        feedback: sSub?.feedback || ""
      };
    });

    setGradingData(initialGradingData);
    setFocusGradingAssignment(assignment);
    setFocusGradingSubmissions(allSubsForAssignment);
    setFocusGradingSub(activeSub);
  };

  // Lưu điểm & nhận xét từ FocusGradingModal
  const handleSaveFocusGrades = async () => {
    if (!focusGradingAssignment || !focusGradingSub) return;

    const studentObj =
      typeof focusGradingSub.studentId === "object"
        ? focusGradingSub.studentId
        : { _id: focusGradingSub.studentId, name: "Học sinh" };
    const studentIdStr = studentObj._id;

    const currentGrade = gradingData[studentIdStr];
    if (!currentGrade) return;

    const rawScore = currentGrade.score;
    if (rawScore === "" || rawScore === undefined || rawScore === null) {
      toast.warning("Vui lòng chọn hoặc nhập điểm số!");
      return;
    }

    const scoreNum = Number(rawScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > focusGradingAssignment.maxScore) {
      toast.error(`Điểm số phải nằm trong khoảng từ 0 đến ${focusGradingAssignment.maxScore}!`);
      return;
    }

    setIsSavingFocusGrades(true);
    try {
      await gradebookService.saveGrades({
        assignmentId: focusGradingAssignment._id,
        grades: [
          {
            studentId: studentIdStr,
            score: scoreNum,
            feedback: currentGrade.feedback || ""
          }
        ]
      });

      toast.success(`Đã lưu điểm ${scoreNum} cho học sinh ${studentObj.name || ""}!`);

      // Cập nhật state hiển thị trực tiếp trên Sổ điểm
      setEditingScores((prev) => ({
        ...prev,
        [`${studentIdStr}_${focusGradingAssignment._id}`]: String(scoreNum)
      }));

      loadGradebook();
    } catch {
      toast.error("Lưu điểm thất bại, vui lòng thử lại!");
    } finally {
      setIsSavingFocusGrades(false);
    }
  };

  // State chọn học sinh để xem chi tiết
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<IGradebookStudent | null>(null);

  // State ô điểm đang được click để sửa điểm (studentId_assignmentId)
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);

  // Điểm số đang được chỉnh sửa tạm thời trên bảng (chưa lưu xuống DB)
  // Cấu trúc: { [studentId_assignmentId]: scoreValue }
  const [editingScores, setEditingScores] = useState<{ [key: string]: string }>({});

  // State chỉnh sửa bài tập nhanh
  const [selectedAssignmentForEdit, setSelectedAssignmentForEdit] = useState<IAssignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(10);
  const [editCategory, setEditCategory] = useState("homework");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Tính điểm trung bình của học sinh dựa theo các điểm số nhập vào (quy đổi về thang điểm 10)
  const calculateStudentAvg = useCallback((studentId: string) => {
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
  }, [assignments, editingScores]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Lọc theo từ khóa tìm kiếm (Tên/Email)
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Lọc theo bộ lọc trạng thái điểm / nhóm học lực
      const avg = calculateStudentAvg(student._id);

      if (gradeFilter === "no_grade") {
        return avg === null;
      }
      if (gradeFilter === "low_score") {
        return avg !== null && avg < 6.5;
      }
      if (gradeFilter === "high_score") {
        return avg !== null && avg >= 8.0;
      }

      return true;
    });
  }, [students, searchQuery, gradeFilter, calculateStudentAvg]);

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
        if ((res.data as any).submissions) {
          setSubmissions((res.data as any).submissions || []);
        }

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

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("submission_update", (data?: { assignmentId?: string; classId?: string }) => {
      if (!data?.classId || data.classId === selectedClassId) {
        console.log("⚡ [Socket.io Realtime] Sổ điểm có bài nộp/cập nhật điểm mới, tự động làm mới...");
        loadGradebook();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loadGradebook, selectedClassId]);

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

    if (newDueDate) {
      const selectedTime = new Date(newDueDate).getTime();
      if (!isNaN(selectedTime) && selectedTime < Date.now() - 60000) {
        toast.error("Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.");
        return;
      }
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

    const knownCategories = ["homework", "periodic", "mock_exam", "attitude"];
    if (task.category && !knownCategories.includes(task.category)) {
      setEditCategory("custom");
      setEditCustomCategory(task.category);
    } else {
      setEditCategory(task.category || "homework");
      setEditCustomCategory("");
    }

    setEditAllowMultiple(task.allowMultipleSubmissions ?? false);
  };

  // Lưu chỉnh sửa bài tập
  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForEdit) return;

    const finalCategory = editCategory === "custom" ? editCustomCategory : editCategory;
    if (editCategory === "custom" && !editCustomCategory.trim()) {
      toast.error("Vui lòng nhập tên phân loại bài tập tùy chỉnh!");
      return;
    }

    if (editDueDate) {
      const selectedTime = new Date(editDueDate).getTime();
      if (!isNaN(selectedTime) && selectedTime < Date.now() - 60000) {
        toast.error("Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.");
        return;
      }
    }

    setUpdatingAssignment(true);
    try {
      await activityService.updateActivity(selectedAssignmentForEdit._id, {
        title: editTitle,
        dueDate: editDueDate,
        maxScore: editMaxScore,
        category: finalCategory,
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



  const getRank = (avg: number | null) => {
    if (avg === null) return { text: "Chưa có", cls: styles.rankAvg };
    if (avg >= 9.0) return { text: "Xuất sắc", cls: styles.rankExcellent };
    if (avg >= 8.0) return { text: "Giỏi", cls: styles.rankGood };
    if (avg >= 6.5) return { text: "Khá", cls: styles.rankGood };
    if (avg >= 5.0) return { text: "TB", cls: styles.rankAvg };
    return { text: "Yếu", cls: styles.rankAvg };
  };

  // Thống kê tổng quan nhanh phía trên bảng điểm
  const classStats = useMemo(() => {
    if (students.length === 0) return { totalStudents: 0, classAvg: "—", noGradeCount: 0 };
    const avgs = students.map(s => calculateStudentAvg(s._id)).filter(v => v !== null) as number[];
    const classAvg = avgs.length > 0 ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2) : "—";
    const noGradeCount = students.filter(s => calculateStudentAvg(s._id) === null).length;
    return {
      totalStudents: students.length,
      classAvg,
      noGradeCount
    };
  }, [students, editingScores, assignments]);

  return (
    <div className={styles.gradebookContainer}>

      {/* 1. CHI TIẾT SỔ ĐIỂM (TOP TABLE) */}
      <section className={styles.topSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerInfo}>
            <h2>Chi tiết Sổ điểm</h2>
          </div>
          <div className={styles.headerActions} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {students.length > 0 && (
              <>
                <ExcelImportButton onFileSelect={handleImportExcel} disabled={saving} />
                <ExcelExportButton onClick={handleExportExcel} disabled={saving} />
              </>
            )}
          </div>
        </div>

        {/* THANH TÌM KIẾM, BỘ LỌC HỌC SINH VÀ BỘ LỌC LỚP HỌC */}
        <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex-wrap">
          {/* 1. Ô Tìm kiếm Học sinh */}
          {students.length > 0 && (
            <div className="relative w-64 min-w-[200px]">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* 2. Bộ lọc trạng thái điểm học sinh */}
          {students.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200/80 rounded-xl bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs outline-none cursor-pointer whitespace-nowrap">
                  <Funnel size={14} className="text-orange-500" />
                  <span>
                    {gradeFilter === "all" ? "Tất cả học sinh" :
                      gradeFilter === "no_grade" ? "Chưa có điểm" :
                        gradeFilter === "low_score" ? "Điểm thấp (< 6.5)" :
                          gradeFilter === "high_score" ? "Điểm cao (≥ 8.0)" : "Bộ lọc"}
                  </span>
                  <CaretDown size={12} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                <DropdownMenuItem onClick={() => setGradeFilter("all")} className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer flex justify-between items-center ${gradeFilter === "all" ? "bg-orange-50 text-orange-600 font-bold" : "text-slate-700 hover:bg-slate-50"}`}>
                  Tất cả học sinh
                  {gradeFilter === "all" && <CheckIcon className="w-3.5 h-3.5 text-orange-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGradeFilter("no_grade")} className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer flex justify-between items-center ${gradeFilter === "no_grade" ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-700 hover:bg-slate-50"}`}>
                  Chưa có điểm
                  {gradeFilter === "no_grade" && <CheckIcon className="w-3.5 h-3.5 text-amber-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGradeFilter("low_score")} className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer flex justify-between items-center ${gradeFilter === "low_score" ? "bg-rose-50 text-rose-600 font-bold" : "text-slate-700 hover:bg-slate-50"}`}>
                  Điểm thấp (&lt; 6.5)
                  {gradeFilter === "low_score" && <CheckIcon className="w-3.5 h-3.5 text-rose-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGradeFilter("high_score")} className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer flex justify-between items-center ${gradeFilter === "high_score" ? "bg-emerald-50 text-emerald-600 font-bold" : "text-slate-700 hover:bg-slate-50"}`}>
                  Điểm cao (&ge; 8.0)
                  {gradeFilter === "high_score" && <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 3. Bộ lọc Chọn Lớp học (Đưa xuống cuối & nới rộng width) */}
          <div className="min-w-[240px] max-w-[280px]">
            {loadingClasses ? (
              <div className="w-56 h-9 bg-slate-200/60 rounded-xl animate-pulse" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between gap-2 px-3.5 py-2 border border-slate-200/80 rounded-xl bg-white hover:border-slate-300 text-xs font-bold text-slate-800 transition-colors shadow-2xs outline-none cursor-pointer w-full">
                    <span className="truncate max-w-[220px]" title={selectedClass ? `${selectedClass.name}${selectedClass.subject ? ` (${selectedClass.subject})` : ""}` : "Chọn lớp học"}>
                      {selectedClass
                        ? `${selectedClass.name}${selectedClass.subject ? ` (${selectedClass.subject})` : ""}`
                        : "Chọn lớp học"}
                    </span>
                    <CaretDown size={12} className="text-slate-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-64 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                  {classes.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">Chưa có lớp nào</div>
                  ) : (
                    classes.map((cls) => (
                      <DropdownMenuItem
                        key={cls._id}
                        onClick={() => {
                          setSelectedClassId(cls._id);
                          setSearchParams({ classId: cls._id }, { replace: true });
                        }}
                        className={`px-3 py-2 text-xs whitespace-nowrap text-slate-700 hover:!bg-orange-50 hover:!text-orange-600 focus:!bg-orange-50 focus:!text-orange-600 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedClassId === cls._id ? "bg-orange-50 text-orange-600 font-bold" : ""
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

        {/* THANH TỔNG QUAN NGẮN PHÍA TRÊN BẢNG */}
        {students.length > 0 && (
          <div className="flex items-center justify-between gap-4 py-2.5 px-4 mb-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Sĩ số lớp:</span>
                <strong className="text-slate-800 font-extrabold text-sm">{classStats.totalStudents} học sinh</strong>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">ĐTB cả lớp:</span>
                <strong className="text-[#f47c20] font-extrabold text-sm">{classStats.classAvg}</strong>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Chưa có điểm:</span>
                <strong className={classStats.noGradeCount > 0 ? "text-amber-600 font-extrabold text-sm" : "text-emerald-600 font-extrabold text-sm"}>
                  {classStats.noGradeCount} học sinh
                </strong>
              </div>
            </div>
          </div>
        )}

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
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200/90 my-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-100/80 flex items-center justify-center mb-3">
                <Funnel size={24} className="text-orange-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">Không tìm thấy học sinh phù hợp</h4>
              <p className="text-xs text-slate-500 max-w-md text-center mb-4 leading-relaxed">
                {searchQuery
                  ? `Không tìm thấy học sinh nào khớp với từ khóa "${searchQuery}".`
                  : gradeFilter === "no_grade"
                    ? "Tất cả học sinh trong lớp đã được nhập điểm đầy đủ!"
                    : gradeFilter === "low_score"
                      ? "Tuyệt vời! Lớp học không có học sinh nào có điểm trung bình thấp (< 6.5)."
                      : gradeFilter === "high_score"
                        ? "Chưa có học sinh nào có điểm trung bình cao (≥ 8.0)."
                        : "Không tìm thấy dữ liệu học sinh phù hợp."}
              </p>
              {(searchQuery || gradeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setGradeFilter("all");
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer className="w-full overflow-x-auto relative">
                <Table.Content
                  aria-label="Bảng điểm học sinh"
                  className="w-full bg-white p-0 rounded-xl border border-slate-200 shadow-sm"
                >
                  <Table.Header>
                    <Table.Column isRowHeader className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 left-0 z-40 shadow-[4px_0_12px_rgba(0,0,0,0.08)] min-w-[240px]" id="student">Học sinh</Table.Column>
                    {(() => {
                      const renderAssignmentColumn = (a: any) => {
                        const categoryLabels: Record<string, string> = {
                          attitude: "Chuyên cần",
                          homework: "Bài tập",
                          periodic: "Kiểm tra",
                          mock_exam: "Thi thử",
                        };
                        const categoryBgs: Record<string, string> = {
                          attitude: "bg-blue-50/50 hover:bg-blue-50/80",
                          homework: "bg-emerald-50/50 hover:bg-emerald-50/80",
                          periodic: "bg-amber-50/50 hover:bg-amber-50/80",
                          mock_exam: "bg-rose-50/50 hover:bg-rose-50/80",
                        };
                        const categoryTexts: Record<string, string> = {
                          attitude: "text-blue-600",
                          homework: "text-emerald-600",
                          periodic: "text-amber-600",
                          mock_exam: "text-rose-600",
                        };
                        const label = categoryLabels[a.category] || a.category;
                        const bgClass = categoryBgs[a.category] || "bg-slate-50";
                        const textClass = categoryTexts[a.category] || "text-slate-500";
                        const dueDateStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "";

                        return (
                          <Table.Column
                            className={`${bgClass} py-3 px-3.5 border-b border-slate-200 sticky top-0 z-20 cursor-pointer transition-colors min-w-[130px] max-w-[170px]`}
                            key={a._id}
                            id={a._id}
                            onClick={() => handleOpenEditAssignment(a)}
                          >
                            <div className="truncate font-extrabold text-slate-800 text-[13px] capitalize" title={a.title}>
                              {a.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`} title={label}>
                                {label}
                              </span>
                              {dueDateStr && (
                                <span className="text-[10px] font-semibold text-slate-400">
                                  • {dueDateStr}
                                </span>
                              )}
                            </div>
                          </Table.Column>
                        );
                      };

                      return (
                        <>
                          {assignments.map(renderAssignmentColumn)}
                        </>
                      );
                    })()}
                    <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 z-20 text-center min-w-[90px]" id="avg">ĐTB</Table.Column>
                    <Table.Column className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider py-4 px-4 border-b border-slate-200 sticky top-0 z-20 text-center min-w-[110px]" id="rank">Xếp loại</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filteredStudents.map((student) => {
                      const { bg, color } = getAvatarColor(student.name);
                      const avg = calculateStudentAvg(student._id);
                      const rank = getRank(avg);

                      return (
                        <Table.Row key={student._id} id={student._id} className="group hover:bg-slate-50/50 transition-colors">
                          <Table.Cell
                            className="py-3 px-4 border-b border-slate-100 min-w-[240px] sticky left-0 z-30 bg-white group-hover:!bg-slate-50 shadow-[4px_0_12px_rgba(0,0,0,0.06)] transition-colors cursor-pointer"
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
                            const cellKey = `${student._id}_${a._id}`;
                            const val = editingScores[cellKey];
                            const categoryBgs: Record<string, string> = {
                              attitude: "bg-blue-50/20 hover:bg-blue-50/50",
                              homework: "bg-emerald-50/20 hover:bg-emerald-50/50",
                              periodic: "bg-amber-50/20 hover:bg-amber-50/50",
                              mock_exam: "bg-rose-50/20 hover:bg-rose-50/50",
                            };
                            const bgClass = categoryBgs[a.category] || "";

                            return (
                              <Table.Cell
                                className={`py-2 px-3 border-b border-slate-100 ${bgClass} transition-colors text-center align-middle cursor-pointer`}
                                key={a._id}
                                onClick={() => handleOpenFocusGradingModal(student, a)}
                              >
                                <div
                                  className={`h-8 min-w-[64px] max-w-[85px] mx-auto flex items-center justify-center font-bold rounded-lg border select-none cursor-pointer hover:border-[#f47c20] hover:ring-2 hover:ring-[#f47c20]/25 transition-all ${val !== undefined && val !== ""
                                    ? "text-[14px] font-extrabold text-slate-800 bg-white/95 border-slate-200/90 shadow-2xs hover:bg-orange-50/50"
                                    : `text-[11px] ${getNoScoreDisplay(student, a).cls}`
                                    }`}
                                  title="Click để chấm bài chi tiết hoặc sửa điểm nhanh"
                                >
                                  {val !== undefined && val !== "" ? val : getNoScoreDisplay(student, a).text}
                                </div>
                              </Table.Cell>
                            );
                          })}
                          <Table.Cell className="py-3 px-4 border-b border-slate-100 text-center min-w-[90px]">
                            <span className={styles.avgValue}>
                              {avg !== null ? avg.toFixed(2) : "-"}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="py-3 px-4 border-b border-slate-100 text-center min-w-[110px]">
                            <span className={`${styles.rankBadge} ${rank.cls}`}>
                              {rank.text}
                            </span>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
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
              <label className="text-sm font-semibold text-slate-700">Phân loại bài tập</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              >
                <option value="homework">Bài tập về nhà</option>
                <option value="attitude">Chuyên cần / Thái độ</option>
                <option value="periodic">Kiểm tra định kỳ</option>
                <option value="mock_exam">Thi thử</option>
                <option value="custom">+ Lựa chọn khác...</option>
              </select>
              {editCategory === "custom" && (
                <input
                  type="text"
                  placeholder="Nhập loại bài tập tùy chỉnh..."
                  value={editCustomCategory}
                  onChange={(e) => setEditCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-orange-50/30 font-medium text-slate-800"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Hạn nộp</label>
                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
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

      {/* Modal Chấm bài chi tiết & Sửa điểm tập trung (FocusGradingModal) */}
      <FocusGradingModal
        focusGradingSub={focusGradingSub}
        assignmentSubmissions={focusGradingSubmissions}
        selectedAssignment={focusGradingAssignment}
        gradingData={gradingData}
        setGradingData={setGradingData}
        onClose={() => {
          setFocusGradingSub(null);
          setFocusGradingAssignment(null);
        }}
        onSelectSubmission={(sub) => setFocusGradingSub(sub)}
        onSaveGrades={handleSaveFocusGrades}
        isSavingGrades={isSavingFocusGrades}
        getFileExt={getFileExt}
        formatCleanFileName={formatCleanFileName}
        formatFileSize={formatFileSize}
        formatFileUrl={formatFileUrl}
      />
    </div>
  );
}
