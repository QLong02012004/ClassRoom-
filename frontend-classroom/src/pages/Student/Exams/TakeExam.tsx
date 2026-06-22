import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alarm, CaretLeft, CaretRight, Info, PaperPlaneRight, GridFour, Trophy } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { quizService } from "../../../service/quiz.service.ts";
import type { IQuiz, IQuizResult } from "../../../service/quiz.service.ts";
import styles from "./TakeExam.module.scss";

export default function TakeExam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [quiz, setQuiz] = useState<IQuiz | null>(null);
  const [result, setResult] = useState<IQuizResult | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchQuizDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await quizService.getQuizDetail(id);
      if (res && res.data) {
        const { quiz: fetchedQuiz, result: fetchedResult } = res.data;
        setQuiz(fetchedQuiz);
        setResult(fetchedResult);
        
        if (fetchedResult) {
          // Map array of answers back to Record<number, number>
          const answersMap: Record<number, number> = {};
          fetchedResult.answers.forEach((ans, idx) => {
            if (ans !== -1) {
              answersMap[idx] = ans;
            }
          });
          setAnswers(answersMap);
        } else {
          // Initialize timer based on durationMinutes
          setTimeLeft(fetchedQuiz.durationMinutes * 60);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải thông tin đề thi!");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  // Submit helper
  const submitAnswers = async (auto = false) => {
    if (!quiz || result) return;

    // Map answers map to answers array
    const answersArray = Array.from({ length: quiz.questions.length }, (_, i) => {
      return answers[i] !== undefined ? answers[i] : -1;
    });

    try {
      const res = await quizService.submitQuiz(quiz._id, answersArray);
      if (res && res.data) {
        toast.success(auto ? "Thời gian đã hết! Bài thi đã tự động nộp thành công." : "Nộp bài thi thành công!");
        
        // Refetch to get the correct answers and update UI to review mode
        const detailRes = await quizService.getQuizDetail(quiz._id);
        if (detailRes && detailRes.data) {
          setQuiz(detailRes.data.quiz);
          setResult(detailRes.data.result);
          const answersMap: Record<number, number> = {};
          detailRes.data.result?.answers.forEach((ans, idx) => {
            if (ans !== -1) {
              answersMap[idx] = ans;
            }
          });
          setAnswers(answersMap);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Nộp bài thi thất bại!");
    }
  };

  // Countdown timer
  useEffect(() => {
    if (loading || result || !quiz || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitAnswers(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, result, quiz, timeLeft, answers]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optIndex: number) => {
    if (result) return; // Disable in result/review mode
    setAnswers({
      ...answers,
      [currentQIndex]: optIndex
    });
  };

  const handleManualSubmit = () => {
    if (window.confirm("Bạn có chắc chắn muốn nộp bài thi? Bạn sẽ không thể sửa đổi đáp án sau khi nộp.")) {
      submitAnswers();
    }
  };

  if (loading) {
    return (
      <div className={styles.page} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "#64748b" }}>Đang tải đề thi...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={styles.page} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "#ef4444" }}>Không tìm thấy đề thi!</p>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQIndex];

  return (
    <div className={styles.page}>
      {/* TOP HEADER */}
      <div className={styles.topHeader}>
        <div className={styles.headerTitles}>
          <h2>{quiz.title}</h2>
          <div className={styles.headerBadges}>
            <span className={styles.qCountBadge}>Câu {currentQIndex + 1}/{quiz.questions.length}</span>
            <span className={styles.subjectText}>Môn: Trắc nghiệm trực tuyến</span>
          </div>
        </div>
        {result ? (
          <div className={styles.timerCard} style={{ background: "#10B981", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)" }}>
            <Trophy size={24} weight="bold" />
            <div className={styles.timerText}>
              <span className={styles.timerLabel}>ĐIỂM SỐ CỦA BẠN</span>
              <span className={styles.timerValue}>{result.score}/10</span>
            </div>
          </div>
        ) : (
          <div className={styles.timerCard}>
            <Alarm size={24} weight="bold" />
            <div className={styles.timerText}>
              <span className={styles.timerLabel}>THỜI GIAN CÒN LẠI</span>
              <span className={styles.timerValue}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.layout}>
        {/* LEFT COLUMN: QUESTION CONTENT */}
        <div className={styles.leftCol}>
          <div className={styles.questionCard}>
            <h4 className={styles.qLabel}>CÂU HỎI {currentQIndex + 1}</h4>
            <p className={styles.qText}>{currentQ.questionText}</p>
          </div>

          <div className={styles.optionsList}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQIndex] === idx;
              const isCorrect = result ? idx === currentQ.correctOptionIndex : false;
              const isWrong = result ? (isSelected && idx !== currentQ.correctOptionIndex) : false;

              let optionClass = styles.optionItem;
              if (isCorrect) {
                optionClass += ` ${styles.correct}`;
              } else if (isWrong) {
                optionClass += ` ${styles.wrong}`;
              } else if (isSelected) {
                optionClass += ` ${styles.selected}`;
              }

              return (
                <div 
                  key={idx} 
                  className={optionClass}
                  onClick={() => handleSelectOption(idx)}
                >
                  <div className={`${styles.optLetter} ${isSelected ? styles.selectedLetter : ""}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={opt.trim() === "" ? styles.optTextEmpty : styles.optText}>{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className={styles.navButtons}>
            <button 
              className={styles.btnPrev} 
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(prev => prev - 1)}
            >
              <CaretLeft size={16} weight="bold" />
              Câu trước
            </button>
            <button 
              className={styles.btnNext} 
              disabled={currentQIndex === quiz.questions.length - 1}
              onClick={() => setCurrentQIndex(prev => prev + 1)}
            >
              Câu tiếp theo
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION GRID */}
        <div className={styles.rightCol}>
          <div className={styles.gridCard}>
            <div className={styles.gridHeader}>
              <GridFour size={20} weight="fill" />
              <span>Danh sách câu hỏi</span>
            </div>

            <div className={styles.numberGrid}>
              {quiz.questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = idx === currentQIndex;
                
                let statusClass = styles.unanswered;
                if (isCurrent) {
                  statusClass = styles.current;
                } else if (result) {
                  const studentAns = result.answers[idx];
                  const correctAns = quiz.questions[idx].correctOptionIndex;
                  statusClass = studentAns === correctAns ? styles.correct : styles.wrong;
                } else if (isAnswered) {
                  statusClass = styles.answered;
                }

                return (
                  <button 
                    key={idx} 
                    className={`${styles.numBtn} ${statusClass}`}
                    onClick={() => setCurrentQIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {result ? (
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.dot} ${styles.dotAnswered}`}></span>
                  Trả lời đúng
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.dot} ${styles.dotWrong}`}></span>
                  Trả lời sai
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.dot} ${styles.dotCurrent}`}></span>
                  Đang xem
                </div>
              </div>
            ) : (
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.dot} ${styles.dotAnswered}`}></span>
                  Đã trả lời
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.dot} ${styles.dotCurrent}`}></span>
                  Đang chọn
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.dot} ${styles.dotUnanswered}`}></span>
                  Chưa trả lời
                </div>
              </div>
            )}

            {result ? (
              <button 
                className={styles.btnSubmit} 
                style={{ backgroundColor: "#475569" }} 
                onClick={() => navigate(`/classrooms/${quiz.classId}?tab=quizzes`)}
              >
                Quay lại lớp học
              </button>
            ) : (
              <button className={styles.btnSubmit} onClick={handleManualSubmit}>
                Nộp bài thi
                <PaperPlaneRight size={18} weight="bold" />
              </button>
            )}
            
            <p className={styles.submitNote}>
              {result ? "Kết quả thi đã được lưu vào bảng điểm." : "Lưu ý: Không thể sửa sau khi đã nộp"}
            </p>
          </div>

          <div className={styles.helpCard}>
            <div className={styles.helpHeader}>
              <Info size={20} weight="bold" />
              <h4>Trợ giúp</h4>
            </div>
            <p>Nếu gặp sự cố về kỹ thuật, vui lòng báo giáo viên hoặc bộ phận kỹ thuật hỗ trợ ngay lập tức.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

