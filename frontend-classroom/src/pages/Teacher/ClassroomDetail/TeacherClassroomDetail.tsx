import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
 
  FilePdf,
  DotsThree,
  Trash,
  X,
  Megaphone,
  Bell,
  BookOpen,
  Clock,
  CalendarBlank,
  Plus,
  ArrowLeft,
  Eye,
  CheckCircle,
  PencilSimple,
  Users,
  DotsSixVertical,
  Image,
  X as XIcon,
  ChatCircleText,
  ClipboardText,
  PushPin
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { quizService } from "../../../service/quiz.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
import * as XLSX from "xlsx";
import { Button } from "../../../components/ui/button";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";
import FolderUpload from "../../../components/ui/FolderUpload/FolderUpload";
import FolderFileCard from "../../../components/ui/FolderUpload/FolderFileCard";
import Switch3D from "../../../components/ui/Switch3D";
import Checkbox from "../../../components/ui/Checkbox/Checkbox";
import { CustomConfirmDialog } from "../../../components/ui/CustomConfirmDialog";
import AnimatedSendButton from "../../../components/ui/AnimatedSendButton";
import CustomImageUpload from "../../../components/ui/CustomImageUpload";
import NumberStepper from "../../../components/ui/NumberStepper";
import AiGenerateButton from "../../../components/ui/AiGenerateButton/AiGenerateButton";
import FolderImportButton from "../../../components/ui/FolderImportButton/FolderImportButton";
import CustomRadio from "../../../components/ui/CustomRadio/CustomRadio";
import styles from "./TeacherClassroomDetail.module.scss";

export default function TeacherClassroomDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "overview") as "overview" | "reports" | "schedule" | "quizzes";
  const toast = useToast();
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || localStorage.getItem("userRole") || "TEACHER";
  const username = user?.name || localStorage.getItem("username") || "Giáo viên";
  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;

  const [classroom, setClassroom] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [filterChip, setFilterChip] = useState<"all" | "reminder" | "material" | "assignment">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [sendingComment, setSendingComment] = useState<string | null>(null);

  // State cho trắc nghiệm
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(quizzes.length / itemsPerPage);
  const currentQuizzes = quizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getQuizStatus = (quizItem: any) => {
    const status = quizItem.status || 'open';
    if (status === 'draft') return { label: "Bản nháp", class: styles.statusDraft };
    if (status === 'closed') return { label: "Đã đóng", class: styles.statusClosed };
    return { label: "Đang mở", class: styles.statusOpen };
  };

  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  const [isDeleteQuizDialogOpen, setIsDeleteQuizDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  // Form states cho tạo đề trắc nghiệm
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState(15);
  const [defaultPoints, setDefaultPoints] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    imageUrl?: string;
    optionImages?: string[];
    points?: number;
  }>>([
    { questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }
  ]);
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(0);
  const [errorQuestionIndex, setErrorQuestionIndex] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<Record<number, boolean>>({});

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewQIndex, setPreviewQIndex] = useState(0);

  // Drag & Drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    const updated = [...quizQuestions];
    const [moved] = updated.splice(from, 1);
    updated.splice(index, 0, moved);
    setQuizQuestions(updated);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // State cho việc đăng bài mới
  const [postText, setPostText] = useState("");
  const [replyText, setReplyText] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea khi nhấn nút CTA
  const handleFocusComposer = () => {
    if (composerRef.current) {
      composerRef.current.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fileImportRef = useRef<HTMLInputElement>(null);
  const fileDocxImportRef = useRef<HTMLInputElement>(null);
  const fileCombinedImportRef = useRef<HTMLInputElement>(null);
  const fileDocxAIImportRef = useRef<HTMLInputElement>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang xử lý file Word...");

      const formData = new FormData();
      formData.append("file", file);

      // Gọi API gửi file xuống backend
      // Lưu ý: Cần thêm base URL hoặc config theo axios instance của bạn, ở đây giả định dùng fetch
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch("http://localhost:5000/api/v1/upload/docx", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Lỗi khi xử lý file");
      }

      const rawText = data.text;

      // Parse raw text
      const parsedQuestions = [];
      // Regex cơ bản để bắt "Câu 1: ...", "A.", "B.", "C.", "D.", "Đáp án: A"
      // Định dạng linh hoạt: "Câu 1", "Câu 1:", "Câu 1." 
      const questionBlocks = rawText.split(/Câu\s*\d+[:.\s-]/i).filter((b: string) => b.trim().length > 0);

      for (const block of questionBlocks) {
        // Tách câu hỏi và các phần còn lại (phương án + đáp án)
        // Tìm chữ A. hoặc A: hoặc A)
        const optionsMatch = block.match(/([A-D][.:\)])/ig);

        if (!optionsMatch || optionsMatch.length < 2) continue;

        const firstOptionIndex = block.indexOf(optionsMatch[0]);
        const questionText = block.substring(0, firstOptionIndex).trim();

        const options = [];
        let correctOptionIndex = 0;

        // Tách các phương án
        for (let i = 0; i < optionsMatch.length; i++) {
          const optStart = block.indexOf(optionsMatch[i]);
          let optEnd = block.length;
          if (i < optionsMatch.length - 1) {
            optEnd = block.indexOf(optionsMatch[i + 1], optStart + 1);
          } else {
            // Lấy đến phần đáp án (nếu có)
            const answerMatch = block.match(/Đáp\s*án\s*[:\s]*([A-D])/i);
            if (answerMatch && answerMatch.index !== undefined && answerMatch.index > optStart) {
              optEnd = answerMatch.index;
              const correctLetter = answerMatch[1].toUpperCase();
              if (correctLetter === 'A') correctOptionIndex = 0;
              else if (correctLetter === 'B') correctOptionIndex = 1;
              else if (correctLetter === 'C') correctOptionIndex = 2;
              else if (correctLetter === 'D') correctOptionIndex = 3;
            }
          }

          let optText = block.substring(optStart + optionsMatch[i].length, optEnd).trim();
          // Xóa chữ "Đáp án: A" nếu bị dính
          optText = optText.replace(/Đáp\s*án\s*[:\s]*[A-D]/i, '').trim();
          options.push(optText);
        }

        parsedQuestions.push({
          questionText: questionText.replace(/\n/g, ' '),
          options: options.slice(0, 6), // Giới hạn tối đa 6
          correctOptionIndex,
          points: 1,
          imageUrl: ""
        });
      }

      if (parsedQuestions.length > 0) {
        setQuizQuestions(parsedQuestions);
        toast.success(`Đã import ${parsedQuestions.length} câu hỏi thành công!`);
      } else {
        toast.warning("Không tìm thấy câu hỏi nào đúng định dạng.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi import file docx");
    } finally {
      if (fileDocxImportRef.current) {
        fileDocxImportRef.current.value = "";
      }
    }
  };

  const handleImportDocxAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsGeneratingAI(true);
      toast.info("AI đang đọc và tạo câu hỏi... Vui lòng đợi trong giây lát!", 5000);

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch("http://localhost:5000/api/v1/upload/docx-ai", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Lỗi khi AI sinh câu hỏi");
      }

      const questions = data.data;

      if (questions && questions.length > 0) {
        // Map data if needed to ensure correct format
        const parsedQuestions = questions.map((q: any) => ({
          questionText: q.questionText || "",
          options: Array.isArray(q.options) ? q.options.slice(0, 6) : [],
          correctOptionIndex: q.correctOptionIndex || 0,
          points: q.points || 1,
          imageUrl: ""
        }));

        setQuizQuestions(parsedQuestions);
        toast.success(`AI đã tạo thành công ${parsedQuestions.length} câu hỏi!`);
      } else {
        toast.warning("AI không thể tạo được câu hỏi nào từ nội dung này.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi kết nối với AI");
    } finally {
      setIsGeneratingAI(false);
      if (fileDocxAIImportRef.current) {
        fileDocxAIImportRef.current.value = "";
      }
    }
  };

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
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const parsedQuestions = [];
        // Bắt đầu từ dòng 1 (bỏ dòng header 0)
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;

          const questionText = row[0] || "";
          const optA = row[1] || "";
          const optB = row[2] || "";
          const optC = row[3] || "";
          const optD = row[4] || "";
          const correctLetter = (row[5] || "").toString().trim().toUpperCase();

          if (!questionText) continue;

          let correctOptionIndex = 0;
          if (correctLetter === 'A' || correctLetter === '1') correctOptionIndex = 0;
          else if (correctLetter === 'B' || correctLetter === '2') correctOptionIndex = 1;
          else if (correctLetter === 'C' || correctLetter === '3') correctOptionIndex = 2;
          else if (correctLetter === 'D' || correctLetter === '4') correctOptionIndex = 3;

          parsedQuestions.push({
            questionText,
            options: [optA, optB, optC, optD],
            correctOptionIndex,
            points: 1
          });
        }

        if (parsedQuestions.length > 0) {
          setQuizQuestions(parsedQuestions);
          toast.success(`Đã nhập thành công ${parsedQuestions.length} câu hỏi!`);
        } else {
          toast.warning("Không tìm thấy câu hỏi hợp lệ trong file Excel!");
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi đọc file Excel, vui lòng kiểm tra lại định dạng!");
      }

      if (fileImportRef.current) {
        fileImportRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCombinedImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.docx')) {
      handleImportDocx(e);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      handleImportExcel(e);
    } else {
      toast.error("Định dạng file không được hỗ trợ!");
    }

    if (fileCombinedImportRef.current) {
      fileCombinedImportRef.current.value = "";
    }
  };

  const [postType, setPostType] = useState<"announcement" | "reminder" | "material">("announcement");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho bình luận mới của từng bài đăng
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [likedAnns, setLikedAnns] = useState<Record<string, boolean>>({});
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});

  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const [isResetQuizDialogOpen, setIsResetQuizDialogOpen] = useState(false);
  const [isResettingQuiz, setIsResettingQuiz] = useState(false);

  const loadQuizzes = async () => {
    if (!classId) return;
    try {
      setLoadingQuizzes(true);
      const res = await quizService.getQuizzes(classId);
      if (res && res.data) {
        setQuizzes(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách bài trắc nghiệm!");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadQuizResults = async (quizId: string) => {
    try {
      setLoadingResults(true);
      const res = await quizService.getQuizResults(quizId);
      if (res && res.data) {
        setQuizResults(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng điểm!");
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quizzes") {
      loadQuizzes();
      setSelectedQuiz(null);
      setIsCreatingQuiz(false);
    }
  }, [activeTab, classId]);

  const handleApplyDefaultPoints = () => {
    if (quizQuestions.length === 0) return;
    const updated = quizQuestions.map(q => ({
      ...q,
      points: defaultPoints
    }));
    setQuizQuestions(updated);
    toast.success(`Đã áp dụng ${defaultPoints} điểm cho tất cả ${quizQuestions.length} câu hỏi!`);
  };

  const handleAddQuestion = () => {
    const newIndex = quizQuestions.length;
    setQuizQuestions([
      ...quizQuestions,
      { questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }
    ]);
    scrollToQuestion(newIndex);
  };

  const scrollToQuestion = (index: number) => {
    setExpandedQuestionIndex(index);
    setTimeout(() => {
      const element = document.getElementById(`quiz-question-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleRemoveQuestion = (index: number) => {
    if (quizQuestions.length <= 1) {
      toast.warning("Đề thi trắc nghiệm cần có ít nhất 1 câu hỏi!");
      return;
    }
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index: number, val: string) => {
    const updated = [...quizQuestions];
    updated[index].questionText = val;
    setQuizQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[optIndex] = val;
    setQuizQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    updated[qIndex].correctOptionIndex = optIndex;
    setQuizQuestions(updated);
    if (errorQuestionIndex === qIndex) {
      setErrorQuestionIndex(null);
    }
  };

  const handleQuestionImage = (qIndex: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...quizQuestions];
      updated[qIndex].imageUrl = e.target?.result as string;
      setQuizQuestions(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQuestionImage = (qIndex: number) => {
    const updated = [...quizQuestions];
    updated[qIndex].imageUrl = undefined;
    setQuizQuestions(updated);
  };

  const handleOptionImage = (qIndex: number, optIndex: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...quizQuestions];
      if (!updated[qIndex].optionImages) {
        updated[qIndex].optionImages = Array(updated[qIndex].options.length).fill("");
      }
      updated[qIndex].optionImages[optIndex] = e.target?.result as string;
      setQuizQuestions(updated);
    };
    reader.readAsDataURL(file);
  }

  const handleRemoveOptionImage = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].optionImages) {
      updated[qIndex].optionImages[optIndex] = "";
      setQuizQuestions(updated);
    }
  }

  const handleAddOption = (qIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].options.length >= 6) {
      toast.warning("Tối đa 6 phương án!");
      return;
    }
    updated[qIndex].options.push("");
    setQuizQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].options.length <= 2) {
      toast.warning("Cần ít nhất 2 phương án!");
      return;
    }
    updated[qIndex].options.splice(optIndex, 1);
    // Nếu đáp án đúng bị xóa hoặc vượt chỉ số mới, reset về 0
    if (updated[qIndex].correctOptionIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctOptionIndex = -1;
    }
    setQuizQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    if (!quizTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề đề thi!");
      return;
    }

    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.questionText.trim()) {
        toast.error(`Vui lòng nhập nội dung câu hỏi số ${i + 1}!`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Vui lòng nhập phương án trả lời ${String.fromCharCode(65 + j)} của câu hỏi ${i + 1}!`);
          return;
        }
      }

      if (q.correctOptionIndex === -1) {
        toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}!`);
        setErrorQuestionIndex(i);
        scrollToQuestion(i);
        return;
      }
    }

    try {
      if (editingQuizId) {
        await quizService.updateQuiz(editingQuizId, {
          title: quizTitle.trim(),
          durationMinutes: quizDuration,
          questions: quizQuestions,
          shuffleQuestions,
          shuffleOptions
        });
        toast.success("Cập nhật đề thi trắc nghiệm thành công!");
      } else {
        await quizService.createQuiz({
          classId,
          title: quizTitle.trim(),
          durationMinutes: quizDuration,
          questions: quizQuestions,
          shuffleQuestions,
          shuffleOptions
        });
        toast.success("Tạo đề thi trắc nghiệm thành công!");
      }
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      setQuizTitle("");
      setQuizDuration(15);
      setShuffleQuestions(false);
      setShuffleOptions(false);
      setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1 }]);
      loadQuizzes();
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes('đã có học sinh làm bài')) {
        setIsResetQuizDialogOpen(true);
      } else {
        toast.error(errorMessage || (editingQuizId ? "Cập nhật đề thi trắc nghiệm thất bại!" : "Tạo đề thi trắc nghiệm thất bại!"));
      }
    }
  };

  const confirmSaveWithReset = async () => {
    if (!editingQuizId) return;
    setIsResettingQuiz(true);
    try {
      await quizService.updateQuiz(editingQuizId, {
        title: quizTitle.trim(),
        durationMinutes: quizDuration,
        questions: quizQuestions,
        shuffleQuestions,
        shuffleOptions,
        forceReset: true
      });
      toast.success("Cập nhật đề thi & reset kết quả thành công!");
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      setQuizTitle("");
      setQuizDuration(15);
      setShuffleQuestions(false);
      setShuffleOptions(false);
      setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1 }]);
      loadQuizzes();
      setIsResetQuizDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể cập nhật đề thi này!");
    } finally {
      setIsResettingQuiz(false);
    }
  };



  const handleToggleQuizStatus = async (quizItem: any) => {
    const newStatus = quizItem.status === 'open' ? 'closed' : 'open';
    try {
      const res = await quizService.updateQuizStatus(quizItem._id, newStatus);
      if (res.data) {
        setQuizzes(prevQuizzes => prevQuizzes.map(q =>
          q._id === quizItem._id ? { ...q, status: newStatus } : q
        ));
        toast.success(`Đã ${newStatus === 'open' ? 'mở' : 'đóng'} đề thi "${quizItem.title}"`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái đề thi");
    }
  };

  const handleDeleteQuizClick = (quizItem: any) => {
    setQuizToDelete(quizItem);
    setIsDeleteQuizDialogOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await quizService.deleteQuiz(quizToDelete._id);
      toast.success("Xóa đề thi thành công!");
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q._id !== quizToDelete._id));
      setIsDeleteQuizDialogOpen(false);
      setQuizToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa đề thi này!");
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingQuiz(false);
    setEditingQuizId(null);
  };

  const handleOpenCreateQuiz = () => {
    setQuizTitle("");
    setQuizDuration(15);
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }]);
    setEditingQuizId(null);
    setIsCreatingQuiz(true);
  };

  const handleOpenEditQuiz = (quizItem: any) => {
    setQuizTitle(quizItem.title);
    setQuizDuration(quizItem.durationMinutes);
    setShuffleQuestions(quizItem.shuffleQuestions || false);
    setShuffleOptions(quizItem.shuffleOptions || false);
    // Sao chép sâu câu hỏi vào form state
    const formattedQuestions = quizItem.questions.map((q: any) => ({
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      options: [...q.options],
      optionImages: q.optionImages ? [...q.optionImages] : [],
      correctOptionIndex: q.correctOptionIndex,
      points: q.points || 1
    }));
    setQuizQuestions(formattedQuestions);
    setEditingQuizId(quizItem._id);
    setIsCreatingQuiz(true);
  };

  // Tải dữ liệu lớp học và bảng tin
  const loadData = async () => {
    if (!classId) return;

    // Tải thông tin lớp học
    try {
      const res = await classroomService.getClassroomDetail(classId);
      if (res && res.data) {
        setClassroom({
          _id: res.data._id,
          className: res.data.name,
          subject: res.data.subject || "",
          code: res.data.code,
          teacherName: (res.data as any).teacherId?.name || "Giáo viên",
          studentCount: res.data.students?.length || 0
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải thông tin lớp học!");
      navigate("/classrooms");
      return;
    }

    // Tải danh sách thông báo thật từ API
    try {
      const annRes = await announcementService.getAnnouncements(classId);
      if (annRes && annRes.data) {
        setAnnouncements(annRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng tin lớp học!");
    }
  };

  useEffect(() => {
    loadData();
  }, [classId]);

  // Bộ lọc thông báo
  const filteredAnnouncements = announcements.filter(ann => {
    // Lọc theo loại (chip)
    if (filterChip !== "all" && ann.type !== filterChip) return false;

    // Lọc theo nội dung tìm kiếm
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return ann.content.toLowerCase().includes(q);
    }

    return true;
  }).sort((a, b) => {
    // Đưa bài ghim lên đầu
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Xử lý chọn file thật từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`,
      url: URL.createObjectURL(file)
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Đăng bài mới
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    if (!postText.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo!");
      return;
    }

    setIsPosting(true);
    try {
      await announcementService.createAnnouncement({
        classId,
        content: postText.trim(),
        type: postType,
        attachments: attachedFiles.map(f => ({ name: f.name, url: f.url, size: f.size }))
      });
      toast.success("Đăng bài thông báo thành công!");
      setPostText("");
      setPostType("announcement");
      setAttachedFiles([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi đăng bài!");
    } finally {
      setIsPosting(false);
    }
  };

  // Xóa bài đăng
  const handleDeletePostClick = (annId: string) => {
    setPostToDelete(annId);
    setIsDeletePostDialogOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      await announcementService.deleteAnnouncement(postToDelete);
      // Xóa khỏi state ngay lập tức (không cần reload)
      setAnnouncements(prev => prev.filter(ann => ann._id !== postToDelete));
      toast.success("Đã xóa thông báo!");
      setIsDeletePostDialogOpen(false);
      setPostToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa thông báo. Bạn có phải tác giả không?");
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Ghim bài đăng
  const handleTogglePin = async (annId: string) => {
    try {
      const res = await announcementService.togglePin(annId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
        toast.success(res.data.isPinned ? "Đã ghim thông báo!" : "Đã bỏ ghim thông báo!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ghim thông báo!");
    }
  };

  // Thích bài đăng
  const handleLikeAnnouncement = async (annId: string) => {
    try {
      const res = await announcementService.likeAnnouncement(annId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích thông báo!");
    }
  };

  // Thích bình luận
  const handleLikeComment = async (annId: string, commentId: string) => {
    try {
      const res = await announcementService.likeComment(annId, commentId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích bình luận!");
    }
  };

  // Đăng bình luận
  const handleAddComment = async (annId: string) => {
    const commentContent = (commentInputs[annId] || "").trim();
    if (!commentContent) return;

    setSendingComment(annId);
    try {
      const res = await announcementService.addComment(annId, commentContent);
      if (res && res.data) {
        const comments = res.data.comments;
        setAnnouncements(prev =>
          prev.map(ann =>
            ann._id === annId ? { ...ann, comments } : ann
          )
        );
        setCommentInputs(prev => ({ ...prev, [annId]: "" }));
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể đăng bình luận!");
    } finally {
      setSendingComment(null);
    }
  };

  // Format ngày tương đối hoặc tuyệt đối
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;

      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;

      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className={styles.classroomDetailContainer}>
      <div className={styles.mainContent}>
        {/* TABS 3: SCHEDULE VIEW */}
        {activeTab === "schedule" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.reportCard}>
              <h3>Lịch trình học tập</h3>
              <p>Lịch dạy và các buổi học thêm được xếp lịch cho lớp {classroom?.className}.</p>
              <div className={styles.scheduleTimeline}>
                <div className={styles.timelineEvent}>
                  <span className={styles.eventTime}>Thứ 2 (08:00 - 09:30)</span>
                  <div className={styles.eventInfo}>
                    <h4>Buổi ôn tập Đại Số</h4>
                    <p>Chương Đạo hàm & Khảo sát hàm số</p>
                  </div>
                </div>
                <div className={styles.timelineEvent}>
                  <span className={styles.eventTime}>Thứ 4 (18:00 - 19:30)</span>
                  <div className={styles.eventInfo}>
                    <h4>Học chuyên đề Hình Học không gian</h4>
                    <p>Tính thể tích khối đa diện</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS 1: OVERVIEW (FEED VIEW - GIỐNG ẢNH MẪU) */}
        {activeTab === "overview" && (
          <div className={styles.feedLayout}>
            {/* LEFT SIDEBAR: CLASS INFO */}
            <div className={styles.classSidebar}>
              <div className={styles.classMergedCard}>
                <div className={styles.classBanner}>
                  <h2 className="text-xl font-black text-white mb-1 leading-tight">{classroom?.className || "Đang tải..."}</h2>
                  <p className="text-white/90 font-medium text-sm">{classroom?.subject || "Môn học chung"}</p>
                </div>
                <div className={styles.classInfo}>
                  <button
                    className={`${styles.infoRow} ${styles.clickableRow}`}
                    onClick={() => navigate(`/classrooms/${classId}/students`)}
                    title="Quản lý học sinh"
                  >
                    <Users size={18} weight="duotone" className="text-blue-500" />
                    <span>Sĩ số: <strong>{classroom?.studentCount || 0}</strong> học sinh</span>
                    <span className={styles.rowActionText}>Quản lý &rarr;</span>
                  </button>
                </div>
              </div>

              {/* THỐNG KÊ (Đã gộp từ tab Báo cáo) */}
              <div className={styles.reportCardMini}>
                <h3>Tiến độ trung bình lớp</h3>
                <div className={styles.reportMetricsMini}>
                  <div className={styles.statMetricMini}>
                    <span className={styles.statNumMini}>92%</span>
                    <span className={styles.statDescMini}>Hoàn thành</span>
                  </div>
                  <div className={styles.statMetricMini}>
                    <span className={styles.statNumMini}>8.4</span>
                    <span className={styles.statDescMini}>GPA</span>
                  </div>
                  <div className={styles.statMetricMini}>
                    <span className={styles.statNumMini}>96%</span>
                    <span className={styles.statDescMini}>Chuyên cần</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN FEED */}
            <div className={styles.feedMain}>
              {/* POST COMPOSER */}
              {userRole === "TEACHER" && (
                <div className={styles.postComposer}>
                  <div className={styles.composerTop}>
                    <img src={userAvatar} alt="Avatar" className={styles.avatarMini} />
                    <textarea
                      ref={composerRef}
                      placeholder="Bạn muốn thông báo gì cho cả lớp hôm nay?"
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                    />
                  </div>

                  <div style={{ padding: '0 16px' }}>
                    <FolderUpload
                      label="Không có tệp nào được chọn"
                      onFileSelect={(files) => handleFileChange({ target: { files } } as any)}
                      value={attachedFiles.length > 0 ? attachedFiles.map(f => f.name).join(', ') : ''}
                    />
                  </div>

                  {/* Tệp đính kèm đã chọn */}
                  {attachedFiles.length > 0 && (
                    <div className={styles.composerAttachments}>
                      {attachedFiles.map((file, index) => (
                        <div key={index} className={styles.attachedFileItem}>
                          <FilePdf size={16} weight="fill" color="#EF4444" />
                          <span>{file.name} <em>({file.size})</em></span>
                          <button
                            type="button"
                            onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== index))}
                            className={styles.removeAttachBtn}
                          >
                            <X size={13} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.composerBottom}>
                    {/* Loại bài đăng - custom chips */}
                    <div className={styles.typeChips}>
                      <button
                        type="button"
                        className={`${styles.typeChip} ${postType === "announcement" ? styles.typeChipActive : ""}`}
                        onClick={() => setPostType("announcement")}
                      >
                        <Megaphone size={14} weight="duotone" />
                        Thông báo
                      </button>
                      <button
                        type="button"
                        className={`${styles.typeChip} ${postType === "reminder" ? styles.typeChipActiveReminder : ""}`}
                        onClick={() => setPostType("reminder")}
                      >
                        <Bell size={14} weight="duotone" />
                        Nhắc nhở
                      </button>
                      <button
                        type="button"
                        className={`${styles.typeChip} ${postType === "material" ? styles.typeChipActiveMaterial : ""}`}
                        onClick={() => setPostType("material")}
                      >
                        <BookOpen size={14} weight="duotone" />
                        Tài liệu
                      </button>
                    </div>

                    <div className={styles.composerActions} style={{ justifyContent: 'flex-end' }}>

                      <Button
                        onClick={handleCreatePost}
                        disabled={!postText.trim() || isPosting}
                      >
                        {isPosting ? "Đang đăng..." : "Đăng bài"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* FILTER CHIPS BAR */}
              <div className={styles.filterBar}>
                <button
                  className={`${styles.filterChip} ${filterChip === "all" ? styles.active : ""}`}
                  onClick={() => setFilterChip("all")}
                >
                  Tất cả
                </button>
                <button
                  className={`${styles.filterChip} ${filterChip === "assignment" ? styles.active : ""}`}
                  onClick={() => setFilterChip("assignment")}
                >
                  Bài tập
                </button>
                <button
                  className={`${styles.filterChip} ${filterChip === "reminder" ? styles.active : ""}`}
                  onClick={() => setFilterChip("reminder")}
                >
                  Nhắc nhở
                </button>
                <button
                  className={`${styles.filterChip} ${filterChip === "material" ? styles.active : ""}`}
                  onClick={() => setFilterChip("material")}
                >
                  Tài liệu
                </button>
              </div>

              {/* ANNOUNCEMENT FEED LIST */}
              <div className={styles.feedList}>
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((ann) => {
                    // Xác định tên hiển thị cho loại bài đăng tiếng Việt
                    let typeText = "đã đăng một thông báo";
                    if (ann.type === "reminder") typeText = "đã đăng một nhắc nhở";
                    if (ann.type === "material") typeText = "đã chia sẻ một tài liệu";

                    const authorDisplayName = ann.authorId?.name || "Giáo viên";
                    const authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorDisplayName)}&background=FE6747&color=fff&bold=true`;

                    const getTypeStyles = (type: string) => {
                      if (type === "reminder") return { label: "Nhắc nhở", icon: <Bell size={14} weight="duotone" />, cls: styles.tagReminder };
                      if (type === "material") return { label: "Tài liệu", icon: <BookOpen size={14} weight="duotone" />, cls: styles.tagMaterial };
                      if (type === "assignment") return { label: "Bài tập", icon: <ClipboardText size={14} weight="duotone" />, cls: styles.tagAssignment };
                      return { label: "Thông báo", icon: <Megaphone size={14} weight="duotone" />, cls: styles.tagAnnouncement };
                    };
                    const { label, icon, cls } = getTypeStyles(ann.type);

                    return (
                      <div key={ann._id} className={styles.announcementCard}>
                        {/* Top Header Card */}
                        <div className={styles.cardHeader}>
                          <div className={styles.authorInfo}>
                            <img src={authorAvatar} alt="Author" className={styles.authorAvatar} />
                            <div className={styles.authorMeta}>
                              <div className={styles.authorNameRow}>
                                <strong>{authorDisplayName}</strong>
                                <span className={`${styles.typeTag} ${cls}`}>
                                  {icon} {label}
                                </span>
                              </div>
                              <div className={styles.timeMeta}>
                                {formatTime(ann.createdAt)} • {classroom?.className || "Lớp học"}
                              </div>
                            </div>
                          </div>
                          <div className={styles.headerActions}>
                            {userRole === "TEACHER" && (
                              <>
                                <button
                                  className={`${styles.pinPostBtn} ${ann.isPinned ? styles.activePin : ""}`}
                                  onClick={() => handleTogglePin(ann._id)}
                                  title={ann.isPinned ? "Bỏ ghim" : "Ghim bài đăng"}
                                >
                                  <PushPin size={16} weight={ann.isPinned ? "fill" : "regular"} />
                                </button>
                                <button
                                  className={styles.deletePostBtn}
                                  onClick={() => handleDeletePostClick(ann._id)}
                                  title="Xóa bài đăng"
                                >
                                  <Trash size={16} />
                                </button>
                              </>
                            )}
                            <button className={styles.moreBtn} aria-label="Tùy chọn">
                              <DotsThree size={24} weight="bold" />
                            </button>
                          </div>
                        </div>

                        {/* Content Card */}
                        <div className={styles.cardContent}>
                          <p>{ann.content}</p>
                        </div>

                        {/* Attachments Card */}
                        {ann.attachments && ann.attachments.length > 0 && (
                          <div className={styles.filesGrid}>
                            {ann.attachments.map((file, idx) => (
                              <FolderFileCard
                                key={idx}
                                fileName={file.name}
                                fileSize={file.size || ''}
                                downloadUrl={file.url}
                              />
                            ))}
                          </div>
                        )}

                        {/* Comments section */}
                        <div className={styles.customCommentsCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={styles.customTitle}>Comments {ann.comments?.length ? `(${ann.comments.length})` : ""}</span>
                          </div>

                          <div className={styles.customComments}>
                            <div className={styles.commentContainer}>
                              {(() => {
                                const rawComments = showAllComments[ann._id] ? ann.comments : (ann.comments || []).slice(0, 2);
                                if (!rawComments) return null;

                                const grouped: { parent: any, replies: any[] }[] = [];
                                rawComments.forEach((c: any) => {
                                  if (c.content.trim().startsWith('@') && grouped.length > 0) {
                                    grouped[grouped.length - 1].replies.push(c);
                                  } else {
                                    grouped.push({ parent: c, replies: [] });
                                  }
                                });

                                return grouped.map((group, groupIdx) => {
                                  const { parent: comment, replies } = group;

                                  const renderComment = (c: any, isReply: boolean) => {
                                    const commentAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName)}&background=FE6747&color=fff&bold=true`;
                                    const isTeacher = (c.authorId === (classroom?.teacherId?._id || classroom?.teacherId));

                                    return (
                                      <div key={c._id || Math.random()} className={`${styles.singleCommentWrapper} ${isTeacher ? styles.teacherComment : ""} ${isReply ? styles.replyComment : ""}`}>
                                        <div className={styles.commentBodyWrapper}>
                                          <div className={styles.user}>
                                            <div className={styles.userPic}>
                                              <img src={commentAvatar} alt="" />
                                            </div>
                                            <div className={styles.userInfo}>
                                              <span>
                                                {c.authorName}
                                                {isTeacher && <span className={styles.teacherBadge}>Giáo viên</span>}
                                              </span>
                                              <div className={styles.metaRow}>
                                                <p>{formatTime(c.createdAt)}</p>
                                              </div>
                                            </div>
                                          </div>
                                          <p className={styles.commentContent}>
                                            {c.content}
                                          </p>
                                          <div className={styles.commentActions}>
                                            <button
                                              className={`${styles.likeBtn} ${c.likes?.includes(user?.id || "") ? styles.liked : ""}`}
                                              onClick={() => handleLikeComment(ann._id, c._id)}
                                            >
                                              <svg fill={c.likes?.includes(user?.id || "") ? "#f5356e" : "none"} viewBox="0 0 24 24" height={14} width={14} xmlns="http://www.w3.org/2000/svg">
                                                <path fill={c.likes?.includes(user?.id || "") ? "#f5356e" : "#707277"} strokeLinecap="round" strokeWidth={2} stroke={c.likes?.includes(user?.id || "") ? "#f5356e" : "#707277"} d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z" />
                                              </svg>
                                              Thích {c.likes?.length ? `(${c.likes.length})` : ""}
                                            </button>
                                            <button
                                              className={styles.replyBtn}
                                              onClick={() => {
                                                setShowReplyBox(prev => ({ ...prev, [ann._id]: true }));
                                                setCommentInputs(prev => ({
                                                  ...prev,
                                                  [ann._id]: `@${c.authorName} `
                                                }));
                                              }}
                                            >
                                              Trả lời
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  };

                                  return (
                                    <div key={comment._id || groupIdx}>
                                      {renderComment(comment, false)}

                                      {replies.length > 0 && !showReplies[comment._id] && (
                                        <button
                                          onClick={() => setShowReplies(prev => ({ ...prev, [comment._id]: true }))}
                                          style={{
                                            background: 'none', border: 'none', color: '#64748b',
                                            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                            marginLeft: '44px', marginTop: '-8px', marginBottom: '12px',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                          }}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                          Xem {replies.length} phản hồi
                                        </button>
                                      )}

                                      {replies.length > 0 && showReplies[comment._id] && (
                                        <>
                                          {replies.map(r => renderComment(r, true))}
                                        </>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                              {ann.comments && ann.comments.length > 2 && (
                                <button
                                  onClick={() => setShowAllComments(prev => ({ ...prev, [ann._id]: !prev[ann._id] }))}
                                  style={{ fontSize: '0.85rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: '8px', textAlign: 'left' }}
                                >
                                  {showAllComments[ann._id] ? "Thu gọn bình luận" : `Xem thêm ${ann.comments.length - 2} bình luận...`}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className={styles.commentsSection}>
                            {showReplyBox[ann._id] ? (
                              <div className={styles.quickReplyForm}>
                                <img src={userAvatar} alt="" className={styles.replyAvatar} />
                                <div className={styles.replyInputWrapper}>
                                  <input
                                    type="text"
                                    placeholder="Viết bình luận..."
                                    value={commentInputs[ann._id] || ""}
                                    onChange={(e) => setCommentInputs({
                                      ...commentInputs,
                                      [ann._id]: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment(ann._id);
                                        setShowReplyBox(prev => ({ ...prev, [ann._id]: false }));
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <AnimatedSendButton
                                    onClick={() => {
                                      handleAddComment(ann._id);
                                      setShowReplyBox(prev => ({ ...prev, [ann._id]: false }));
                                    }}
                                    disabled={!commentInputs[ann._id]?.trim()}
                                  />
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowReplyBox(prev => ({ ...prev, [ann._id]: true }))}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  background: 'none', border: 'none', color: '#64748b',
                                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                  padding: '8px 0', marginTop: '4px'
                                }}
                              >
                                <img src={userAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                Viết bình luận...
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyFeed}>
                    <div className={styles.illustrationCircle}>
                      <ChatCircleText size={56} weight="duotone" className="text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700 mt-4 mb-2">Chưa có bài đăng nào</h4>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Lớp học của bạn đang khá yên ắng. Hãy là người đầu tiên chia sẻ thông tin, lời chào hoặc tài liệu cho lớp nhé.</p>
                    {userRole === "TEACHER" && (
                      <button className={styles.ctaEmptyBtn} onClick={handleFocusComposer}>
                        <Plus size={16} weight="bold" />
                        Tạo thông báo đầu tiên cho lớp
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TABS 4: QUIZZES VIEW */}
        {activeTab === "quizzes" && (
          <div className={styles.tabContentPanel}>
            {isCreatingQuiz ? (
              /* CREATE QUIZ FORM */
              <div className={styles.createQuizView}>
                <div className={styles.formHeader}>
                  <h3>Tạo đề thi trắc nghiệm mới</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FolderImportButton 
                      onClick={() => fileCombinedImportRef.current?.click()} 
                      title="Nhập dữ liệu (Word/Excel)"
                    />
                    
                    <AiGenerateButton 
                      onClick={() => !isGeneratingAI && fileDocxAIImportRef.current?.click()}
                      disabled={isGeneratingAI}
                      isGeneratingAI={isGeneratingAI}
                    />
                  </div>
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  accept=".xlsx, .xls, .docx"
                  ref={fileCombinedImportRef}
                  style={{ display: "none" }}
                  onChange={handleCombinedImport}
                />
                <input
                  type="file"
                  accept=".docx"
                  ref={fileDocxAIImportRef}
                  style={{ display: "none" }}
                  onChange={handleImportDocxAI}
                />

                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                  {/* MAIN CONTENT AREA */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <form onSubmit={handleSaveQuiz}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="quiz-title">Tiêu đề đề thi trắc nghiệm</label>
                          <input
                            id="quiz-title"
                            type="text"
                            placeholder="Ví dụ: Kiểm tra giữa kỳ môn Toán"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="quiz-duration">Thời gian làm bài (phút)</label>
                          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                            <NumberStepper
                              value={quizDuration}
                              onChange={(val) => setQuizDuration(val)}
                              min={1}
                              max={180}
                              step={1}
                              fullWidth
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.formRow} style={{ marginTop: '16px', gap: '24px', justifyContent: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                          <Checkbox
                            id="shuffle-questions-cb"
                            checked={shuffleQuestions}
                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                          />
                          <label htmlFor="shuffle-questions-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Đảo vị trí câu hỏi</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                          <Checkbox
                            id="shuffle-options-cb"
                            checked={shuffleOptions}
                            onChange={(e) => setShuffleOptions(e.target.checked)}
                          />
                          <label htmlFor="shuffle-options-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Đảo vị trí đáp án</label>
                        </div>
                      </div>

                      {/* Question Editor list */}
                      <div className={styles.questionsSection}>
                        <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Danh sách câu hỏi ({quizQuestions.length})</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                            <label htmlFor="default-points" style={{ color: '#64748b' }}>Cài điểm đồng loạt:</label>
                            <NumberStepper
                              value={defaultPoints}
                              onChange={(val) => setDefaultPoints(val)}
                              min={1}
                              max={100}
                              step={1}
                            />
                            <button
                              type="button"
                              onClick={handleApplyDefaultPoints}
                              style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#475569', fontWeight: 600, transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                            >
                              Áp dụng
                            </button>
                          </div>
                        </h4>

                        {quizQuestions.map((q, qIndex) => (
                          <div
                            id={`quiz-question-${qIndex}`}
                            key={qIndex}
                            className={`${styles.questionBuilderCard} ${dragOverIndex === qIndex ? styles.dragOver : ""} ${errorQuestionIndex === qIndex ? styles.errorOutline : ""}`}
                            draggable
                            onDragStart={() => handleDragStart(qIndex)}
                            onDragOver={(e) => handleDragOver(e, qIndex)}
                            onDrop={() => handleDrop(qIndex)}
                            onDragEnd={handleDragEnd}
                          >
                            <div
                              className={styles.questionHeaderRow}
                              onClick={() => setExpandedQuestionIndex(expandedQuestionIndex === qIndex ? null : qIndex)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className={styles.headerLeft}>
                                <span
                                  className={styles.gripHandle}
                                  title="Kéo để sắp xếp lại"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DotsSixVertical size={20} weight="bold" />
                                </span>
                                <span style={{ fontWeight: 700, minWidth: '80px' }}>CÂU HỎI {qIndex + 1}</span>

                                {expandedQuestionIndex !== qIndex && (
                                  <span style={{
                                    marginLeft: '12px',
                                    color: '#475569',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '300px'
                                  }}>
                                    - {q.questionText || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có nội dung</span>}
                                  </span>
                                )}

                                <div
                                  style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <label htmlFor={`q-${qIndex}-points`} style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Điểm số:</label>
                                  <NumberStepper
                                    value={q.points || 1}
                                    onChange={(val) => {
                                      const newQuestions = [...quizQuestions];
                                      newQuestions[qIndex].points = val;
                                      setQuizQuestions(newQuestions);
                                    }}
                                    min={0.5}
                                    max={100}
                                    step={0.5}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#94a3b8' }}>
                                  {expandedQuestionIndex === qIndex ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                  )}
                                </span>
                                <button
                                  type="button"
                                  className={styles.removeQBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveQuestion(qIndex);
                                  }}
                                  title="Xóa câu hỏi này"
                                >
                                  <Trash size={16} weight="bold" />
                                </button>
                              </div>
                            </div>

                            {expandedQuestionIndex === qIndex && (
                              <div style={{ paddingTop: '16px', borderTop: '1px dashed #e2e8f0', marginTop: '16px' }}>

                                <div className={styles.formGroup}>
                                  <div className={styles.questionLabelRow}>
                                    <label htmlFor={`q-${qIndex}-text`}>Nội dung câu hỏi</label>
                                    <button
                                      type="button"
                                      className={styles.imgUploadToggleBtn}
                                      onClick={() => setShowImageUpload(prev => ({ ...prev, [qIndex]: !prev[qIndex] }))}
                                      title={showImageUpload[qIndex] || q.imageUrl ? "Ẩn khung tải ảnh" : "Thêm ảnh cho câu hỏi"}
                                    >
                                      <Image size={16} weight="duotone" />
                                      <span>{(showImageUpload[qIndex] || q.imageUrl) ? "Ẩn ảnh" : "Thêm ảnh"}</span>
                                    </button>
                                  </div>
                                  <textarea
                                    id={`q-${qIndex}-text`}
                                    placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                                    rows={2}
                                    required
                                  />
                                  {(showImageUpload[qIndex] || q.imageUrl) && (
                                    <CustomImageUpload
                                      imageUrl={q.imageUrl}
                                      onChange={(file) => {
                                        handleQuestionImage(qIndex, file);
                                        // Ensure it stays open when an image is uploaded
                                        setShowImageUpload(prev => ({ ...prev, [qIndex]: true }));
                                      }}
                                      onRemove={() => handleRemoveQuestionImage(qIndex)}
                                      title="Nhấn để tải lên ảnh câu hỏi"
                                    />
                                  )}
                                </div>

                                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "8px" }}>
                                  Các phương án trả lời và tích chọn đáp án đúng
                                  <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: "0.78rem" }}>({q.options.length} phương án, tối thiểu 2 · tối đa 6)</span>
                                </label>
                                <div className={styles.optionsGrid}>
                                  {q.options.map((opt, optIndex) => (
                                    <div key={optIndex} className={`${styles.optionInputGroup} ${q.correctOptionIndex === optIndex ? styles.optionCorrect : ""}`}>
                                      <span className={styles.letterLabel}>
                                        {String.fromCharCode(65 + optIndex)}
                                      </span>

                                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                          <input
                                            type="text"
                                            style={{ flex: 1 }}
                                            placeholder={`Nhập phương án ${String.fromCharCode(65 + optIndex)}`}
                                            value={opt}
                                            onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                                            required
                                          />
                                        </div>
                                      </div>

                                      <CustomRadio
                                        name={`correct-opt-${qIndex}`}
                                        checked={q.correctOptionIndex === optIndex}
                                        onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                                        title="Chọn làm đáp án đúng"
                                        required
                                      />
                                      <button
                                        type="button"
                                        className={styles.optionRemoveBtn}
                                        onClick={() => handleRemoveOption(qIndex, optIndex)}
                                        title="Xóa phương án này"
                                        disabled={q.options.length <= 2}
                                      >
                                        −
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                {/* Nút thêm phương án */}
                                {q.options.length < 6 && (
                                  <button
                                    type="button"
                                    className={styles.btnAddOption}
                                    onClick={() => handleAddOption(qIndex)}
                                  >
                                    <Plus size={13} weight="bold" />
                                    Thêm phương án
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {/* NÚT THÊM CÂU HỎI - đặt dưới danh sách, dạng outline */}
                        <button
                          type="button"
                          className={styles.btnAddQuestion}
                          onClick={handleAddQuestion}
                        >
                          <Plus size={15} weight="bold" />
                          Thêm câu hỏi mới
                        </button>
                      </div>

                      <div className={styles.formActions}>
                        <button type="button" className={styles.btnCancel} onClick={handleCancelCreate}>
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          className={styles.btnPreview}
                          disabled={quizQuestions.length === 0}
                          onClick={() => { setPreviewQIndex(0); setIsPreviewing(true); }}
                        >
                          <Eye size={16} weight="bold" />
                          Xem trước
                        </button>
                        <button type="submit" className={styles.btnSave} disabled={quizQuestions.length === 0}>
                          Lưu đề thi
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* MINI-MAP SIDEBAR */}
                  <div className={styles.quizMiniMapSidebar}>
                    <div className={styles.miniMapHeader}>
                      <h4>Mục lục câu hỏi</h4>
                      <span className={styles.miniMapCount}>{quizQuestions.length} câu</span>
                    </div>
                    <div className={styles.miniMapGrid}>
                      {quizQuestions.map((_, idx) => (
                        <button
                          key={idx}
                          className={`${styles.miniMapBtn} ${expandedQuestionIndex === idx ? styles.active : ''}`}
                          onClick={() => scrollToQuestion(idx)}
                          type="button"
                          title={`Đi tới câu ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PREVIEW MODAL */}
                {isPreviewing && (
                  <div className={styles.previewOverlay}>
                    <button className={styles.closePreviewBtn} onClick={() => setIsPreviewing(false)}>
                      <XIcon size={24} weight="bold" />
                    </button>
                    <div className={styles.previewPhone}>
                      <div className={styles.previewNotch}></div>
                      <div className={styles.previewHeader}>
                        <h3>{quizTitle || "Chưa có tiêu đề"}</h3>
                        <div className={styles.previewMeta}>
                          Câu {previewQIndex + 1}/{quizQuestions.length} • {quizDuration} phút
                        </div>
                      </div>
                      <div className={styles.previewContent}>
                        <div className={styles.previewQuestion}>
                          {quizQuestions[previewQIndex]?.questionText || "Chưa nhập nội dung câu hỏi"}
                        </div>
                        {quizQuestions[previewQIndex]?.imageUrl && (
                          <img
                            src={quizQuestions[previewQIndex].imageUrl}
                            alt="Question"
                            style={{ width: '100%', borderRadius: 8, marginBottom: 16 }}
                          />
                        )}
                        {quizQuestions[previewQIndex]?.options.map((opt, idx) => (
                          <div key={idx} className={styles.previewOption}>
                            <div className={styles.optLetter}>{String.fromCharCode(65 + idx)}</div>
                            <div className={styles.optText}>{opt || "Chưa có nội dung"}</div>
                          </div>
                        ))}
                      </div>
                      <div className={styles.previewFooter}>
                        <button
                          className={styles.btnPrev}
                          disabled={previewQIndex === 0}
                          onClick={() => setPreviewQIndex(prev => prev - 1)}
                        >
                          Câu trước
                        </button>
                        <button
                          className={styles.btnNext}
                          disabled={previewQIndex === quizQuestions.length - 1}
                          onClick={() => setPreviewQIndex(prev => prev + 1)}
                        >
                          Câu tiếp
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedQuiz ? (
              /* SUBMISSIONS RESULTS TABLE */
              <div className={styles.submissionsView}>
                <div className={styles.submissionsHeader}>
                  <button className={styles.backBtn} onClick={() => setSelectedQuiz(null)}>
                    <ArrowLeft size={16} weight="bold" />
                    Quay lại danh sách đề thi
                  </button>
                  <h3>Bảng điểm: {selectedQuiz.title}</h3>
                </div>

                {loadingResults ? (
                  <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>Đang tải bảng điểm...</p>
                ) : quizResults.length === 0 ? (
                  <div className={styles.emptyFeed}>
                    <p>Chưa có học sinh nào nộp bài thi trắc nghiệm này.</p>
                  </div>
                ) : (
                  <div className={styles.submissionsTableWrapper}>
                    <table className={styles.submissionsTable}>
                      <thead>
                        <tr>
                          <th>Học sinh</th>
                          <th>Thời gian nộp</th>
                          <th>Số câu đúng</th>
                          <th>Điểm thi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizResults.map((resItem) => {
                          const student = resItem.studentId || {};
                          const name = student.name || "Học sinh";
                          const email = student.email || "";
                          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&bold=true`;
                          const score = resItem.score;

                          let badgeClass = styles.scoreBadge;
                          if (score < 5) badgeClass += ` ${styles.low}`;
                          else if (score < 8) badgeClass += ` ${styles.mid}`;

                          const correctCount = Math.round((score / 10) * resItem.totalQuestions);

                          return (
                            <tr key={resItem._id}>
                              <td>
                                <div className={styles.studentCell}>
                                  <img src={avatarUrl} alt="" className={styles.studentAvatar} />
                                  <div className={styles.studentInfo}>
                                    <span className={styles.studentName}>{name}</span>
                                    <span className={styles.studentEmail}>{email}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{new Date(resItem.submittedAt).toLocaleString("vi-VN")}</td>
                              <td>{correctCount}/{resItem.totalQuestions} câu</td>
                              <td>
                                <span className={badgeClass}>{score}/10</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* QUIZZES LIST GRID */
              <div className={styles.quizzesTab}>
                <div className={styles.quizzesHeader}>
                  <h3>Đề thi trắc nghiệm trong lớp</h3>
                  <AnimatedAddButton onClick={handleOpenCreateQuiz}>
                    Tạo đề thi mới
                  </AnimatedAddButton>
                </div>

                {loadingQuizzes ? (
                  <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>Đang tải danh sách đề thi...</p>
                ) : quizzes.length === 0 ? (
                  <div className={styles.emptyFeed}>
                    <p>Chưa có đề thi trắc nghiệm nào được tạo trong lớp này.</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.quizGrid}>
                      {currentQuizzes.map((quizItem) => (
                        <div key={quizItem._id} className={styles.quizCard}>
                          <div className={styles.quizCardHeader}>
                            <h4>{quizItem.title}</h4>
                            <div className={styles.headerRight}>
                              <span className={`${styles.statusBadge} ${getQuizStatus(quizItem).class}`}>
                                {getQuizStatus(quizItem).label}
                              </span>
                              {quizItem.status !== 'draft' && (
                                <Switch3D
                                  checked={quizItem.status === 'open'}
                                  onChange={() => handleToggleQuizStatus(quizItem)}
                                />
                              )}
                            </div>
                          </div>
                          <div className={styles.quizCardMeta}>
                            <div className={styles.metaItem}>
                              <Clock size={15} />
                              <span>Thời gian: {quizItem.durationMinutes} phút</span>
                            </div>
                            <div className={styles.metaItem}>
                              <CheckCircle size={15} />
                              <span>Số câu hỏi: {quizItem.questions?.length || 0} câu</span>
                            </div>
                            <div className={styles.metaItem}>
                              <CalendarBlank size={15} />
                              <span>Ngày tạo: {new Date(quizItem.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                          </div>
                          {/* Thống kê nhanh / Progress Bar */}
                          <div className={styles.quizProgress}>
                            <div className={styles.progressHeader}>
                              <span>Tiến độ nộp bài:</span>
                              <strong>{quizItem.submissionCount || 0}/{classroom?.studentCount || 0} học sinh</strong>
                            </div>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${(classroom?.studentCount || 0) > 0 ? ((quizItem.submissionCount || 0) / (classroom?.studentCount || 1)) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className={styles.quizCardActions}>
                            <AnimatedAddButton
                              className="flex-1 !text-[12px] !px-2 !py-1.5 whitespace-nowrap !border-[1.5px] !tracking-normal"
                              icon={<Eye size={14} />}
                              onClick={() => {
                                setSelectedQuiz(quizItem);
                                loadQuizResults(quizItem._id);
                              }}
                            >
                              Xem bảng điểm
                            </AnimatedAddButton>
                            <AnimatedAddButton
                              className="flex-1 !text-[12px] !px-2 !py-1.5 whitespace-nowrap !border-[1.5px] !tracking-normal"
                              icon={<PencilSimple size={14} />}
                              onClick={() => handleOpenEditQuiz(quizItem)}
                            >
                              Chỉnh sửa
                            </AnimatedAddButton>
                            <AnimatedAddButton
                              className="flex-1 !text-[12px] !px-2 !py-1.5 whitespace-nowrap !border-[1.5px] !tracking-normal !text-red-500 !border-red-200 hover:!bg-red-50"
                              icon={<Trash size={14} />}
                              onClick={() => handleDeleteQuizClick(quizItem)}
                            >
                              Xóa
                            </AnimatedAddButton>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                      <div className={styles.paginationControls}>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={styles.pageBtn}
                        >
                          Trước
                        </button>
                        <span className={styles.pageInfo}>
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={styles.pageBtn}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DIALOGS */}
      <CustomConfirmDialog
        isOpen={isDeletePostDialogOpen}
        onOpenChange={setIsDeletePostDialogOpen}
        title="Xác nhận xóa thông báo"
        description="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
        onConfirm={confirmDeletePost}
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={isDeletingPost}
        actionType="danger"
      />

      <CustomConfirmDialog
        isOpen={isDeleteQuizDialogOpen}
        onOpenChange={setIsDeleteQuizDialogOpen}
        title="Xác nhận xóa đề thi"
        description={<>Bạn có chắc chắn muốn xóa đề thi <strong>{quizToDelete?.title}</strong>? Thao tác này không thể hoàn tác.</>}
        onConfirm={confirmDeleteQuiz}
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={isDeletingQuiz}
        actionType="danger"
      />

      <CustomConfirmDialog
        isOpen={isResetQuizDialogOpen}
        onOpenChange={setIsResetQuizDialogOpen}
        title="Cảnh báo: Đã có học sinh làm bài"
        description="Đề thi này đã có học sinh làm bài. Nếu bạn tiếp tục chỉnh sửa, toàn bộ kết quả làm bài hiện tại của học sinh sẽ bị XÓA BỎ. Bạn có chắc chắn muốn tiếp tục?"
        onConfirm={confirmSaveWithReset}
        confirmText="Xóa & Lưu"
        cancelText="Hủy bỏ"
        isLoading={isResettingQuiz}
        actionType="danger"
      />
    </div>
  );
}
