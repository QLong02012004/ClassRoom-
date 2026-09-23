import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useBlocker, useLocation, useSearchParams } from "react-router-dom";
import {
  Clock,
  CaretLeft,
  CaretRight,
  Info,
  GridFour,
  Trophy,
  PaperPlaneRight,
  ArrowLeft,
  ArrowRight,
  Flag,
  Warning,
  CheckCircle,
  CircleNotch,
  Check,
  Bookmark,
  ArrowsClockwise,
  Keyboard,
  X,
  SpeakerHigh,
  SpeakerSlash,
  Lightbulb
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { activityService } from "../../../service/activity.service.ts";
import { analyticsService } from "../../../service/analytics.service.ts";
import { SaveButton } from "../../../components/ui/Buttons/SaveButton.tsx";
import styles from "./TakeExam.module.scss";

interface TakeExamProps {
  isPractice?: boolean;
}

export default function TakeExam({ isPractice = false }: TakeExamProps = {}) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isPracticeMode = isPractice || location.pathname.startsWith("/practice");
  const practiceTag = searchParams.get("tag") || "Hàm số mũ và logarit";
  const practiceLimit = parseInt(searchParams.get("limit") || "10", 10);

  const [quiz, setQuiz] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0); // Display index
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [optionOrders, setOptionOrders] = useState<Record<number, number[]>>({});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isClosedQuiz, setIsClosedQuiz] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const [isTimeOutLocked, setIsTimeOutLocked] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSpeakingScore, setIsSpeakingScore] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [currentQIndex]);
  const saveDebounceTimer = useRef<any>(null);
  const endTimestampRef = useRef<number>(0);
  const serverDriftRef = useRef<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);
  const isAllowingExitRef = useRef(false);

  // Chặn điều hướng nội bộ bằng useBlocker của React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isAllowingExitRef.current &&
      !result &&
      !!quiz &&
      !isExpired &&
      !isSubmitting &&
      timeLeft > 0 &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowExitConfirm(true);
    }
  }, [blocker.state]);

  const handleAutoSubmitOnTimeOut = async () => {
    if (result || isSubmitting) return;
    setIsTimeOutLocked(true);
    setShowSubmitModal(false);
    setShowShortcutsModal(false);
    setShowGuideModal(false);
    setShowExitConfirm(false);
    await submitAnswers(true);
  };

  const fetchQuizDetails = async () => {
    if (isPracticeMode) {
      try {
        setLoading(true);
        const res = await analyticsService.getPracticeQuestions(practiceTag, practiceLimit);
        const questionsData = res?.data || [];
        const fetchedQuiz = {
          _id: `practice_${encodeURIComponent(practiceTag)}`,
          title: `Luyện tập: ${practiceTag}`,
          durationMinutes: Math.max(10, Math.ceil((questionsData.length || 10) * 1.5)),
          shuffleQuestions: false,
          shuffleOptions: false,
          questions: questionsData.map((q: any, idx: number) => ({
            _id: `pq_${idx}`,
            questionText: q.questionText,
            options: q.options || [],
            correctOptionIndex: q.correctOptionIndex,
            imageUrl: q.imageUrl,
            explanation: q.explanation || "Xem lại lý thuyết và các ví dụ trọng tâm của chuyên đề này."
          })),
          classId: "",
          subject: practiceTag,
          maxScore: 10
        };

        setQuiz(fetchedQuiz);
        setResult(null);

        const qOrder = Array.from({ length: fetchedQuiz.questions.length }, (_, i) => i);
        setQuestionOrder(qOrder);
        const oOrders: Record<number, number[]> = {};
        fetchedQuiz.questions.forEach((q: any, idx: number) => {
          oOrders[idx] = Array.from({ length: q.options.length }, (_, i) => i);
        });
        setOptionOrders(oOrders);

        // Khôi phục nháp luyện tập nếu có
        let localDraft: any = null;
        try {
          const localDraftStr = localStorage.getItem(`classroom_practice_draft_${practiceTag}`);
          if (localDraftStr) localDraft = JSON.parse(localDraftStr);
        } catch (e) {}

        if (localDraft?.answers && typeof localDraft.answers === "object") {
          setAnswers(localDraft.answers);
        }
        if (localDraft?.flagged && typeof localDraft.flagged === "object") {
          setFlagged(localDraft.flagged);
        }

        const durationMinutes = fetchedQuiz.durationMinutes || 15;
        const totalDurationMs = durationMinutes * 60 * 1000;
        const startedAtMs = localDraft?.startedAt ? new Date(localDraft.startedAt).getTime() : Date.now();
        endTimestampRef.current = startedAtMs + totalDurationMs;
        const initialRemaining = Math.max(
          0,
          Math.floor((endTimestampRef.current - Date.now()) / 1000)
        );
        setTimeLeft(initialRemaining);
      } catch (err: any) {
        toast.error(err.message || "Không thể tải bộ câu hỏi luyện tập!");
        navigate(-1);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!id) return;
    try {
      setLoading(true);
      const activityRes: any = await activityService.getActivityById(id);
      const activity = activityRes.data || activityRes;
      if (activity && activity._id) {
        const fetchedQuiz = {
          _id: activity._id,
          title: activity.title,
          durationMinutes: activity.durationMinutes || activity.bankItemId?.durationMinutes || 15,
          shuffleQuestions: activity.bankItemId?.shuffleQuestions,
          shuffleOptions: activity.bankItemId?.shuffleOptions,
          questions: activity.bankItemId?.quizQuestions || [],
          classId: activity.classId,
          subject: activity.subject || activity.bankItemId?.subject,
          maxScore: activity.maxScore || 10
        };

        let fetchedResult = null;
        try {
          const resultRes: any = await activityService.getMyQuizResult(id);
          const resultData = resultRes.data || resultRes;
          if (resultData && resultData.score !== undefined) {
            fetchedResult = resultData;
          }
        } catch (e) { }

        setQuiz(fetchedQuiz);
        setResult(fetchedResult);

        // Kiểm tra nếu bài thi đã quá hạn hoặc đã đóng và học sinh chưa từng nộp bài
        const isPastDue = activity.dueDate && new Date(activity.dueDate).getTime() < Date.now();
        const isClosed = activity.status === 'closed';

        if (!fetchedResult && (isPastDue || isClosed)) {
          setIsExpired(true);
          setIsClosedQuiz(isClosed);
          setExpiredMessage(
            isClosed
              ? "Bài thi này đã bị giáo viên đóng. Bạn không thể tham gia làm bài nữa."
              : `Thời hạn nộp bài thi đã kết thúc lúc ${new Date(activity.dueDate).toLocaleString('vi-VN')}. Bạn không thể tham gia làm bài nữa.`
          );
          setLoading(false);
          return;
        }

        // 1. Kiểm tra bản nháp từ Server Draft
        let draftRes: any = null;
        let draftData: any = null;
        try {
          draftRes = await activityService.getQuizDraft(id);
          draftData = draftRes?.data;
        } catch (e) { }

        // 2. Kiểm tra bản nháp từ LocalStorage
        let localDraft: any = null;
        try {
          const localDraftStr = localStorage.getItem(`classroom_exam_draft_${id}`);
          if (localDraftStr) {
            localDraft = JSON.parse(localDraftStr);
          }
        } catch (e) { }

        // Cài đặt và phục hồi thứ tự câu hỏi đã xáo trộn (đảm bảo reload không bị xáo lại câu hỏi)
        let qOrder = draftData?.questionOrder || localDraft?.questionOrder;
        if (!qOrder || qOrder.length !== fetchedQuiz.questions.length) {
          qOrder = Array.from({ length: fetchedQuiz.questions.length }, (_, i) => i);
          if (fetchedQuiz.shuffleQuestions && !fetchedResult) {
            for (let i = qOrder.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [qOrder[i], qOrder[j]] = [qOrder[j], qOrder[i]];
            }
          }
        }
        setQuestionOrder(qOrder);

        // Cài đặt và phục hồi thứ tự đáp án từng câu (đảm bảo reload không bị xáo lại đáp án)
        let oOrders = draftData?.optionOrders || localDraft?.optionOrders;
        if (!oOrders || Object.keys(oOrders).length === 0) {
          oOrders = {};
          fetchedQuiz.questions.forEach((q: any, idx: number) => {
            let optOrder = Array.from({ length: q.options.length }, (_, i) => i);
            if (fetchedQuiz.shuffleOptions && !fetchedResult) {
              for (let i = optOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [optOrder[i], optOrder[j]] = [optOrder[j], optOrder[i]];
              }
            }
            oOrders[idx] = optOrder;
          });
        }
        setOptionOrders(oOrders);

        // Phục hồi câu hỏi đang dừng lại
        const savedQIdx = draftData?.currentQIndex ?? localDraft?.currentQIndex;
        if (typeof savedQIdx === "number" && savedQIdx >= 0 && savedQIdx < fetchedQuiz.questions.length) {
          setCurrentQIndex(savedQIdx);
        }

        if (fetchedResult) {
          const answersMap: Record<number, number> = {};
          fetchedResult.answers.forEach((ans: number, idx: number) => {
            if (ans !== -1) {
              answersMap[idx] = ans;
            }
          });
          setAnswers(answersMap);
          // Xóa bản nháp trên máy khi đã có kết quả chính thức
          try {
            localStorage.removeItem(`classroom_exam_draft_${id}`);
          } catch (e) { }
        } else {
          // Tính toán thời gian thực tế đồng bộ với Server (không phụ thuộc vào đồng hồ máy cá nhân)
          const serverTimeStr = draftRes?.serverTime || new Date().toISOString();
          const serverNowMs = new Date(serverTimeStr).getTime();
          const clientNowMs = Date.now();
          serverDriftRef.current = serverNowMs - clientNowMs;

          const startedAtStr = draftData?.startedAt || localDraft?.startedAt || serverTimeStr;
          const startedAtMs = new Date(startedAtStr).getTime();
          const durationMinutes = fetchedQuiz.durationMinutes || 15;
          const totalDurationMs = durationMinutes * 60 * 1000;
          endTimestampRef.current = startedAtMs + totalDurationMs;

          const initialRemaining = Math.max(
            0,
            Math.floor((endTimestampRef.current - (Date.now() + serverDriftRef.current)) / 1000)
          );
          setTimeLeft(initialRemaining);

          // Khôi phục đáp án đã chọn từ Server Draft và LocalStorage
          let recoveredAnswers: Record<number, number> = {};
          let recoveredFlagged: Record<number, boolean> = {};
          let recoveredTime: string | null = null;

          if (draftData?.answers && typeof draftData.answers === "object") {
            recoveredAnswers = { ...draftData.answers };
          }
          if (draftData?.flagged && typeof draftData.flagged === "object") {
            recoveredFlagged = { ...draftData.flagged };
          }
          if (draftData?.updatedAt) {
            const d = new Date(draftData.updatedAt);
            recoveredTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }

          if (localDraft?.answers && typeof localDraft.answers === "object") {
            recoveredAnswers = { ...recoveredAnswers, ...localDraft.answers };
          }
          if (localDraft?.flagged && typeof localDraft.flagged === "object") {
            recoveredFlagged = { ...recoveredFlagged, ...localDraft.flagged };
          }
          if (localDraft?.savedAt) {
            const d = new Date(localDraft.savedAt);
            recoveredTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }

          if (Object.keys(recoveredAnswers).length > 0) {
            setAnswers(recoveredAnswers);
          }
          if (Object.keys(recoveredFlagged).length > 0) {
            setFlagged(recoveredFlagged);
          }
          if (recoveredTime) {
            setLastSavedTime(recoveredTime);
            setSaveStatus("saved");
          }

          if (initialRemaining <= 0) {
            handleAutoSubmitOnTimeOut();
          }
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
  }, [id, isPracticeMode, practiceTag, practiceLimit]);

  // Submit helper: Chống accidental submit & khóa bài tự động
  const submitAnswers = async (auto = false) => {
    if (!quiz || result || isSubmitting) return;

    if (isPracticeMode) {
      try {
        setIsSubmitting(true);
        if (auto) setIsTimeOutLocked(true);

        const answersArray = Array.from({ length: quiz.questions.length }, (_, i) => {
          return answers[i] !== undefined ? answers[i] : -1;
        });

        let calculatedCorrect = 0;
        quiz.questions.forEach((q: any, idx: number) => {
          if (answers[idx] === q.correctOptionIndex) {
            calculatedCorrect++;
          }
        });

        const calculatedScore = quiz.questions.length > 0
          ? Math.round((calculatedCorrect / quiz.questions.length) * 10 * 10) / 10
          : 0;

        const resultData = {
          score: calculatedScore,
          answers: answersArray,
          submittedAt: new Date().toISOString()
        };

        setShowSubmitModal(false);
        setIsTimeOutLocked(false);
        setResult(resultData);
        setShowCompletionModal(true);

        try {
          localStorage.removeItem(`classroom_practice_draft_${practiceTag}`);
        } catch (e) {}

        toast.success(auto ? "Thời gian đã hết! Đã nộp bài luyện tập." : "Nộp bài luyện tập thành công!");

        setTimeout(() => {
          speakScore(calculatedScore, calculatedCorrect, quiz.questions.length, 10);
        }, 350);
      } catch (err: any) {
        toast.error("Nộp bài luyện tập thất bại!");
        setIsTimeOutLocked(false);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      if (auto) setIsTimeOutLocked(true);

      const answersArray = Array.from({ length: quiz.questions.length }, (_, i) => {
        return answers[i] !== undefined ? answers[i] : -1;
      });

      const res = await activityService.submitQuiz(quiz._id, answersArray);
      if (res && res.data) {
        setShowSubmitModal(false);
        setIsTimeOutLocked(false);
        // Xóa bản nháp sau khi nộp bài thành công
        try {
          localStorage.removeItem(`classroom_exam_draft_${quiz._id}`);
          localStorage.removeItem(`classroom_exam_draft_${id}`);
        } catch (e) { }

        toast.success(auto ? "Thời gian đã hết! Bài thi đã tự động khóa và nộp thành công." : "Nộp bài thi thành công!");

        try {
          const resultRes: any = await activityService.getMyQuizResult(quiz._id);
          const resultData = resultRes.data || resultRes;
          if (resultData && resultData.score !== undefined) {
            setResult(resultData);
            const answersMap: Record<number, number> = {};
            resultData.answers.forEach((ans: number, idx: number) => {
              if (ans !== -1) {
                answersMap[idx] = ans;
              }
            });
            setAnswers(answersMap);

            const calculatedCorrect = questionOrder.filter(
              (qIdx) => resultData.answers?.[qIdx] === quiz.questions[qIdx]?.correctOptionIndex
            ).length;

            setShowCompletionModal(true);

            // Bắt đầu đọc voice điểm số sau khi modal xuất hiện mượt mà
            setTimeout(() => {
              speakScore(resultData.score, calculatedCorrect, quiz.questions.length, quiz.maxScore || 10);
            }, 350);
          }
        } catch (e) { }
      }
    } catch (err: any) {
      toast.error(err.message || "Nộp bài thi thất bại! Vui lòng thử lại hoặc báo giáo viên.");
      setIsTimeOutLocked(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown timer chuẩn xác dựa trên thời gian Server
  useEffect(() => {
    if (loading || result || !quiz || endTimestampRef.current === 0) return;

    const checkTimer = () => {
      const currentServerTimeMs = Date.now() + serverDriftRef.current;
      const remainingSeconds = Math.max(0, Math.floor((endTimestampRef.current - currentServerTimeMs) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        handleAutoSubmitOnTimeOut();
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [loading, result, quiz]);

  // Theo dõi trạng thái mạng (online / offline) và tự động đồng bộ khi có mạng lại
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      toast.success("Đã có kết nối Internet trở lại! Đang tự động đồng bộ...");

      try {
        const localDraftStr = localStorage.getItem(`classroom_exam_draft_${id}`);
        if (localDraftStr && id && !result) {
          const localDraft = JSON.parse(localDraftStr);
          setSaveStatus("saving");
          await activityService.saveQuizDraft(id, localDraft);
          setSaveStatus("saved");
          setLastSavedTime(getCurrentTimeStr());
          toast.success("Bài làm đã được đồng bộ lên máy chủ an toàn!");
        }
      } catch (err) {
        setSaveStatus("offline");
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSaveStatus("offline");
      toast.error("Mất kết nối mạng! Bài làm đang được lưu an toàn trên máy.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [id, result]);

  // Cảnh báo người dùng khi reload hoặc cố tình đóng tab trình duyệt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isAllowingExitRef.current && !result && quiz && !isSubmitting && timeLeft > 0) {
        e.preventDefault();
        e.returnValue = "Bài thi đang diễn ra. Bạn có chắc chắn muốn rời đi?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [result, quiz, isSubmitting, timeLeft]);

  // Chặn phím Back của trình duyệt / chuột / lịch sử duyệt web khi đang làm bài
  useEffect(() => {
    if (result || !quiz || isSubmitting || loading) return;

    // Đẩy một trạng thái history để tạo điểm chặn cho nút Back trình duyệt
    window.history.pushState({ inExam: true }, "", window.location.href);

    const handlePopState = () => {
      if (isAllowingExitRef.current) return;
      if (!result && quiz && !isSubmitting && timeLeft > 0) {
        // Đẩy lại state để giữ chân học sinh trên trang thi
        window.history.pushState({ inExam: true }, "", window.location.href);
        setShowExitConfirm(true);
        setPendingExitUrl(quiz.classId ? `/classrooms/${quiz.classId}?tab=activities` : "/classrooms");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [result, quiz, isSubmitting, loading, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getCurrentTimeStr = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Cơ chế Autosave Debounce: lưu localStorage ngay lập tức (0ms) và đồng bộ Server sau 650ms
  const triggerAutosave = (
    newAnswers: Record<number, number>,
    newFlagged: Record<number, boolean>,
    qIdx = currentQIndex
  ) => {
    if (result) return;

    if (isPracticeMode) {
      const payload = {
        answers: newAnswers,
        flagged: newFlagged,
        questionOrder,
        optionOrders,
        currentQIndex: qIdx,
        startedAt: new Date(endTimestampRef.current - (quiz?.durationMinutes || 15) * 60 * 1000).toISOString(),
        savedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(`classroom_practice_draft_${practiceTag}`, JSON.stringify(payload));
      } catch (e) {}
      setSaveStatus("saved");
      setLastSavedTime(getCurrentTimeStr());
      return;
    }

    if (!id) return;
    setSaveStatus("saving");

    const payload = {
      answers: newAnswers,
      flagged: newFlagged,
      questionOrder,
      optionOrders,
      currentQIndex: qIdx,
      startedAt: new Date(endTimestampRef.current - (quiz?.durationMinutes || 15) * 60 * 1000).toISOString(),
      savedAt: new Date().toISOString()
    };

    // 1. Lưu tức thời vào localStorage để chống mất bài làm ngoại tuyến (0ms)
    try {
      localStorage.setItem(`classroom_exam_draft_${id}`, JSON.stringify(payload));
    } catch (e) { }

    // 2. Nếu đang offline, cập nhật trạng thái offline
    if (!navigator.onLine) {
      setSaveStatus("offline");
      setLastSavedTime(getCurrentTimeStr());
      return;
    }

    // 3. Debounce 650ms để đồng bộ lên Server (không spam API)
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }

    saveDebounceTimer.current = setTimeout(async () => {
      try {
        await activityService.saveQuizDraft(id, payload);
        setLastSavedTime(getCurrentTimeStr());
        setSaveStatus("saved");
      } catch (err) {
        // Nếu mạng chập chờn hoặc rớt mạng, chuyển sang trạng thái offline
        setLastSavedTime(getCurrentTimeStr());
        setSaveStatus("offline");
      }
    }, 650);
  };

  // Khi chọn đáp án
  const handleSelectOption = (actualQIdx: number, actualOptIdx: number) => {
    if (result || isSubmitting || isTimeOutLocked) return;
    const nextAnswers = {
      ...answers,
      [actualQIdx]: actualOptIdx
    };
    setAnswers(nextAnswers);
    triggerAutosave(nextAnswers, flagged);
  };

  // Khi cắm cờ đánh dấu câu hỏi
  const toggleFlag = (actualQIdx: number) => {
    if (result || isSubmitting || isTimeOutLocked) return;
    const nextFlagged = {
      ...flagged,
      [actualQIdx]: !flagged[actualQIdx]
    };
    setFlagged(nextFlagged);
    triggerAutosave(answers, nextFlagged);
  };

  // Chuyển câu hỏi và lưu vết câu hiện tại
  const handleGoToQuestion = (displayIndex: number) => {
    if (displayIndex < 0 || !quiz || displayIndex >= quiz.questions.length) return;
    setCurrentQIndex(displayIndex);
    triggerAutosave(answers, flagged, displayIndex);
  };

  // Format điểm số: làm tròn tối đa 2 chữ số thập phân, xử lý triệt để floating-point (1.2000000000000004 -> 1.2)
  const formatScore = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return "0";
    return (Math.round(num * 100) / 100).toString();
  };

  // Voice đọc điểm thông minh chuẩn tiếng Việt (sử dụng Google TTS Audio Server-Side và fallback SpeechSynthesis tiếng Việt)
  const speakScore = (scoreVal: number, correctVal: number, totalVal: number, maxScoreVal = 10) => {
    stopSpeakingScore();

    const rawScore = Number(scoreVal) || 0;
    const scoreNum = Math.round(rawScore * 100) / 100;
    const maxScore = Number(maxScoreVal) || 10;
    const ratio = maxScore > 0 ? scoreNum / maxScore : 0;

    let praise = "Chúc mừng bạn đã hoàn thành xuất sắc bài thi!";
    if (ratio >= 0.9) {
      praise = "Chúc mừng bạn đã hoàn thành xuất sắc bài thi!";
    } else if (ratio >= 0.8) {
      praise = "Rất tốt! Bạn đã đạt kết quả bài thi cao.";
    } else if (ratio >= 0.65) {
      praise = "Khá tốt! Bạn đã hoàn thành bài thi.";
    } else if (ratio >= 0.5) {
      praise = "Bạn đã hoàn thành bài thi đạt yêu cầu.";
    } else {
      praise = "Bạn đã hoàn thành bài thi. Hãy tiếp tục ôn tập và cố gắng hơn nhé!";
    }

    // Đọc số thập phân tự nhiên cho tiếng Việt (e.g. 8.5 -> 8 phẩy 5)
    const scoreFormatted = Number.isInteger(scoreNum)
      ? String(scoreNum)
      : String(scoreNum).replace(".", " phẩy ");

    const textToSpeak = `${praise} Điểm số của bạn là ${scoreFormatted} trên ${maxScore} điểm. Bạn trả lời đúng ${correctVal} trên ${totalVal} câu hỏi.`;

    try {
      // 1. Ưu tiên phát qua Audio Endpoint chuẩn tiếng Việt từ backend (không phụ thuộc vào ngôn ngữ cài trên máy tính)
      const ttsAudioUrl = `/api/v1/tts?text=${encodeURIComponent(textToSpeak)}`;
      const audio = new Audio(ttsAudioUrl);
      audioRef.current = audio;

      setIsSpeakingScore(true);

      audio.onended = () => {
        setIsSpeakingScore(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Fallback: nếu mạng lỗi không load được audio backend, thử Web Speech API nếu máy có voice tiếng Việt
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const voices = window.speechSynthesis.getVoices();
          const viVoice = voices.find(
            (v) =>
              v.lang === "vi-VN" ||
              v.lang.toLowerCase().startsWith("vi") ||
              v.lang.toLowerCase().includes("vietnam")
          );
          if (viVoice) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = "vi-VN";
            utterance.voice = viVoice;
            utterance.rate = 0.95;
            utterance.onend = () => setIsSpeakingScore(false);
            utterance.onerror = () => setIsSpeakingScore(false);
            window.speechSynthesis.speak(utterance);
            return;
          }
        }
        setIsSpeakingScore(false);
        audioRef.current = null;
      };

      audio.play().catch(() => {
        setIsSpeakingScore(false);
      });
    } catch (e) {
      console.warn("Speech playback error:", e);
      setIsSpeakingScore(false);
    }
  };

  const stopSpeakingScore = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingScore(false);
  };

  const toggleSpeakScore = () => {
    if (isSpeakingScore) {
      stopSpeakingScore();
    } else if (result && quiz) {
      speakScore(result.score, correctCount, quiz.questions.length, quiz.maxScore || 10);
    }
  };

  // Cleanup âm thanh khi unmount
  useEffect(() => {
    return () => {
      stopSpeakingScore();
    };
  }, []);

  // Cảnh báo khi rời khỏi bài thi lúc đang làm
  const handleNavigateAway = (url: string) => {
    stopSpeakingScore();
    if (!result && quiz && !isSubmitting && timeLeft > 0) {
      setPendingExitUrl(url);
      setShowExitConfirm(true);
    } else {
      navigate(url);
    }
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setPendingExitUrl(null);
  };

  const confirmExit = () => {
    stopSpeakingScore();
    isAllowingExitRef.current = true;
    setShowExitConfirm(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else if (pendingExitUrl) {
      navigate(pendingExitUrl);
    } else {
      navigate(isPracticeMode ? "/dashboard" : (quiz?.classId ? `/classrooms/${quiz.classId}?tab=activities` : "/classrooms"));
    }
  };

  const actualQIndex = questionOrder[currentQIndex];
  const currentQ = quiz?.questions?.[actualQIndex];

  // Keyboard navigation for ultimate convenience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle modal phím tắt với phím '?'
      if (e.key === '?' || (e.key === '/' && !e.ctrlKey && !e.altKey)) {
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // Nhấn Esc để đóng các modal
      if (e.key === 'Escape') {
        if (showCompletionModal) {
          setShowCompletionModal(false);
          return;
        }
        if (showGuideModal) {
          setShowGuideModal(false);
          return;
        }
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (showSubmitModal) {
          setShowSubmitModal(false);
          return;
        }
        if (showExitConfirm) {
          cancelExit();
          return;
        }
      }

      if (showCompletionModal || showGuideModal || showShortcutsModal || showSubmitModal || showExitConfirm || result || !quiz || actualQIndex === undefined) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const optIdx = key.charCodeAt(0) - 65;
        const actualOptIdx = optionOrders[actualQIndex]?.[optIdx];
        if (actualOptIdx !== undefined && currentQ?.options?.[actualOptIdx] !== undefined) {
          handleSelectOption(actualQIndex, actualOptIdx);
        }
      } else if (['1', '2', '3', '4'].includes(key) && !e.ctrlKey && !e.altKey) {
        const optIdx = parseInt(key) - 1;
        const actualOptIdx = optionOrders[actualQIndex]?.[optIdx];
        if (actualOptIdx !== undefined && currentQ?.options?.[actualOptIdx] !== undefined) {
          handleSelectOption(actualQIndex, actualOptIdx);
        }
      } else if (key === 'F') {
        toggleFlag(actualQIndex);
      } else if (e.key === 'ArrowLeft') {
        if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentQIndex < quiz.questions.length - 1) setCurrentQIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuideModal, showShortcutsModal, showSubmitModal, showExitConfirm, result, currentQIndex, quiz, actualQIndex, optionOrders, currentQ]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircleNotch size={38} className="animate-spin text-[#f47c20]" />
        <p style={{ marginTop: 12, fontSize: "1.05rem", fontWeight: "700", color: "#64748b" }}>
          Đang chuẩn bị đề thi...
        </p>
      </div>
    );
  }

  if (isExpired && !result) {
    return (
      <div className={styles.loadingContainer}>
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-2">
          <Warning size={38} weight="duotone" />
        </div>
        <h2 className="text-xl font-black text-rose-700 mt-2">
          {isClosedQuiz ? "Bài thi đã bị đóng" : "Đã quá hạn nộp bài thi"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md text-center leading-relaxed">
          {expiredMessage}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              isAllowingExitRef.current = true;
              navigate(isPracticeMode ? "/dashboard" : (quiz?.classId ? `/classrooms/${quiz.classId}?tab=activities` : "/assignments"));
            }}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 cursor-pointer shadow-sm transition-colors"
          >
            Quay lại danh sách bài tập
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || questionOrder.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Warning size={42} className="text-red-500" />
        <p style={{ marginTop: 12, fontSize: "1.1rem", fontWeight: "800", color: "#ef4444" }}>
          Không tìm thấy bài thi hoặc đề thi chưa sẵn sàng!
        </p>
        <button
          type="button"
          onClick={() => navigate(isPracticeMode ? "/dashboard" : -1)}
          className="mt-4 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 cursor-pointer shadow-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = quiz.questions.length - answeredCount;
  const progressPercent = Math.round((answeredCount / quiz.questions.length) * 100);
  const isCurrentFlagged = !result && flagged[actualQIndex];
  const correctCount = result
    ? questionOrder.filter(idx => result.answers?.[idx] === quiz.questions[idx]?.correctOptionIndex).length
    : 0;
  const wrongCount = result ? quiz.questions.length - correctCount : 0;
  const isLastQuestion = currentQIndex === quiz.questions.length - 1;

  // Phân bổ 3 cấp độ cảnh báo theo tỷ lệ phần trăm thời gian động:
  // - Cảnh báo mạnh (đỏ / nhấp nhẹ): khi còn <= 10% thời gian (cho bài ngắn) hoặc <= 60s (cho bài dài)
  // - Cảnh báo vừa (vàng): khi còn <= 25% thời gian (cho bài ngắn) hoặc <= 5 phút (cho bài dài)
  // - Bình thường (xám): khi còn > 25% thời gian (và > 5 phút với bài dài)
  const totalSeconds = (quiz?.durationMinutes || 15) * 60;
  const dangerThreshold = Math.max(20, Math.min(60, Math.round(totalSeconds * 0.1)));
  const warningThreshold = Math.min(300, Math.max(dangerThreshold + 15, Math.round(totalSeconds * 0.25)));

  const timerStatus = result
    ? "completed"
    : timeLeft <= 0
    ? "expired"
    : timeLeft <= dangerThreshold
    ? "danger"
    : timeLeft <= warningThreshold
    ? "warning"
    : "normal";

  return (
    <div className={styles.examWrapper}>
      {/* =========================================================================
          TOP HEADER CHUYÊN BIỆT CHO MÀN HÌNH THI (STICKY KHI SCROLL)
          - Logo/ClassRoom
          - Tên bài: Test 1
          - Trạng thái lưu bài (Đã lưu tự động / Đang lưu...)
          - Thời gian còn lại (⏱ MM:SS Còn lại)
         ========================================================================= */}
      <header className={styles.examTopHeader}>
        <div className={styles.headerMainRow}>
          {/* LEFT: 1. LOGO & 2. TÊN BÀI */}
          {/* 1 & 2. LOGO / BRAND & TÊN BÀI: BREADCRUMB SẠCH "ClassRoom / Test 1" */}
          <div className={styles.headerLeft}>
            <button
              type="button"
              onClick={() => handleNavigateAway(isPracticeMode ? "/dashboard" : (quiz.classId ? `/classrooms/${quiz.classId}?tab=activities` : "/classrooms"))}
              className={styles.brandBtn}
              title={isPracticeMode ? "Quay lại Bảng điều khiển" : "Quay lại lớp học"}
            >
              <span className={styles.brandLogo}>🐧</span>
              <span className={styles.brandTitle}>ClassRoom</span>
            </button>

            <span className={styles.headerDivider}>/</span>

            <div className={styles.examTitleWrapper} title={quiz.title}>
              <span className={styles.examTitleText}>{quiz.title}</span>
            </div>
          </div>

          {/* RIGHT: TRẠNG THÁI LƯU BÀI + PHÍM TẮT + THỜI GIAN CÒN LẠI */}
          <div className={styles.headerRight}>
            {/* TRẠNG THÁI LƯU BÀI */}
            {result ? (
              <div className={`${styles.saveBadge} ${styles.saveSubmitted}`}>
                <CheckCircle size={14} weight="fill" />
                <span>Đã nộp bài</span>
              </div>
            ) : saveStatus === "saving" ? (
              <div className={`${styles.saveBadge} ${styles.saveSaving}`} title="Đang đồng bộ đáp án lên máy chủ...">
                <ArrowsClockwise size={13} weight="bold" className={styles.spinIcon} />
                <span>Đang lưu...</span>
              </div>
            ) : saveStatus === "offline" ? (
              <div
                className={`${styles.saveBadge} ${styles.saveOffline}`}
                title="Mất kết nối với máy chủ. Đáp án đang được lưu an toàn trên máy và sẽ tự động đồng bộ khi có mạng lại."
              >
                <ArrowsClockwise size={13} weight="bold" className={styles.spinIcon} />
                <span>Mất kết nối</span>
              </div>
            ) : (
              <div
                className={`${styles.saveBadge} ${styles.saveSaved}`}
                title="Đáp án đã được lưu an toàn trên hệ thống"
              >
                <Check size={13} weight="bold" />
                <span>
                  Đã lưu{lastSavedTime && <span className={styles.saveTimeText}> lúc {lastSavedTime}</span>}
                </span>
              </div>
            )}

            {!result && (
              <>
                <button
                  type="button"
                  className={styles.btnShortcutTrigger}
                  onClick={() => setShowShortcutsModal(true)}
                  title="Xem danh sách phím tắt tiện lợi (Phím ?)"
                >
                  <Keyboard size={15} weight="bold" />
                  <span>Phím tắt</span>
                </button>

                <button
                  type="button"
                  className={styles.btnShortcutTrigger}
                  onClick={() => setShowGuideModal(true)}
                  title="Xem hướng dẫn làm bài và xử lý sự cố"
                >
                  <Info size={15} weight="bold" />
                  <span>Trợ giúp</span>
                </button>
              </>
            )}

            {result ? (
              <div className={`${styles.scoreCompact} ${styles.headerScoreDesktopHide}`}>
                <Trophy size={17} weight="bold" />
                <span className={styles.scoreTime}>{formatScore(result.score)}/{quiz.maxScore || 10} điểm</span>
              </div>
            ) : (
              <div
                className={`${styles.timerCompact} ${styles.headerTimerDesktopHide} ${
                  timerStatus === "danger"
                    ? styles.timerDanger
                    : timerStatus === "warning"
                    ? styles.timerWarning
                    : styles.timerNormal
                }`}
                title={
                  timerStatus === "danger"
                    ? "Còn dưới 1 phút làm bài! Vui lòng hoàn tất và nộp bài."
                    : timerStatus === "warning"
                    ? "Còn dưới 5 phút làm bài!"
                    : "Thời gian làm bài còn lại"
                }
              >
                <Clock
                  size={18}
                  weight={timerStatus === "danger" ? "fill" : "bold"}
                  className={styles.timerIcon}
                />
                <span className={styles.timerTime}>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* CẢNH BÁO MẤT KẾT NỐI MẠNG */}
        {isOffline && !result && (
          <div className={styles.offlineStickyBanner}>
            <Warning size={16} weight="fill" />
            <span>Mất kết nối mạng! Đáp án của bạn đang được lưu tạm an toàn trên máy. Hệ thống sẽ tự động đồng bộ ngay khi có mạng.</span>
          </div>
        )}
      </header>

      {/* VÙNG NỘI DUNG BÀI THI MỞ RỘNG (1480px, THÔNG THOÁNG) */}
      <div className={styles.pageContainer}>
        <div className={styles.layout}>
          {/* CỘT TRÁI: KHU VỰC CÂU HỎI & ĐÁP ÁN LIỀN MẠCH */}
          <div className={styles.leftCol}>
            <div className={styles.questionCanvas}>
              {/* HEADER CÂU HỎI: CÂU 1 / 5 & CẮM CỜ */}
              <div className={styles.qHeaderRow}>
                <div className={styles.qIndexBadge}>
                  <span>Câu {currentQIndex + 1} / {quiz.questions.length}</span>
                </div>
                {!result && (
                  <button
                    type="button"
                    onClick={() => toggleFlag(actualQIndex)}
                    className={`${styles.flagBtn} ${isCurrentFlagged ? styles.flagged : ""}`}
                    title={isCurrentFlagged ? "Bỏ đánh dấu xem lại" : "Đánh dấu câu hỏi này để xem lại sau (Phím tắt: F)"}
                  >
                    <Flag size={14} weight={isCurrentFlagged ? "fill" : "bold"} />
                    <span>{isCurrentFlagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}</span>
                  </button>
                )}
              </div>

              {/* NỘI DUNG CÂU HỎI NỔI BẬT */}
              <div className={styles.qContentWrapper}>
                <h3 className={styles.qText}>{currentQ.questionText}</h3>
                {currentQ.imageUrl && (
                  <div className={styles.qImageWrapper}>
                    <img src={currentQ.imageUrl} alt="Hình ảnh minh họa câu hỏi" />
                  </div>
                )}
              </div>

              {/* DÒNG PHÂN CÁCH MỀM */}
              <div className={styles.qDivider} />

              {/* CÁC ĐÁP ÁN A, B, C, D TRỰC TIẾP TRONG FLOW */}
              <div className={styles.optionsList}>
                {(optionOrders[actualQIndex] || []).map((actualOptIdx, displayOptIdx) => {
                  const opt = currentQ.options[actualOptIdx];
                  const isSelected = answers[actualQIndex] === actualOptIdx;
                  const isCorrect = result ? actualOptIdx === currentQ.correctOptionIndex : false;
                  const isWrong = result ? (isSelected && actualOptIdx !== currentQ.correctOptionIndex) : false;

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
                      key={actualOptIdx}
                      className={optionClass}
                      onClick={() => handleSelectOption(actualQIndex, actualOptIdx)}
                    >
                      <div className={styles.optLetter}>
                        <span>{String.fromCharCode(65 + displayOptIdx)}</span>
                        {isSelected && !result && (
                          <span className={styles.optLetterBadge} title="Đang chọn">
                            <Check size={9} weight="bold" />
                          </span>
                        )}
                      </div>
                      <span className={opt.trim() === "" ? styles.optTextEmpty : styles.optText}>{opt}</span>

                      {isSelected && !result && (
                        <div className={styles.optSelectedIndicator}>
                          <Check size={13} weight="bold" />
                          <span>Đang chọn</span>
                        </div>
                      )}
                      {isCorrect && (
                        <div className={`${styles.optResultIndicator} ${styles.optCorrectBadge}`}>
                          <Check size={13} weight="bold" />
                          <span>Đáp án đúng</span>
                        </div>
                      )}
                      {isWrong && (
                        <div className={`${styles.optResultIndicator} ${styles.optWrongBadge}`}>
                          <span>✕ Lựa chọn sai</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* LỜI GIẢI THÍCH CHI TIẾT KHI XEM LẠI BÀI ĐÃ NỘP (TC-STU-14.2) */}
              {result && (
                <div className={styles.explanationBox}>
                  <div className={styles.explanationHeader}>
                    <div className={styles.explanationIcon}>
                      <Lightbulb size={18} weight="fill" />
                    </div>
                    <span className={styles.explanationTitle}>Lời giải thích chi tiết:</span>
                  </div>
                  <div className={styles.explanationBody}>
                    {currentQ?.explanation ? (
                      <p className={styles.explanationText}>{currentQ.explanation}</p>
                    ) : (
                      <p className={styles.explanationEmpty}>
                        Chưa có lời giải thích chi tiết cho câu hỏi này từ giáo viên.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ĐIỀU HƯỚNG CÂU HỎI: ← CÂU TRƯỚC    1 / 5    CÂU TIẾP THEO → (HOẶC HOÀN THÀNH BÀI →) */}
              <div className={styles.navButtons}>
                <button
                  type="button"
                  className={styles.btnPrev}
                  disabled={currentQIndex === 0 || isSubmitting || isTimeOutLocked}
                  onClick={() => handleGoToQuestion(currentQIndex - 1)}
                  title="Về câu hỏi trước (Phím tắt: ←)"
                >
                  <CaretLeft size={16} weight="bold" />
                  <span>Câu trước</span>
                </button>

                <div className={styles.navCounterBadge}>
                  <span className={styles.currentNum}>{currentQIndex + 1}</span>
                  <span className={styles.counterSep}>/</span>
                  <span className={styles.totalNum}>{quiz.questions.length}</span>
                </div>

                {isLastQuestion ? (
                  !result ? (
                    <button
                      type="button"
                      className={`${styles.btnNext} ${styles.btnFinish}`}
                      disabled={isSubmitting || isTimeOutLocked}
                      onClick={() => setShowSubmitModal(true)}
                      title="Nộp và kết thúc bài thi"
                    >
                      <span>Hoàn thành bài</span>
                      <ArrowRight size={16} weight="bold" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnNext}
                      disabled
                    >
                      <span>Hết đề thi</span>
                      <CaretRight size={16} weight="bold" />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className={styles.btnNext}
                    disabled={isSubmitting || isTimeOutLocked}
                    onClick={() => handleGoToQuestion(currentQIndex + 1)}
                    title="Sang câu hỏi tiếp theo (Phím tắt: →)"
                  >
                    <span>Câu tiếp theo</span>
                    <CaretRight size={16} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH CÂU HỎI & NÚT NỘP BÀI */}
          <div className={styles.rightCol}>
            <div className={styles.gridCard}>
              {/* ĐỒNG HỒ ĐẾM NGƯỢC NỔI BẬT ĐẶT TRONG DANH SÁCH CÂU HỎI */}
              {!result && (
                <div
                  className={`${styles.sidebarTimerBox} ${
                    timerStatus === "danger"
                      ? styles.sidebarTimerDanger
                      : timerStatus === "warning"
                      ? styles.sidebarTimerWarning
                      : styles.sidebarTimerNormal
                  }`}
                  title={
                    timerStatus === "danger"
                      ? "Cảnh báo: Thời gian làm bài sắp hết!"
                      : timerStatus === "warning"
                      ? "Còn dưới 5 phút làm bài!"
                      : "Thời gian làm bài còn lại"
                  }
                >
                  <div className={styles.timerBoxLeft}>
                    <div className={styles.timerBadgeIcon}>
                      <Clock
                        size={20}
                        weight={timerStatus === "danger" ? "fill" : "bold"}
                      />
                    </div>
                    <div className={styles.timerLabelCol}>
                      <span className={styles.timerBoxLabel}>Thời gian còn lại</span>
                      {timerStatus === "danger" && (
                        <span className={styles.timerDangerTag}>Sắp hết giờ</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.timerBoxRight}>
                    <span className={styles.timerBoxDigits}>{formatTime(timeLeft)}</span>
                  </div>
                </div>
              )}

              {result && (
                <div className={styles.sidebarScoreBox}>
                  <div className={styles.scoreBadgeIcon}>
                    <Trophy size={18} weight="bold" />
                  </div>
                  <div className={styles.scoreLabelCol}>
                    <span className={styles.scoreBoxLabel}>Điểm bài thi</span>
                    <span className={styles.scoreBoxValue}>
                      {formatScore(result.score)}/{quiz.maxScore || 10} <span className={styles.scoreUnitText}>điểm</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.voiceScoreBtn} ${isSpeakingScore ? styles.voiceSpeaking : ""}`}
                    onClick={toggleSpeakScore}
                    title={isSpeakingScore ? "Dừng giọng đọc điểm" : "Nghe đọc lại điểm số (Voice)"}
                  >
                    {isSpeakingScore ? (
                      <>
                        <div className={styles.waveBarsSmall}>
                          <span />
                          <span />
                          <span />
                        </div>
                        <SpeakerSlash size={14} weight="bold" />
                      </>
                    ) : (
                      <>
                        <SpeakerHigh size={15} weight="bold" />
                        <span className={styles.voiceBtnLabel}>Nghe điểm</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className={styles.gridHeader}>
                <div className={styles.gridTitleRow}>
                  <GridFour size={20} weight="fill" />
                  <span>Danh sách câu hỏi</span>
                </div>
                <span className={styles.progressPill} title={`Đã làm ${answeredCount}/${quiz.questions.length} câu`}>
                  {answeredCount}/{quiz.questions.length}
                </span>
              </div>

              {/* LƯỚI CÂU HỎI 6 CỘT CHUẨN, THOÁNG ĐÃNG */}
              <div className={styles.numberGrid}>
                {questionOrder.map((actualIdx, displayIdx) => {
                  const isAnswered = answers[actualIdx] !== undefined;
                  const isCurrent = displayIdx === currentQIndex;
                  const isQuestionFlagged = !result && flagged[actualIdx];

                  let statusClass = styles.unanswered;
                  if (isCurrent) {
                    statusClass = styles.current;
                  } else if (result) {
                    const studentAns = result.answers?.[actualIdx];
                    const correctAns = quiz.questions[actualIdx]?.correctOptionIndex;
                    statusClass = studentAns === correctAns ? styles.correct : styles.wrong;
                  } else if (isQuestionFlagged) {
                    statusClass = styles.flagged;
                  } else if (isAnswered) {
                    statusClass = styles.answered;
                  }

                  return (
                    <button
                      key={displayIdx}
                      ref={isCurrent ? activeBtnRef : null}
                      type="button"
                      disabled={isTimeOutLocked || isSubmitting}
                      className={`${styles.numBtn} ${statusClass} ${isCurrent ? styles.current : ""} ${isQuestionFlagged ? styles.flagged : ""} ${isAnswered ? styles.hasAnswered : ""}`}
                      onClick={() => handleGoToQuestion(displayIdx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!result && !isTimeOutLocked && !isSubmitting) toggleFlag(actualIdx);
                      }}
                      title={`Câu ${displayIdx + 1}: ${
                        isCurrent
                          ? `Đang làm (${isAnswered ? "Đã chọn" : "Chưa chọn"})`
                          : isAnswered
                          ? "Đã chọn đáp án"
                          : "Chưa chọn"
                      }${isQuestionFlagged ? " • Đã đánh dấu" : ""}`}
                    >
                      <span className={styles.numText}>{displayIdx + 1}</span>
                      {!result && (
                        <span
                          role="button"
                          tabIndex={0}
                          className={`${styles.navFlagBtn} ${isQuestionFlagged ? styles.flaggedActive : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlag(actualIdx);
                          }}
                          title={isQuestionFlagged ? "Bỏ đánh dấu câu này" : "Đánh dấu câu này để xem lại"}
                        >
                          <Bookmark size={11} weight={isQuestionFlagged ? "fill" : "bold"} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* KHI ĐÃ NỘP BÀI THI: HIỂN THỊ TÓM TẮT ĐÚNG / SAI GỌN GÀNG & QUAY LẠI LỚP */}
              {result && (
                <>
                  <div className={styles.resultSummaryRow}>
                    <div className={styles.resStatItem}>
                      <span className={`${styles.resStatDot} ${styles.dotCorrect}`} />
                      <span>Đúng: <strong>{correctCount}</strong></span>
                    </div>
                    <div className={styles.resStatItem}>
                      <span className={`${styles.resStatDot} ${styles.dotWrong}`} />
                      <span>Sai: <strong>{wrongCount}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.btnBackClassroom}
                    onClick={() => {
                      stopSpeakingScore();
                      navigate(quiz.classId ? `/classrooms/${quiz.classId}?tab=activities` : "/classrooms");
                    }}
                  >
                    <ArrowLeft size={16} weight="bold" />
                    <span>Quay lại lớp học</span>
                  </button>

                  <p className={styles.submitNote}>
                    Kết quả thi đã được lưu vào bảng điểm lớp học.
                  </p>
                </>
              )}
            </div>

            {/* KHỐI HÀNH ĐỘNG NỘP BÀI THI GỌN GÀNG */}
            {!result && (
              <div className={styles.submitCard}>
                <div className={styles.submitCardInfo}>
                  <span className={styles.submitCardTitle}>Nộp bài</span>
                  {unansweredCount > 0 ? (
                    <div className={styles.unansweredAlertBadge}>
                      <span>⚠️ Còn <strong>{unansweredCount}</strong> câu chưa trả lời</span>
                    </div>
                  ) : (
                    <div className={styles.allDoneAlertBadge}>
                      <span>✓ Đã trả lời đầy đủ các câu</span>
                    </div>
                  )}
                </div>

                <SaveButton
                  fullWidth
                  disabled={isSubmitting || isTimeOutLocked}
                  onClick={() => setShowSubmitModal(true)}
                  style={{
                    height: 46,
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    fontWeight: 800
                  }}
                >
                  <PaperPlaneRight size={18} weight="bold" />
                  <span>Nộp bài thi</span>
                </SaveButton>

                <p className={styles.submitNote}>
                  Bạn sẽ không thể thay đổi đáp án sau khi nộp.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN NỘP BÀI THI */}
      {showSubmitModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowSubmitModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#f47c20] flex items-center justify-center shrink-0">
                <PaperPlaneRight size={22} weight="bold" />
              </div>
              <div>
                <h3>Bạn chắc chắn muốn nộp bài?</h3>
                <p className="text-xs text-slate-500 m-0">Kiểm tra lại tiến độ làm bài trước khi hoàn tất</p>
              </div>
            </div>

            {/* CẢNH BÁO ĐẶC BIỆT NẾU CÒN CÂU CHƯA TRẢ LỜI */}
            {unansweredCount > 0 && (
              <div className={styles.modalAlertWarning}>
                <span className={styles.warningAlertEmoji}>⚠️</span>
                <div className={styles.warningAlertBody}>
                  <strong>Bạn còn {unansweredCount} câu chưa trả lời.</strong>
                  <p>Các câu chưa chọn đáp án sẽ không được tính điểm.</p>
                </div>
              </div>
            )}

            {/* THỐNG KÊ TIẾN ĐỘ RÕ RÀNG */}
            <div className={styles.modalStatsList}>
              <div className={styles.modalStatRow}>
                <span className={styles.statRowLabel}>Đã trả lời:</span>
                <span className={styles.statRowValAnswered}>
                  <strong>{answeredCount}</strong>/{quiz.questions.length}
                </span>
              </div>
              <div className={styles.modalStatRow}>
                <span className={styles.statRowLabel}>Chưa trả lời:</span>
                <span className={unansweredCount > 0 ? styles.statRowValUnanswered : styles.statRowValSuccess}>
                  <strong>{unansweredCount}</strong> câu
                </span>
              </div>
              {flaggedCount > 0 && (
                <div className={styles.modalStatRow}>
                  <span className={styles.statRowLabel}>Đang đánh dấu:</span>
                  <span className={styles.statRowValFlagged}>
                    🔖 <strong>{flaggedCount}</strong> câu
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Tiếp tục làm bài
              </button>
              <SaveButton
                fullWidth
                disabled={isSubmitting || isTimeOutLocked}
                onClick={() => submitAnswers()}
                style={{
                  height: 46,
                  borderRadius: "12px",
                  fontSize: "0.92rem",
                  fontWeight: 800
                }}
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={17} className={styles.spinIcon} />
                    <span>Đang nộp bài...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneRight size={17} weight="bold" />
                    <span>Nộp bài</span>
                  </>
                )}
              </SaveButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO RỜI BÀI THI */}
      {showExitConfirm && (
        <div className={styles.modalBackdrop} onClick={cancelExit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Warning size={22} weight="fill" />
              </div>
              <div>
                <h3>Cảnh báo: Rời khỏi bài thi?</h3>
                <p className="text-xs text-slate-500 m-0">Bài thi của bạn đang trong thời gian làm bài</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 m-0 leading-relaxed">
              Bạn có chắc chắn muốn rời khỏi bài thi? Đáp án bạn đã chọn đã được lưu tự động, nhưng <strong>thời gian làm bài vẫn tiếp tục đếm ngược</strong> và kết quả sẽ không được tính điểm cho đến khi bạn hoàn tất và nộp bài.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={cancelExit}
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                className={styles.btnExit}
                onClick={confirmExit}
              >
                Rời bài thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẢNG PHÍM TẮT TIỆN LỢI */}
      {showShortcutsModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowShortcutsModal(false)}>
          <div
            className={`${styles.modalContent} ${styles.shortcutsModalContent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.shortcutsModalHeader}>
              <div className={styles.shortcutsHeaderTitleGroup}>
                <div className={styles.shortcutsIconBadge}>
                  <Keyboard size={22} weight="fill" />
                </div>
                <div className={styles.shortcutsTitleGroup}>
                  <h3 className={styles.shortcutsTitle}>Phím tắt làm bài thi</h3>
                  <p className={styles.shortcutsSubtitle}>Thao tác nhanh trên bàn phím giúp bạn làm bài tiện lợi hơn</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowShortcutsModal(false)}
                title="Đóng (Esc)"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className={styles.shortcutsList}>
              <div className={styles.shortcutRow}>
                <div className={styles.shortcutKeys}>
                  <kbd>A</kbd>
                  <kbd>B</kbd>
                  <kbd>C</kbd>
                  <kbd>D</kbd>
                  <span className={styles.shortcutOr}>hoặc</span>
                  <kbd>1</kbd>
                  <kbd>2</kbd>
                  <kbd>3</kbd>
                  <kbd>4</kbd>
                </div>
                <div className={styles.shortcutDesc}>
                  <div className={styles.shortcutDescTitle}>Chọn đáp án</div>
                  <div className={styles.shortcutDescText}>Chọn nhanh lựa chọn tương ứng</div>
                </div>
              </div>

              <div className={styles.shortcutRow}>
                <div className={styles.shortcutKeys}>
                  <kbd>←</kbd>
                  <kbd>→</kbd>
                </div>
                <div className={styles.shortcutDesc}>
                  <div className={styles.shortcutDescTitle}>Chuyển câu hỏi</div>
                  <div className={styles.shortcutDescText}>Mũi tên Trái về câu trước, Phải sang câu tiếp</div>
                </div>
              </div>

              <div className={styles.shortcutRow}>
                <div className={styles.shortcutKeys}>
                  <kbd>F</kbd>
                </div>
                <div className={styles.shortcutDesc}>
                  <div className={styles.shortcutDescTitle}>Đánh dấu câu hỏi</div>
                  <div className={styles.shortcutDescText}>Bật / tắt cờ đánh dấu để xem lại sau</div>
                </div>
              </div>

              <div className={styles.shortcutRow}>
                <div className={styles.shortcutKeys}>
                  <kbd>?</kbd>
                </div>
                <div className={styles.shortcutDesc}>
                  <div className={styles.shortcutDescTitle}>Bật / tắt trợ giúp</div>
                  <div className={styles.shortcutDescText}>Nhấn dấu hỏi để mở hoặc đóng cửa sổ này</div>
                </div>
              </div>

              <div className={styles.shortcutRow}>
                <div className={styles.shortcutKeys}>
                  <kbd>Esc</kbd>
                </div>
                <div className={styles.shortcutDesc}>
                  <div className={styles.shortcutDescTitle}>Đóng cửa sổ</div>
                  <div className={styles.shortcutDescText}>Đóng cửa sổ phím tắt hoặc hộp thoại xác nhận</div>
                </div>
              </div>
            </div>

            <div className={styles.shortcutsModalFooter}>
              <button
                type="button"
                className={styles.btnUnderstand}
                onClick={() => setShowShortcutsModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HƯỚNG DẪN & QUY CHẾ BÀI THI */}
      {showGuideModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowGuideModal(false)}>
          <div
            className={`${styles.modalContent} ${styles.guideModalContent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.shortcutsModalHeader}>
              <div className={styles.shortcutsHeaderTitleGroup}>
                <div className={styles.shortcutsIconBadge}>
                  <Info size={22} weight="fill" />
                </div>
                <div className={styles.shortcutsTitleGroup}>
                  <h3 className={styles.shortcutsTitle}>Hướng dẫn & Lưu ý làm bài</h3>
                  <p className={styles.shortcutsSubtitle}>Quy chế thi và hướng dẫn xử lý khi gặp sự cố</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowGuideModal(false)}
                title="Đóng (Esc)"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className={styles.guideRulesList}>
              <div className={styles.guideRuleItem}>
                <div className={styles.ruleBadge}>1</div>
                <div className={styles.ruleText}>
                  <strong>Lưu bài tự động liên tục</strong>
                  <p>Mỗi câu trả lời bạn chọn được hệ thống lưu nháp ngay lập tức. Đừng lo nếu mạng chập chờn.</p>
                </div>
              </div>

              <div className={styles.guideRuleItem}>
                <div className={styles.ruleBadge}>2</div>
                <div className={styles.ruleText}>
                  <strong>Đồng hồ đếm ngược</strong>
                  <p>Thời gian làm bài hiển thị cố định ở đầu trang. Khi hết giờ, bài thi sẽ tự động thu và nộp.</p>
                </div>
              </div>

              <div className={styles.guideRuleItem}>
                <div className={styles.ruleBadge}>3</div>
                <div className={styles.ruleText}>
                  <strong>Phím tắt hỗ trợ</strong>
                  <p>Sử dụng phím A, B, C, D để chọn đáp án; phím ← → để chuyển câu; phím F để đánh dấu cờ.</p>
                </div>
              </div>

              <div className={styles.guideRuleItem}>
                <div className={styles.ruleBadge}>4</div>
                <div className={styles.ruleText}>
                  <strong>Xử lý khi gặp sự cố</strong>
                  <p>Nếu mất mạng, treo máy hoặc sự cố bất ngờ, hãy <strong>giữ nguyên màn hình</strong> và <strong>báo ngay cho giáo viên</strong> để được hỗ trợ kịp thời.</p>
                </div>
              </div>
            </div>

            <div className={styles.shortcutsModalFooter}>
              <button
                type="button"
                className={styles.btnUnderstand}
                onClick={() => setShowGuideModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY TỰ ĐỘNG KHÓA KHI HẾT GIỜ */}
      {isTimeOutLocked && (
        <div className={styles.timeoutLockOverlay}>
          <div className={styles.timeoutLockBox}>
            <div className={styles.timeoutLockIcon}>
              <Clock size={38} weight="fill" />
            </div>
            <h3>Hết giờ làm bài!</h3>
            <p>Hệ thống đang tự động khóa bài thi và nộp kết quả của bạn lên máy chủ...</p>
            <div className={styles.timeoutLoadingRow}>
              <CircleNotch size={18} className={styles.spinIcon} />
              <span>Vui lòng giữ nguyên màn hình...</span>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CHÚC MỪNG HOÀN THÀNH BÀI THI & VOICE ĐỌC ĐIỂM */}
      {showCompletionModal && result && (
        <div className={styles.modalBackdrop} onClick={() => setShowCompletionModal(false)}>
          <div
            className={`${styles.modalContent} ${styles.completionModalContent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setShowCompletionModal(false)}
              title="Đóng (Esc)"
            >
              <X size={18} weight="bold" />
            </button>

            {/* HEADER CHÚC MỪNG VỚI CÚP VÀNG */}
            <div className={styles.completionHeader}>
              <div className={styles.trophyGlowWrapper}>
                <div className={styles.trophyCircle}>
                  <Trophy size={26} weight="fill" />
                </div>
              </div>
              <h3 className={styles.completionTitle}>Hoàn thành bài thi!</h3>
              <p className={styles.completionSubtitle}>
                {quiz.title} • Kết quả đã được lưu tự động
              </p>
            </div>

            {/* KHỐI ĐIỂM SỐ NỔI BẬT */}
            <div className={styles.completionScoreCard}>
              <div className={styles.scoreBigRow}>
                <span className={styles.scoreBigNum}>{formatScore(result.score)}</span>
                <span className={styles.scoreMaxNum}>/{quiz.maxScore || 10}</span>
              </div>
              <div className={styles.scoreBadgeRank}>
                {(() => {
                  const max = quiz.maxScore || 10;
                  const ratio = max > 0 ? (result.score / max) : 0;
                  if (ratio >= 0.9) return <span className={styles.rankExcellent}>🌟 Xuất sắc</span>;
                  if (ratio >= 0.8) return <span className={styles.rankGreat}>✨ Rất tốt</span>;
                  if (ratio >= 0.65) return <span className={styles.rankGood}>👍 Khá tốt</span>;
                  if (ratio >= 0.5) return <span className={styles.rankPass}>✓ Đạt yêu cầu</span>;
                  return <span className={styles.rankEncourage}>💪 Cố gắng hơn</span>;
                })()}
              </div>
            </div>

            {/* THANH ĐIỀU KHIỂN & HIỆN TRẠNG VOICE ĐỌC ĐIỂM */}
            <div className={`${styles.voiceReadoutStrip} ${isSpeakingScore ? styles.voiceActive : ""}`}>
              <div className={styles.voiceStripLeft}>
                <div className={styles.voiceIconRing}>
                  <SpeakerHigh size={18} weight={isSpeakingScore ? "fill" : "bold"} />
                </div>
                <div className={styles.voiceStatusCol}>
                  <span className={styles.voiceStatusTitle}>
                    {isSpeakingScore ? "Đang đọc kết quả thi..." : "Giọng đọc điểm số (Voice)"}
                  </span>
                  {isSpeakingScore && (
                    <div className={styles.waveBars}>
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className={styles.voiceToggleBtn}
                onClick={toggleSpeakScore}
                title={isSpeakingScore ? "Dừng đọc" : "Nghe lại giọng đọc điểm"}
              >
                {isSpeakingScore ? (
                  <>
                    <SpeakerSlash size={15} weight="bold" />
                    <span>Dừng</span>
                  </>
                ) : (
                  <>
                    <SpeakerHigh size={15} weight="bold" />
                    <span>Nghe lại</span>
                  </>
                )}
              </button>
            </div>

            {/* THỐNG KÊ CHI TIẾT SỐ CÂU ĐÚNG / SAI */}
            <div className={styles.completionStatsGrid}>
              <div className={styles.completionStatBox}>
                <span className={styles.statBoxLabel}>Số câu đúng</span>
                <span className={`${styles.statBoxValue} ${styles.statValCorrect}`}>
                  {correctCount} / {quiz.questions.length}
                </span>
              </div>
              <div className={styles.completionStatBox}>
                <span className={styles.statBoxLabel}>Số câu sai</span>
                <span className={`${styles.statBoxValue} ${styles.statValWrong}`}>
                  {wrongCount} câu
                </span>
              </div>
              <div className={styles.completionStatBox}>
                <span className={styles.statBoxLabel}>Độ chính xác</span>
                <span className={`${styles.statBoxValue} ${styles.statValRate}`}>
                  {quiz.questions.length > 0
                    ? `${Math.round((correctCount / quiz.questions.length) * 100)}%`
                    : "100%"}
                </span>
              </div>
            </div>

            {/* HÀNH ĐỘNG TIẾP THEO */}
            <div className={styles.completionActions}>
              <button
                type="button"
                className={styles.btnReviewDetail}
                onClick={() => setShowCompletionModal(false)}
              >
                Xem chi tiết đáp án
              </button>
              <button
                type="button"
                className={styles.btnBackToClass}
                onClick={() => {
                  stopSpeakingScore();
                  navigate(isPracticeMode ? "/dashboard" : (quiz.classId ? `/classrooms/${quiz.classId}?tab=activities` : "/classrooms"));
                }}
              >
                <ArrowLeft size={16} weight="bold" />
                <span>{isPracticeMode ? "Về Dashboard" : "Quay lại lớp học"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
