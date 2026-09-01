import { useState, useRef, useCallback } from "react";
import { activityService } from "@/service/activity.service";
import { bankService } from "@/service/bank.service";
import { useToast } from "@/components/Styles/ToastContext";
import * as XLSX from "xlsx";

interface UseQuizBuilderProps {
  classId?: string;
  quizzes: any[];
  loadQuizzes: () => void;
}

export function useQuizBuilder({ classId, quizzes, loadQuizzes }: UseQuizBuilderProps) {
  const toast = useToast();

  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isResetQuizDialogOpen, setIsResetQuizDialogOpen] = useState(false);
  const [isResettingQuiz, setIsResettingQuiz] = useState(false);
  const [pendingQuizData, setPendingQuizData] = useState<any>(null);

  // Quiz Results / Submissions states
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [quizResultTab, setQuizResultTab] = useState<"scores" | "errors">("scores");

  const loadQuizResults = useCallback(async (quizId: string) => {
    try {
      setLoadingResults(true);
      const res = await activityService.getQuizResults(quizId);
      if (res && res.data) {
        setQuizResults(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng điểm!");
    } finally {
      setLoadingResults(false);
    }
  }, [toast]);

  // Quiz Form states
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState(15);
  const [defaultPoints, setDefaultPoints] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
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

  // File import refs
  const fileImportRef = useRef<HTMLInputElement>(null);
  const fileDocxImportRef = useRef<HTMLInputElement>(null);
  const fileCombinedImportRef = useRef<HTMLInputElement>(null);
  const fileDocxAIImportRef = useRef<HTMLInputElement>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Drag & Drop
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

  const handleOpenCreateQuiz = useCallback(() => {
    setQuizTitle("");
    setQuizDuration(15);
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }]);
    setEditingQuizId(null);
    setIsCreatingQuiz(true);
  }, []);

  const handleOpenEditQuiz = useCallback((quizItem: any) => {
    setQuizTitle(quizItem.title);
    setQuizDuration(quizItem.durationMinutes);
    setShuffleQuestions(quizItem.shuffleQuestions || quizItem.bankItemId?.shuffleQuestions || false);
    setShuffleOptions(quizItem.shuffleOptions || quizItem.bankItemId?.shuffleOptions || false);

    const rawQuestions = quizItem.bankItemId?.quizQuestions || quizItem.questions || [];
    const formattedQuestions = rawQuestions.map((q: any) => ({
      questionText: q.questionText || "",
      imageUrl: q.imageUrl,
      options: q.options ? [...q.options] : ["", "", "", ""],
      optionImages: q.optionImages ? [...q.optionImages] : [],
      correctOptionIndex: q.correctOptionIndex ?? -1,
      points: q.points || 1
    }));
    setQuizQuestions(formattedQuestions);
    setEditingQuizId(quizItem._id);
    setAllowMultipleSubmissions(quizItem.allowMultipleSubmissions ?? false);
    setIsCreatingQuiz(true);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreatingQuiz(false);
    setEditingQuizId(null);
  }, []);

  const handleSaveQuiz = async (quizData: {
    title: string;
    durationMinutes: number;
    questions: any[];
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowMultipleSubmissions?: boolean;
  }) => {
    if (!classId) return;
    setIsSavingQuiz(true);
    try {
      if (editingQuizId) {
        const activityToUpdate = quizzes.find((q: any) => q._id === editingQuizId);
        if (activityToUpdate && activityToUpdate.bankItemId) {
          const bankId = activityToUpdate.bankItemId._id || activityToUpdate.bankItemId;
          await bankService.updateBankItem(bankId, {
            title: quizData.title,
            durationMinutes: quizData.durationMinutes,
            shuffleQuestions: quizData.shuffleQuestions,
            shuffleOptions: quizData.shuffleOptions,
            quizQuestions: quizData.questions
          });
          await activityService.updateActivity(editingQuizId, {
            title: quizData.title,
            durationMinutes: quizData.durationMinutes,
            allowMultipleSubmissions: quizData.allowMultipleSubmissions
          });
        }
        toast.success("Cập nhật đề thi trắc nghiệm thành công!");
      } else {
        const bankRes: any = await bankService.createBankItem({
          type: "quiz",
          title: quizData.title,
          durationMinutes: quizData.durationMinutes,
          shuffleQuestions: quizData.shuffleQuestions,
          shuffleOptions: quizData.shuffleOptions,
          quizQuestions: quizData.questions
        });

        const bankItemId = bankRes?.data?._id || bankRes?._id;
        if (!bankItemId) {
          throw new Error("Không lấy được ID tài nguyên từ ngân hàng đề!");
        }

        await activityService.assignActivity(classId, {
          bankItemId: bankItemId,
          title: quizData.title,
          durationMinutes: quizData.durationMinutes,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          allowMultipleSubmissions: quizData.allowMultipleSubmissions
        });
        toast.success("Tạo đề thi trắc nghiệm thành công!");
      }
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      loadQuizzes();
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes("đã có học sinh làm bài")) {
        setPendingQuizData(quizData);
        setIsResetQuizDialogOpen(true);
      } else {
        toast.error(errorMessage || (editingQuizId ? "Cập nhật đề thi trắc nghiệm thất bại!" : "Tạo đề thi trắc nghiệm thất bại!"));
      }
      throw err;
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const confirmSaveWithReset = async () => {
    if (!editingQuizId || !pendingQuizData) return;
    setIsResettingQuiz(true);
    try {
      const activityToUpdate = quizzes.find((q: any) => q._id === editingQuizId);
      if (activityToUpdate && activityToUpdate.bankItemId) {
        const bankId = activityToUpdate.bankItemId._id || activityToUpdate.bankItemId;
        await bankService.updateBankItem(bankId, {
          title: pendingQuizData.title,
          durationMinutes: pendingQuizData.durationMinutes,
          shuffleQuestions: pendingQuizData.shuffleQuestions,
          shuffleOptions: pendingQuizData.shuffleOptions,
          quizQuestions: pendingQuizData.questions
        });
        await activityService.updateActivity(editingQuizId, {
          title: pendingQuizData.title,
          durationMinutes: pendingQuizData.durationMinutes
        });
      }
      toast.success("Cập nhật đề thi & reset kết quả thành công!");
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      setPendingQuizData(null);
      loadQuizzes();
      setIsResetQuizDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể cập nhật đề thi này!");
    } finally {
      setIsResettingQuiz(false);
    }
  };

  // Delete Quiz state & handlers
  const [isDeleteQuizDialogOpen, setIsDeleteQuizDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  const handleDeleteQuizClick = useCallback((quizItem: any) => {
    setQuizToDelete(quizItem);
    setIsDeleteQuizDialogOpen(true);
  }, []);

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await activityService.deleteActivity(quizToDelete._id);
      toast.success("Xóa đề thi thành công!");
      setIsDeleteQuizDialogOpen(false);
      setQuizToDelete(null);
      loadQuizzes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa đề thi này!");
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang xử lý file Word...");

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch("http://localhost:5000/api/v1/upload/docx", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Lỗi khi xử lý file");
      }

      const rawText = data.text;
      const parsedQuestions = [];
      const questionBlocks = rawText.split(/Câu\s*\d+[:.\s-]/i).filter((b: string) => b.trim().length > 0);

      for (const block of questionBlocks) {
        const optionsMatch = block.match(/([A-D][.:\)])/gi);
        if (!optionsMatch || optionsMatch.length < 2) continue;

        const firstOptionIndex = block.indexOf(optionsMatch[0]);
        const questionText = block.substring(0, firstOptionIndex).trim();

        const options = [];
        let correctOptionIndex = 0;

        for (let i = 0; i < optionsMatch.length; i++) {
          const optStart = block.indexOf(optionsMatch[i]);
          let optEnd = block.length;
          if (i < optionsMatch.length - 1) {
            optEnd = block.indexOf(optionsMatch[i + 1], optStart + 1);
          } else {
            const answerMatch = block.match(/Đáp\s*án\s*[:\s]*([A-D])/i);
            if (answerMatch && answerMatch.index !== undefined && answerMatch.index > optStart) {
              optEnd = answerMatch.index;
              const correctLetter = answerMatch[1].toUpperCase();
              if (correctLetter === "A") correctOptionIndex = 0;
              else if (correctLetter === "B") correctOptionIndex = 1;
              else if (correctLetter === "C") correctOptionIndex = 2;
              else if (correctLetter === "D") correctOptionIndex = 3;
            }
          }

          let optText = block.substring(optStart + optionsMatch[i].length, optEnd).trim();
          optText = optText.replace(/Đáp\s*án\s*[:\s]*[A-D]/i, "").trim();
          options.push(optText);
        }

        parsedQuestions.push({
          questionText: questionText.replace(/\n/g, " "),
          options: options.slice(0, 6),
          correctOptionIndex,
          points: 1,
          imageUrl: "",
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
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Lỗi khi AI sinh câu hỏi");
      }

      const questions = data.data;

      if (questions && questions.length > 0) {
        const parsedQuestions = questions.map((q: any) => ({
          questionText: q.questionText || "",
          options: Array.isArray(q.options) ? q.options.slice(0, 6) : [],
          correctOptionIndex: q.correctOptionIndex || 0,
          points: q.points || 1,
          imageUrl: "",
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
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const parsedQuestions = [];
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
          if (correctLetter === "A" || correctLetter === "1") correctOptionIndex = 0;
          else if (correctLetter === "B" || correctLetter === "2") correctOptionIndex = 1;
          else if (correctLetter === "C" || correctLetter === "3") correctOptionIndex = 2;
          else if (correctLetter === "D" || correctLetter === "4") correctOptionIndex = 3;

          parsedQuestions.push({
            questionText,
            options: [optA, optB, optC, optD],
            correctOptionIndex,
            points: 1,
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

    if (file.name.endsWith(".docx")) {
      handleImportDocx(e);
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      handleImportExcel(e);
    } else {
      toast.error("Định dạng file không được hỗ trợ!");
    }

    if (fileCombinedImportRef.current) {
      fileCombinedImportRef.current.value = "";
    }
  };

  return {
    isCreatingQuiz,
    setIsCreatingQuiz,
    editingQuizId,
    selectedQuiz,
    setSelectedQuiz,
    quizResults,
    setQuizResults,
    loadingResults,
    setLoadingResults,
    quizResultTab,
    setQuizResultTab,
    loadQuizResults,
    setEditingQuizId,
    isSavingQuiz,
    isResetQuizDialogOpen,
    setIsResetQuizDialogOpen,
    isResettingQuiz,
    pendingQuizData,
    quizTitle,
    setQuizTitle,
    quizDuration,
    setQuizDuration,
    defaultPoints,
    setDefaultPoints,
    shuffleQuestions,
    setShuffleQuestions,
    allowMultipleSubmissions,
    setAllowMultipleSubmissions,
    shuffleOptions,
    setShuffleOptions,
    quizQuestions,
    setQuizQuestions,
    expandedQuestionIndex,
    setExpandedQuestionIndex,
    errorQuestionIndex,
    setErrorQuestionIndex,
    showImageUpload,
    setShowImageUpload,
    isPreviewing,
    setIsPreviewing,
    previewQIndex,
    setPreviewQIndex,
    fileImportRef,
    fileDocxImportRef,
    fileCombinedImportRef,
    fileDocxAIImportRef,
    isGeneratingAI,
    dragOverIndex,
    isDeleteQuizDialogOpen,
    setIsDeleteQuizDialogOpen,
    quizToDelete,
    isDeletingQuiz,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleOpenCreateQuiz,
    handleOpenEditQuiz,
    handleCancelCreate,
    handleSaveQuiz,
    confirmSaveWithReset,
    handleDeleteQuizClick,
    confirmDeleteQuiz,
    handleImportDocx,
    handleImportDocxAI,
    handleImportExcel,
    handleCombinedImport,
  };
}
