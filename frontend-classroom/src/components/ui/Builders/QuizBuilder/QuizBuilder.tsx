import React, { useState, useRef, useEffect } from "react";
import { DotsSixVertical, Image, Trash, Eye, CaretLeft, CaretRight, X, Question, FloppyDisk, Lightbulb } from "phosphor-react";
import { useToast } from "../../../Styles/ToastContext";
import NumberStepper from "../../FormControls/NumberStepper";
import Checkbox from "../../FormControls/Checkbox/Checkbox";
import CustomImageUpload from "../../Uploads/CustomImageUpload";
import CustomRadio from "../../FormControls/CustomRadio/CustomRadio";
import AiGenerateButton from "../../Buttons/AiGenerateButton/AiGenerateButton";
import FolderImportButton from "../../Buttons/FolderImportButton/FolderImportButton";
import QuizPreviewModal from "../../Dialogs/QuizPreviewModal/QuizPreviewModal";
import TemplateGuideModal from "../../Dialogs/TemplateGuideModal/TemplateGuideModal";
import * as XLSX from "xlsx";
import styles from "./QuizBuilder.module.scss";
import { SecondaryButton } from "../../Buttons/SecondaryButton";
import { SaveButton } from "../../Buttons/SaveButton";

export interface QuizBuilderProps {
  initialData?: any;
  onSubmit: (quizData: {
    title: string;
    durationMinutes: number;
    questions: any[];
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowMultipleSubmissions?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function QuizBuilder({ initialData, onSubmit, onCancel, isSaving = false }: QuizBuilderProps) {
  const toast = useToast();

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState(15);
  const [totalMaxScore, setTotalMaxScore] = useState<number>(10);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    imageUrl?: string;
    optionImages?: string[];
    points?: number;
    explanation?: string;
  }>>([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1, explanation: "" }]);

  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(0);
  const [errorQuestionIndex, setErrorQuestionIndex] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<Record<number, boolean>>({});

  // State cho phần Xem trước (Preview) & Hướng dẫn file mẫu
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateGuideOpen, setIsTemplateGuideOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const fileImportRef = useRef<HTMLInputElement>(null);
  const fileCombinedImportRef = useRef<HTMLInputElement>(null);
  const fileDocxAIImportRef = useRef<HTMLInputElement>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Drag & Drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setQuizTitle(initialData.title || "");
      setQuizDuration(initialData.durationMinutes || 15);
      setShuffleQuestions(!!initialData.shuffleQuestions);
      setShuffleOptions(!!initialData.shuffleOptions);
      setAllowMultipleSubmissions(!!initialData.allowMultipleSubmissions);
      if (initialData.questions && initialData.questions.length > 0) {
        const sanitized = initialData.questions.map((q: any) => ({
          ...q,
          questionText: String(q.questionText || ""),
          options: Array.isArray(q.options)
            ? q.options.map((opt: any) => (typeof opt === 'object' && opt !== null ? String(opt.text || opt.content || '') : String(opt ?? "")))
            : ["", "", "", ""],
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
          points: typeof q.points === 'number' ? q.points : 1,
          explanation: String(q.explanation || "")
        }));
        setQuizQuestions(sanitized);
      }
    }
  }, [initialData]);

  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
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
  const handleDragEnd = () => { dragIndexRef.current = null; setDragOverIndex(null); };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info("Đang xử lý file Word...");
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      const backendApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(`${backendApiUrl}/upload/docx`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Lỗi khi xử lý file");

      const rawText = data.text;
      const parsedQuestions: any[] = [];
      const questionBlocks = rawText.split(/Câu\s*\d+[:.\s-]/i).filter((b: string) => b.trim().length > 0);
      const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

      for (const block of questionBlocks) {
        // 1. Tìm phần đáp án đúng ở cuối câu hỏi (nếu có)
        let contentToParse = block;
        let correctOptionIndex = 0;
        const answerMatch = block.match(/(?:Đáp\s*án|Đ\/A|ĐA|Answer)\s*[:\s]*([A-F])/i);
        if (answerMatch && answerMatch.index !== undefined) {
          const correctLetter = answerMatch[1].toUpperCase();
          const foundIdx = OPTION_LETTERS.indexOf(correctLetter);
          if (foundIdx !== -1) {
            correctOptionIndex = foundIdx;
          }
          contentToParse = block.substring(0, answerMatch.index);
        }

        // 2. Tìm tuần tự các vị trí bắt đầu của các đáp án: A -> B -> C -> D -> E -> F
        const optionMarkers: Array<{ letter: string; start: number; end: number }> = [];
        let searchPos = 0;

        for (let lIdx = 0; lIdx < OPTION_LETTERS.length; lIdx++) {
          const letter = OPTION_LETTERS[lIdx];
          const remainingText = contentToParse.substring(searchPos);

          // Regex tìm chữ cái đáp án:
          // - Phải là A rồi đến B rồi đến C... (theo thứ tự tuần tự)
          // - Không được có dấu mở ngoặc '(' ngay trước chữ cái (tránh nhận nhầm đơn vị như 'Ampere (A)')
          // - Theo sau bởi dấu '.', ':', ')' hoặc dạng '(A)'
          const regex = new RegExp(`(?:^|[\\r\\n\\t]|(?<!\\()\\s+)(?:(${letter})[.:\\)]|\\((${letter})\\))\\s*`, 'i');
          const match = remainingText.match(regex);

          if (match && match.index !== undefined) {
            const markerStartInContent = searchPos + match.index + (match[0].length - match[0].trimStart().length);
            const markerEndInContent = searchPos + match.index + match[0].length;
            optionMarkers.push({
              letter,
              start: markerStartInContent,
              end: markerEndInContent
            });
            searchPos = markerEndInContent;
          } else {
            // Dừng lại nếu câu hỏi chỉ có 4 đáp án (A, B, C, D) mà không có E, F
            if (lIdx >= 2) break;
          }
        }

        // Cần ít nhất 2 đáp án A và B
        if (optionMarkers.length < 2) continue;

        // Nội dung câu hỏi là đoạn từ đầu block đến vị trí bắt đầu của đáp án A
        const questionText = contentToParse.substring(0, optionMarkers[0].start).trim();
        if (!questionText) continue;

        // Trích xuất nội dung từng phương án
        const options: string[] = [];
        for (let i = 0; i < optionMarkers.length; i++) {
          const optStart = optionMarkers[i].end;
          const optEnd = (i < optionMarkers.length - 1) ? optionMarkers[i + 1].start : contentToParse.length;
          let optText = contentToParse.substring(optStart, optEnd).trim();
          optText = optText.replace(/(?:Đáp\s*án|Đ\/A|ĐA|Answer)\s*[:\s]*[A-F]/i, '').trim();
          options.push(optText);
        }

        parsedQuestions.push({
          questionText: questionText.replace(/\n/g, ' '),
          options: options.slice(0, 6).map(opt => String(opt ?? "").trim()),
          correctOptionIndex: correctOptionIndex < options.length ? correctOptionIndex : 0,
          points: 1,
          imageUrl: ""
        });
      }
      if (parsedQuestions.length > 0) {
        const pointsPerQ = Number((totalMaxScore / parsedQuestions.length).toFixed(2));
        const distributed = parsedQuestions.map(q => ({ ...q, points: pointsPerQ }));
        setQuizQuestions(distributed);
        toast.success(`Đã import ${parsedQuestions.length} câu hỏi & tự động chia đều ${totalMaxScore} điểm (${pointsPerQ} điểm/câu)!`);
      } else {
        toast.warning("Không tìm thấy câu hỏi nào đúng định dạng.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi import file docx");
    } finally {
      if (fileCombinedImportRef.current) fileCombinedImportRef.current.value = "";
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
      const backendApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(`${backendApiUrl}/upload/docx-ai`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Lỗi khi AI sinh câu hỏi");

      const questions = data.data;
      if (questions && questions.length > 0) {
        const pointsPerQ = Number((totalMaxScore / questions.length).toFixed(2));
        const parsedQuestions = questions.map((q: any) => ({
          questionText: q.questionText || "",
          options: Array.isArray(q.options) ? q.options.slice(0, 6) : [],
          correctOptionIndex: q.correctOptionIndex || 0,
          points: pointsPerQ,
          imageUrl: ""
        }));
        setQuizQuestions(parsedQuestions);
        toast.success(`AI đã tạo ${parsedQuestions.length} câu hỏi & tự động chia đều ${totalMaxScore} điểm (${pointsPerQ} điểm/câu)!`);
      } else {
        toast.warning("AI không thể tạo được câu hỏi nào từ nội dung này.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối với AI");
    } finally {
      setIsGeneratingAI(false);
      if (fileDocxAIImportRef.current) fileDocxAIImportRef.current.value = "";
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
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;
          const questionText = String(row[0] || "").trim();
          const optA = String(row[1] ?? "").trim();
          const optB = String(row[2] ?? "").trim();
          const optC = String(row[3] ?? "").trim();
          const optD = String(row[4] ?? "").trim();
          const correctLetter = String(row[5] ?? "").trim().toUpperCase();
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
          const pointsPerQ = Number((totalMaxScore / parsedQuestions.length).toFixed(2));
          const distributed = parsedQuestions.map(q => ({ ...q, points: pointsPerQ }));
          setQuizQuestions(distributed);
          toast.success(`Đã nhập thành công ${parsedQuestions.length} câu hỏi & tự động chia đều ${totalMaxScore} điểm (${pointsPerQ} điểm/câu)!`);
        } else {
          toast.warning("Không tìm thấy câu hỏi hợp lệ trong file Excel!");
        }
      } catch (error) {
        toast.error("Lỗi khi đọc file Excel, vui lòng kiểm tra lại định dạng!");
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
    if (fileCombinedImportRef.current) fileCombinedImportRef.current.value = "";
  };

  const handleDistributePoints = (targetQuestions = quizQuestions, targetScore = totalMaxScore) => {
    if (targetQuestions.length === 0) return;
    const count = targetQuestions.length;
    const pointsPerQ = Number((targetScore / count).toFixed(2));
    const updated = targetQuestions.map(q => ({ ...q, points: pointsPerQ }));
    setQuizQuestions(updated);
    toast.success(`Đã tự động chia đều ${targetScore} điểm cho ${count} câu hỏi (${pointsPerQ} điểm/câu)!`, 3000);
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

  const handleAddQuestion = () => {
    const newIndex = quizQuestions.length;
    setQuizQuestions([
      ...quizQuestions,
      { questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1, explanation: "" }
    ]);
    scrollToQuestion(newIndex);
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

  const handleExplanationChange = (index: number, val: string) => {
    const updated = [...quizQuestions];
    updated[index].explanation = val;
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
    if (errorQuestionIndex === qIndex) setErrorQuestionIndex(null);
  };

  const handleQuestionImage = (qIndex: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh!');
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
    if (updated[qIndex].correctOptionIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctOptionIndex = -1;
    }
    setQuizQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = String(quizTitle || "").trim();
    if (!cleanTitle) {
      toast.error("Vui lòng nhập tiêu đề đề thi!");
      const titleInput = document.getElementById("quiz-title");
      if (titleInput) titleInput.focus();
      return;
    }
    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      const qText = String(q.questionText || "").trim();
      if (!qText) {
        toast.error(`Vui lòng nhập nội dung câu hỏi số ${i + 1}!`);
        setErrorQuestionIndex(i);
        scrollToQuestion(i);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        const optText = String(q.options[j] ?? "").trim();
        if (!optText) {
          toast.error(`Vui lòng nhập phương án trả lời ${String.fromCharCode(65 + j)} của câu hỏi ${i + 1}!`);
          setErrorQuestionIndex(i);
          scrollToQuestion(i);
          return;
        }
      }
      if (q.correctOptionIndex === -1 || q.correctOptionIndex === undefined || q.correctOptionIndex === null) {
        toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}!`);
        setErrorQuestionIndex(i);
        scrollToQuestion(i);
        return;
      }
    }

    const sanitizedQuestions = quizQuestions.map(q => ({
      ...q,
      questionText: String(q.questionText || "").trim(),
      options: q.options.map((opt: any) => String(opt ?? "").trim()),
      correctOptionIndex: Number(q.correctOptionIndex),
      points: Number(q.points) || 1,
    }));

    try {
      await onSubmit({
        title: cleanTitle,
        durationMinutes: Number(quizDuration) || 15,
        questions: sanitizedQuestions,
        shuffleQuestions,
        shuffleOptions,
        allowMultipleSubmissions
      });
    } catch (err: any) {
      // Error is handled in parent
    }
  };

  const handleOpenPreview = () => {
    if (!String(quizTitle || "").trim()) {
      toast.warning("Vui lòng nhập tiêu đề đề thi để xem trước!");
      return;
    }
    setIsPreviewOpen(true);
    setCurrentPreviewIndex(0);
  };

  return (
    <div className={styles.createQuizView}>
      <div className={styles.formHeader}>
        <h3>Tạo đề thi trắc nghiệm mới</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="Xem trước toàn bộ đề thi"
          >
            <Eye size={16} weight="bold" className="text-slate-600" />
            <span>Xem trước</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTemplateGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="Xem định dạng file Word & Excel chuẩn"
          >
            <Question size={16} weight="bold" className="text-orange-500" />
            <span>File mẫu & Hướng dẫn</span>
          </button>
          <FolderImportButton onClick={() => fileCombinedImportRef.current?.click()} title="Nhập dữ liệu (Word/Excel)" />
          <AiGenerateButton onClick={() => !isGeneratingAI && fileDocxAIImportRef.current?.click()} disabled={isGeneratingAI} isGeneratingAI={isGeneratingAI} />
        </div>
      </div>
      <input type="file" accept=".xlsx, .xls, .docx" ref={fileCombinedImportRef} style={{ display: "none" }} onChange={handleCombinedImport} />
      <input type="file" accept=".docx" ref={fileDocxAIImportRef} style={{ display: "none" }} onChange={handleImportDocxAI} />

      <form onSubmit={handleSaveQuiz} noValidate>
        {/* THÔNG TIN CHUNG ĐỀ THI */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="quiz-title">Tiêu đề đề thi trắc nghiệm</label>
            <input id="quiz-title" type="text" placeholder="Ví dụ: Kiểm tra giữa kỳ môn Toán" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="quiz-duration">Thời gian làm bài (phút)</label>
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <NumberStepper value={quizDuration} onChange={(val) => setQuizDuration(Number(val))} min={1} max={180} step={1} fullWidth />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: '16px', gap: '24px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            <Checkbox id="shuffle-questions-cb" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
            <label htmlFor="shuffle-questions-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Đảo vị trí câu hỏi</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            <Checkbox id="shuffle-options-cb" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
            <label htmlFor="shuffle-options-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Đảo vị trí đáp án</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            <Checkbox id="allow-multiple-cb" checked={allowMultipleSubmissions} onChange={(e) => setAllowMultipleSubmissions(e.target.checked)} />
            <label htmlFor="allow-multiple-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Cho phép học sinh nộp nhiều lần</label>
          </div>
        </div>

        {/* THÂN LAYOUT: CHIA CỘT CHO DANH SÁCH CÂU HỎI & SIDEBAR MỤC LỤC */}
        <div style={{ display: "flex", gap: "24px", marginTop: "32px", alignItems: "flex-start" }}>

          {/* CỘT TRÁI: DANH SÁCH SOẠN CÂU HỎI */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.questionsSection} style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
              <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span>Danh sách câu hỏi ({quizQuestions.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>
                  <label htmlFor="total-max-score" style={{ color: '#475569', fontWeight: 600 }}>Điểm tối đa đề thi:</label>
                  <NumberStepper
                    value={totalMaxScore}
                    onChange={(val) => {
                      const newScore = Number(val);
                      setTotalMaxScore(newScore);
                      handleDistributePoints(quizQuestions, newScore);
                    }}
                    min={1}
                    max={100}
                    step={1}
                  />
                  <button
                    type="button"
                    onClick={() => handleDistributePoints()}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(47, 143, 163, 0.08)',
                      border: '1.5px solid rgba(47, 143, 163, 0.25)',
                      cursor: 'pointer',
                      color: '#2f8fa3',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Tự động chia đều điểm cho tất cả câu hỏi"
                  >
                    Chia đều điểm
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
                  <div className={styles.questionHeaderRow} onClick={() => setExpandedQuestionIndex(expandedQuestionIndex === qIndex ? null : qIndex)} style={{ cursor: 'pointer' }}>
                    <div className={styles.headerLeft}>
                      <span className={styles.gripHandle} onClick={(e) => e.stopPropagation()}><DotsSixVertical size={20} weight="bold" /></span>
                      <span style={{ fontWeight: 700, minWidth: '80px' }}>CÂU HỎI {qIndex + 1}</span>
                      {expandedQuestionIndex !== qIndex && (
                        <span style={{ marginLeft: '12px', color: '#475569', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                          - {q.questionText || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có nội dung</span>}
                        </span>
                      )}
                      <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <label htmlFor={`q-${qIndex}-points`} style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Điểm số:</label>
                        <NumberStepper value={q.points || 1} onChange={(val) => { const newQuestions = [...quizQuestions]; newQuestions[qIndex].points = Number(val); setQuizQuestions(newQuestions); }} min={0.5} max={100} step={0.5} />
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
                      <button type="button" className={styles.removeQBtn} onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(qIndex); }} title="Xóa câu hỏi này">
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                  {expandedQuestionIndex === qIndex && (
                    <div style={{ paddingTop: '16px', borderTop: '1px dashed #e2e8f0', marginTop: '16px' }}>
                      <div className={styles.formGroup}>
                        <div className={styles.questionLabelRow}>
                          <label htmlFor={`q-${qIndex}-text`}>Nội dung câu hỏi</label>
                          <button type="button" className={styles.imgUploadToggleBtn} onClick={() => setShowImageUpload(prev => ({ ...prev, [qIndex]: !prev[qIndex] }))} title={(showImageUpload[qIndex] || q.imageUrl) ? "Ẩn khung tải ảnh" : "Thêm ảnh cho câu hỏi"}>
                            <Image size={16} weight="duotone" />
                            <span>{(showImageUpload[qIndex] || q.imageUrl) ? "Ẩn ảnh" : "Thêm ảnh"}</span>
                          </button>
                        </div>
                        <textarea id={`q-${qIndex}-text`} placeholder="Nhập nội dung câu hỏi trắc nghiệm..." value={q.questionText} onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)} rows={2} required />
                        {(showImageUpload[qIndex] || q.imageUrl) && (
                          <CustomImageUpload imageUrl={q.imageUrl} onChange={(file) => { handleQuestionImage(qIndex, file); setShowImageUpload(prev => ({ ...prev, [qIndex]: true })); }} onRemove={() => handleRemoveQuestionImage(qIndex)} title="Nhấn để tải lên ảnh câu hỏi" />
                        )}
                      </div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "8px" }}>
                        Các phương án trả lời và tích chọn đáp án đúng
                        <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: "0.78rem" }}>({q.options.length} phương án, tối thiểu 2 · tối đa 6)</span>
                      </label>
                      <div className={styles.optionsGrid}>
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className={`${styles.optionInputGroup} ${q.correctOptionIndex === optIndex ? styles.optionCorrect : ""}`}>
                            <span className={styles.letterLabel}>{String.fromCharCode(65 + optIndex)}</span>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="text" style={{ flex: 1 }} placeholder={`Nhập phương án ${String.fromCharCode(65 + optIndex)}`} value={opt} onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)} required />
                            </div>
                            <CustomRadio name={`correct-opt-${qIndex}`} checked={q.correctOptionIndex === optIndex} onChange={() => handleCorrectOptionChange(qIndex, optIndex)} title="Chọn làm đáp án đúng" />
                            <button type="button" className={styles.optionRemoveBtn} onClick={() => handleRemoveOption(qIndex, optIndex)} title="Xóa phương án này" disabled={q.options.length <= 2}>×</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className={styles.btnAddOption} onClick={() => handleAddOption(qIndex)}>+ Thêm phương án</button>

                      <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                        <label htmlFor={`q-${qIndex}-explanation`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                          <Lightbulb size={16} weight="fill" className="text-amber-500" />
                          <span>Lời giải thích chi tiết / Hướng dẫn giải (Tùy chọn)</span>
                        </label>
                        <textarea
                          id={`q-${qIndex}-explanation`}
                          placeholder="Nhập giải thích vì sao chọn đáp án đúng này, các bước giải toán, kiến thức cần nhớ..."
                          value={q.explanation || ""}
                          onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                          rows={2}
                          style={{ fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" className={styles.btnAddQuestion} onClick={handleAddQuestion}>+ Thêm câu hỏi mới</button>
            </div>
          </div>

          {/* CỘT PHẢI: SIDEBAR MỤC LỤC CÂU HỎI & NÚT HÀNH ĐỘNG */}
          <div style={{
            width: "260px",
            position: "sticky",
            top: "85px",
            backgroundColor: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            maxHeight: "calc(100vh - 110px)",
            overflowY: "auto",
            flexShrink: 0
          }}>
            {/* Header mục lục */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>Mục lục câu hỏi</h5>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", backgroundColor: "#e2e8f0", padding: "2px 8px", borderRadius: "999px" }}>
                {quizQuestions.length} câu
              </span>
            </div>

            {/* Lưới câu hỏi */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "6px"
            }}>
              {quizQuestions.map((q, idx) => {
                const isCurrent = expandedQuestionIndex === idx;
                const hasContent = String(q.questionText || "").trim() !== "";
                const hasCorrectAns = q.correctOptionIndex !== -1;
                const isDone = hasContent && hasCorrectAns;

                let btnStyle: React.CSSProperties = {
                  height: "34px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s"
                };

                if (isCurrent) {
                  btnStyle.borderColor = "#f47c20";
                  btnStyle.backgroundColor = "rgba(244, 124, 32, 0.1)";
                  btnStyle.color = "#f47c20";
                } else if (isDone) {
                  btnStyle.borderColor = "#10b981";
                  btnStyle.backgroundColor = "#ecfdf5";
                  btnStyle.color = "#10b981";
                } else if (!hasCorrectAns && hasContent) {
                  btnStyle.borderColor = "#f59e0b";
                  btnStyle.backgroundColor = "#fffbeb";
                  btnStyle.color = "#f59e0b";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    style={btnStyle}
                    onClick={() => scrollToQuestion(idx)}
                    title={`Câu hỏi ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Chú thích trạng thái */}
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "10px", fontSize: "0.75rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#ecfdf5", border: "1.5px solid #10b981" }} />
                <span>Đã hoàn thành</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#fffbeb", border: "1.5px solid #f59e0b" }} />
                <span>Thiếu đáp án đúng</span>
              </div>
            </div>

            {/* KHỐI 3 NÚT HÀNH ĐỘNG GỌN GÀNG TRONG SIDEBAR */}
            <div style={{ borderTop: "1.5px solid #e2e8f0", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <SaveButton
                type="submit"
                disabled={isSaving}
                fullWidth
              >
                <FloppyDisk size={18} weight="bold" />
                <span>{isSaving ? "Đang lưu..." : "Lưu đề thi"}</span>
              </SaveButton>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  style={{
                    height: "28px",
                    padding: "0 6px",
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    transition: "all 0.15s"
                  }}
                  className="hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                  title="Xem trước đề thi"
                >
                  <Eye size={13} weight="bold" />
                  <span>Xem trước</span>
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  style={{
                    height: "28px",
                    padding: "0 6px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#94a3b8",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s"
                  }}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  title="Hủy bỏ soạn đề"
                >
                  <span>Hủy bỏ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* MODAL XEM TRƯỚC (PREVIEW) */}
      <QuizPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quizTitle={quizTitle}
        quizQuestions={quizQuestions}
      />

      {/* MODAL HƯỚNG DẪN FILE MẪU (WORD & EXCEL) */}
      <TemplateGuideModal
        isOpen={isTemplateGuideOpen}
        onClose={() => setIsTemplateGuideOpen(false)}
      />
    </div>
  );
}
