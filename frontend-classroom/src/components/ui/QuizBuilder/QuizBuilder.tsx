import React, { useState, useRef, useEffect } from "react";
import { DotsSixVertical, Image, Trash, Eye, CaretLeft, CaretRight, X } from "phosphor-react";
import { useToast } from "../../Styles/ToastContext";
import NumberStepper from "../NumberStepper";
import Checkbox from "../Checkbox/Checkbox";
import CustomImageUpload from "../CustomImageUpload";
import CustomRadio from "../CustomRadio/CustomRadio";
import AiGenerateButton from "../AiGenerateButton/AiGenerateButton";
import FolderImportButton from "../FolderImportButton/FolderImportButton";
import QuizPreviewModal from "../QuizPreviewModal/QuizPreviewModal";
import * as XLSX from "xlsx";
import styles from "./QuizBuilder.module.scss";
import { SecondaryButton } from "../SecondaryButton";

export interface QuizBuilderProps {
  initialData?: any;
  onSubmit: (quizData: {
    title: string;
    durationMinutes: number;
    questions: any[];
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function QuizBuilder({ initialData, onSubmit, onCancel, isSaving = false }: QuizBuilderProps) {
  const toast = useToast();

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
  }>>([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }]);

  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(0);
  const [errorQuestionIndex, setErrorQuestionIndex] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<Record<number, boolean>>({});

  // State cho phần Xem trước (Preview)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
      if (initialData.questions && initialData.questions.length > 0) {
        setQuizQuestions(initialData.questions);
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
      const response = await fetch("http://localhost:5000/api/v1/upload/docx", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Lỗi khi xử lý file");

      const rawText = data.text;
      const parsedQuestions: any[] = [];
      const questionBlocks = rawText.split(/Câu\s*\d+[:.\s-]/i).filter((b: string) => b.trim().length > 0);
      for (const block of questionBlocks) {
        const optionsMatch = block.match(/([A-D][.:\)])/ig);
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
              if (correctLetter === 'A') correctOptionIndex = 0;
              else if (correctLetter === 'B') correctOptionIndex = 1;
              else if (correctLetter === 'C') correctOptionIndex = 2;
              else if (correctLetter === 'D') correctOptionIndex = 3;
            }
          }
          let optText = block.substring(optStart + optionsMatch[i].length, optEnd).trim();
          optText = optText.replace(/Đáp\s*án\s*[:\s]*[A-D]/i, '').trim();
          options.push(optText);
        }
        parsedQuestions.push({
          questionText: questionText.replace(/\n/g, ' '),
          options: options.slice(0, 6),
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
      const response = await fetch("http://localhost:5000/api/v1/upload/docx-ai", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Lỗi khi AI sinh câu hỏi");

      const questions = data.data;
      if (questions && questions.length > 0) {
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

  const handleApplyDefaultPoints = () => {
    if (quizQuestions.length === 0) return;
    const updated = quizQuestions.map(q => ({ ...q, points: defaultPoints }));
    setQuizQuestions(updated);
    toast.success(`Đã áp dụng ${defaultPoints} điểm cho tất cả ${quizQuestions.length} câu hỏi!`);
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
      { questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }
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
    if (!quizTitle.trim()) { toast.error("Vui lòng nhập tiêu đề đề thi!"); return; }
    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.questionText.trim()) { toast.error(`Vui lòng nhập nội dung câu hỏi số ${i + 1}!`); return; }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) { toast.error(`Vui lòng nhập phương án trả lời ${String.fromCharCode(65 + j)} của câu hỏi ${i + 1}!`); return; }
      }
      if (q.correctOptionIndex === -1) {
        toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}!`);
        setErrorQuestionIndex(i);
        scrollToQuestion(i);
        return;
      }
    }
    try {
      await onSubmit({
        title: quizTitle.trim(),
        durationMinutes: quizDuration,
        questions: quizQuestions,
        shuffleQuestions,
        shuffleOptions
      });
    } catch (err: any) {
      // Error is handled in parent
    }
  };

  const handleOpenPreview = () => {
    if (!quizTitle.trim()) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderImportButton onClick={() => fileCombinedImportRef.current?.click()} title="Nhập dữ liệu (Word/Excel)" />
          <AiGenerateButton onClick={() => !isGeneratingAI && fileDocxAIImportRef.current?.click()} disabled={isGeneratingAI} isGeneratingAI={isGeneratingAI} />
        </div>
      </div>
      <input type="file" accept=".xlsx, .xls, .docx" ref={fileCombinedImportRef} style={{ display: "none" }} onChange={handleCombinedImport} />
      <input type="file" accept=".docx" ref={fileDocxAIImportRef} style={{ display: "none" }} onChange={handleImportDocxAI} />

      <form onSubmit={handleSaveQuiz}>
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

        <div className={styles.formRow} style={{ marginTop: '16px', gap: '24px', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            <Checkbox id="shuffle-questions-cb" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
            <label htmlFor="shuffle-questions-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Đảo vị trí câu hỏi</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            <Checkbox id="shuffle-options-cb" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
            <label htmlFor="shuffle-options-cb" style={{ cursor: 'pointer', userSelect: 'none' }}>Đảo vị trí đáp án</label>
          </div>
        </div>

        {/* THÂN LAYOUT: CHIA CỘT CHO DANH SÁCH CÂU HỎI & SIDEBAR MỤC LỤC */}
        <div style={{ display: "flex", gap: "24px", marginTop: "32px", alignItems: "flex-start" }}>

          {/* CỘT TRÁI: DANH SÁCH SOẠN CÂU HỎI */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.questionsSection} style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
              <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span>Danh sách câu hỏi ({quizQuestions.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>
                  <label htmlFor="default-points" style={{ color: '#64748b' }}>Cài điểm đồng loạt:</label>
                  <NumberStepper value={defaultPoints} onChange={(val) => setDefaultPoints(Number(val))} min={1} max={100} step={1} />
                  <button type="button" onClick={handleApplyDefaultPoints} style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#475569', fontWeight: 600, transition: 'all 0.2s' }}>Áp dụng</button>
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
                            <CustomRadio name={`correct-opt-${qIndex}`} checked={q.correctOptionIndex === optIndex} onChange={() => handleCorrectOptionChange(qIndex, optIndex)} title="Chọn làm đáp án đúng" required />
                            <button type="button" className={styles.optionRemoveBtn} onClick={() => handleRemoveOption(qIndex, optIndex)} title="Xóa phương án này" disabled={q.options.length <= 2}>×</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className={styles.btnAddOption} onClick={() => handleAddOption(qIndex)}>+ Thêm phương án</button>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" className={styles.btnAddQuestion} onClick={handleAddQuestion}>+ Thêm câu hỏi mới</button>
            </div>
          </div>

          {/* CỘT PHẢI: SIDEBAR MỤC LỤC CÂU HỎI */}
          <div style={{
            width: "220px",
            position: "sticky",
            top: "100px",
            backgroundColor: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "14px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}>
            <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>Mục lục câu hỏi</h5>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px"
            }}>
              {quizQuestions.map((q, idx) => {
                const isCurrent = expandedQuestionIndex === idx;
                const hasContent = q.questionText.trim() !== "";
                const hasCorrectAns = q.correctOptionIndex !== -1;
                const isDone = hasContent && hasCorrectAns;

                let btnStyle: React.CSSProperties = {
                  height: "36px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#475569",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s"
                };

                if (isCurrent) {
                  btnStyle.borderColor = "#fe6747";
                  btnStyle.backgroundColor = "rgba(254, 103, 71, 0.1)";
                  btnStyle.color = "#fe6747";
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
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "10px", fontSize: "0.75rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#ecfdf5", border: "1.5px solid #10b981" }} />
                <span>Đã hoàn thành</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#fffbeb", border: "1.5px solid #f59e0b" }} />
                <span>Thiếu đáp án đúng</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FIXED ACTIONS (STICKY) */}
        <div className={styles.formActions}>
          <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={isSaving}>Hủy bỏ</button>
          <button type="button" className={styles.btnPreview} onClick={handleOpenPreview}>
            <Eye size={18} weight="bold" />
            Xem trước
          </button>
          <SecondaryButton type="submit" className={styles.btnSave} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu đề thi"}
          </SecondaryButton>
        </div>
      </form>

      {/* MODAL XEM TRƯỚC (PREVIEW) */}
      <QuizPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quizTitle={quizTitle}
        quizQuestions={quizQuestions}
      />
    </div>
  );
}
