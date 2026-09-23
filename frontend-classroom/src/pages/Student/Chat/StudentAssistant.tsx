import React, { useState, useRef, useEffect } from "react";
import {
  PaperPlaneRight,
  Sparkle,
  Plus,
  ChatCircle,
  DotsThree,
  User,
  PencilSimpleLine,
  Lightbulb,
  BookOpen,
  Question,
  CheckCircle,
  CalendarPlus,
  X,
  CaretRight,
  GraduationCap,
  Lightning,
  Funnel,
  Chalkboard,
  CaretDown,
  Info,
  ArrowsClockwise,
  Clock,
  BookBookmark,
  Image,
  FilePdf,
  Paperclip,
  FileText,
  Trash
} from "phosphor-react";
import styles from "./StudentAssistant.module.scss";
import api from "../../../utils/AxiosCustomize";
import { useAuth } from "../../../context/AuthContext";
import { classroomService, type ITeacherClassroom } from "../../../service/classroom.service";
import NewChatButton from "../../../components/common/NewChatButton/NewChatButton";
import SecondaryButton from "../../../components/ui/Buttons/SecondaryButton";
import katex from "katex";

export interface ChatSessionItem {
  _id: string;
  title: string;
  subject?: string;
  className?: string;
  chapter?: string;
  createdAt: string;
  updatedAt: string;
}

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const SUBJECTS = [
  "Toán Học",
  "Vật Lý",
  "Hóa Học",
  "Ngữ Văn",
  "Tiếng Anh",
  "Lịch Sử",
  "Địa Lý",
  "Sinh Học",
  "Tin Học"
];

// Kho câu hỏi gợi ý ngẫu nhiên theo môn học
const DYNAMIC_QUESTION_PROMPTS: Record<string, string[]> = {
  "Toán Học": [
    "Giải thích đạo hàm cho em dễ hiểu",
    "Tạo 10 câu trắc nghiệm Toán chương 1",
    "Hướng dẫn phương pháp tìm tiệm cận đồ thị hàm số",
    "Cho ví dụ về ứng dụng Tích phân trong thực tế",
    "Giải chi tiết bài toán cực trị hàm số"
  ],
  "Vật Lý": [
    "Giải thích hiện tượng Dao động điều hòa",
    "Tóm tắt các công thức Sóng cơ & Sóng âm",
    "Tạo 5 câu hỏi ôn tập Dòng điện xoay chiều",
    "Hướng dẫn làm bài tập Vật lý hạt nhân"
  ],
  "Hóa Học": [
    "Cân bằng phản ứng Oxi hóa - Khử đơn giản",
    "Tóm tắt kiến thức Hóa học Hữu cơ 12",
    "Tạo 10 câu trắc nghiệm về Este - Lipit",
    "Giải thích cơ chế phản ứng xà phòng hóa"
  ],
  "Ngữ Văn": [
    "Tóm tắt bài Bình Ngô đại cáo",
    "Phân tích hình tượng người lính trong bài thơ Tây Tiến",
    "Dàn ý bài văn nghị luận xã hội về sự kiên trì",
    "Nêu ý nghĩa hình ảnh con sông Đà trong tác phẩm của Nguyễn Tuân"
  ],
  "Tiếng Anh": [
    "Tạo 10 câu trắc nghiệm thì Hiện tại hoàn thành",
    "Phân biệt cách dùng Câu điều kiện loại 2 và 3",
    "Viết một đoạn văn ngắn 100 từ về chủ đề Environment",
    "Giải thích cấu trúc đảo ngữ trong Tiếng Anh"
  ],
  "Lịch Sử": [
    "Tóm tắt các mốc sự kiện Cách mạng tháng Tám 1945",
    "Tạo 5 câu hỏi trắc nghiệm Lịch sử Việt Nam 1930 - 1945",
    "Phân tích nguyên nhân thắng lợi của chiến dịch Điện Biên Phủ"
  ],
  "Địa Lý": [
    "Tóm tắt đặc điểm địa hình và khí hậu Việt Nam",
    "Giải thích hiện tượng gió Mùa Đông Bắc",
    "Tạo 5 câu hỏi ôn tập Ngành Nông nghiệp Việt Nam"
  ],
  "Sinh Học": [
    "Giải thích quy luật di truyền Mendơl",
    "Tóm tắt quá trình Nhân đôi ADN",
    "Tạo 5 câu trắc nghiệm về Hệ sinh thái"
  ],
  "Tin Học": [
    "Giải thích thuật toán Sắp xếp nổi bọt (Bubble Sort)",
    "Tạo 5 câu trắc nghiệm kiến thức Cơ sở dữ liệu",
    "Hướng dẫn cách viết hàm đệ quy đơn giản"
  ],
  "Mặc định": [
    "Giải thích đạo hàm cho em dễ hiểu",
    "Tạo 10 câu trắc nghiệm chương 1",
    "Tóm tắt bài Bình Ngô đại cáo",
    "Lập kế hoạch học tập môn Toán trong 1 tuần",
    "Hướng dẫn giải bài tập nâng cao môn Hóa"
  ]
};

// Kho danh mục chương học mẫu theo môn
const CHAPTER_PRESETS: Record<string, string[]> = {
  "Toán Học": [
    "Chương 1: Ứng dụng đạo hàm khảo sát hàm số",
    "Chương 2: Hàm số mũ & Logarit",
    "Chương 3: Nguyên hàm, Tích phân & Ứng dụng",
    "Chương 4: Số phức & Hình học Oxyz",
    "Tổng hợp tất cả các chương"
  ],
  "Vật Lý": [
    "Chương 1: Dao động điều hòa & Cơ học",
    "Chương 2: Sóng cơ và Sóng âm",
    "Chương 3: Dòng điện xoay chiều",
    "Chương 4: Sóng ánh sáng & Hạt nhân nguyên tử",
    "Tổng hợp tất cả các chương"
  ],
  "Hóa Học": [
    "Chương 1: Este - Lipit",
    "Chương 2: Cacbohidrat",
    "Chương 3: Amin, Amino Axit và Peptit",
    "Chương 4: Đại cương về Kim loại",
    "Tổng hợp tất cả các chương"
  ],
  "Ngữ Văn": [
    "Chủ đề 1: Thơ ca & Văn học hiện đại 1945 - 1975",
    "Chủ đề 2: Văn học trung đại & Tác phẩm Chí Phèo",
    "Chủ đề 3: Phương pháp làm bài Nghị luận xã hội",
    "Tổng hợp tất cả các chương"
  ],
  "Tiếng Anh": [
    "Unit 1: Life Stories & Grammar Tenses",
    "Unit 2: Urbanisation & Passive Voice",
    "Unit 3: The Green Movement & Relative Clauses",
    "Unit 4: ASEAN and Viet Nam & Conditionals",
    "General Review & Practice Tests"
  ]
};

// Danh sách lớp mẫu định sẵn nếu chưa có lớp thực tế
const DEFAULT_CLASS_OPTIONS = [
  { id: "c1", className: "Lớp 12A1", subject: "Toán Học", grade: "12" },
  { id: "c2", className: "Lớp 12A2", subject: "Vật Lý", grade: "12" },
  { id: "c3", className: "Lớp 12A3", subject: "Hóa Học", grade: "12" },
  { id: "c4", className: "Lớp 10B", subject: "Ngữ Văn", grade: "10" },
  { id: "c5", className: "Lớp 11A", subject: "Tiếng Anh", grade: "11" },
  { id: "c0", className: "Tự Do", subject: "Kiến Thức Chung", grade: "Tổng Hợp" },
];

interface SuggestionItem {
  id: string;
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badge: string;
  defaultPrompt: string;
  placeholderText: string;
  quickOptions: string[];
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    id: "solve-exercise",
    icon: PencilSimpleLine,
    title: "Giải bài tập",
    description: "Hướng dẫn phương pháp và lời giải chi tiết từng bước cho bài tập môn học",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    badge: "Môn Tự Nhiên & Xã Hội",
    defaultPrompt: "Mình cần hướng dẫn giải bài tập này theo từng bước chi tiết để hiểu rõ phương pháp làm.",
    placeholderText: "Nhập đề bài tập hoặc dạng bài bạn đang gặp khó khăn (Ví dụ: Giải phương trình 2x^2 + 5x - 3 = 0)...",
    quickOptions: ["Dạng toán tìm x", "Bài tập Hoá học phản ứng", "Bài tập Vật lý rơi tự do", "Phân tích cú pháp Tiếng Anh"]
  },
  {
    id: "explain-concept",
    icon: Lightbulb,
    title: "Giải thích kiến thức",
    description: "Diễn giải các khái niệm, định lý khó hiểu bằng ví dụ thực tế trực quan",
    color: "#D97706",
    bgColor: "#FEF3C7",
    borderColor: "#FDE68A",
    badge: "Khái Niệm & Định Lý",
    defaultPrompt: "Hãy giải thích giúp mình khái niệm bài học này một cách ngắn gọn, dễ hiểu kèm ví dụ minh họa.",
    placeholderText: "Nhập khái niệm hoặc định lý bạn chưa hiểu (Ví dụ: Định luật Bảo toàn năng lượng, Thuyết tương đối)...",
    quickOptions: ["Khái niệm Triết học", "Hiện tượng Quang hợp", "Lực vạn vật hấp dẫn", "Thì Quá khứ hoàn thành"]
  },
  {
    id: "summarize-lesson",
    icon: BookOpen,
    title: "Tóm tắt bài học",
    description: "Tổng hợp các ý cốt lõi, sơ đồ kiến thức và từ khóa trọng tâm của bài học",
    color: "#059669",
    bgColor: "#D1FAE5",
    borderColor: "#A7F3D0",
    badge: "Ôn Tập & Tổng Hợp",
    defaultPrompt: "Mình muốn tóm tắt lại toàn bộ ý chính, từ khóa quan trọng và ghi nhớ cốt lõi của bài học này.",
    placeholderText: "Nhập tên bài học hoặc dán nội dung bài học cần tóm tắt...",
    quickOptions: ["Tóm tắt bài thơ/tác phẩm", "Tóm tắt sự kiện Lịch sử", "Tóm tắt công thức Vật lý", "Tóm tắt từ vựng Unit"]
  },
  {
    id: "generate-questions",
    icon: Question,
    title: "Tạo câu hỏi ôn tập",
    description: "Tự động tạo bộ câu hỏi trắc nghiệm & tự luận kèm đáp án và giải thích",
    color: "#7C3AED",
    bgColor: "#F3E8FF",
    borderColor: "#DDD6FE",
    badge: "Luyện Đề & Trắc Nghiệm",
    defaultPrompt: "Hãy tạo giúp mình 5 câu hỏi ôn tập (kèm đáp án giải thích) để mình tự luyện tập kiến thức.",
    placeholderText: "Nhập chủ đề hoặc chương học cần tạo câu hỏi ôn tập...",
    quickOptions: ["5 câu trắc nghiệm Toán", "5 câu trắc nghiệm Tiếng Anh", "3 câu hỏi tự luận Văn học", "Đề kiểm tra 15 phút"]
  },
  {
    id: "test-knowledge",
    icon: CheckCircle,
    title: "Kiểm tra kiến thức",
    description: "AI đóng vai giáo viên kiểm tra bài cũ và phản biện kiến thức trực tiếp",
    color: "#DB2777",
    bgColor: "#FCE7F3",
    borderColor: "#FBCFE8",
    badge: "Kiểm Tra Bài Cũ",
    defaultPrompt: "Hãy đóng vai giáo viên kiểm tra bài cũ của mình. Đưa ra câu hỏi đầu tiên để mình trả lời nhé!",
    placeholderText: "Nhập môn học hoặc chủ đề bạn đã học và muốn được AI đặt câu hỏi kiểm tra...",
    quickOptions: ["Kiểm tra Từ vựng Tiếng Anh", "Kiểm tra Công thức Hóa 12", "Hỏi bài cũ Lịch sử 11", "Kiểm tra Văn học 10"]
  },
  {
    id: "study-plan",
    icon: CalendarPlus,
    title: "Lập kế hoạch học tập",
    description: "Xây dựng lịch học cá nhân, thời gian biểu và lộ trình ôn thi hiệu quả",
    color: "#EA580C",
    bgColor: "#FFEDD5",
    borderColor: "#FED7AA",
    badge: "Lộ Trình & Lịch Học",
    defaultPrompt: "Hãy xây dựng giúp mình một lộ trình ôn tập và kế hoạch phân bổ thời gian học hiệu quả.",
    placeholderText: "Nhập mục tiêu học tập của bạn (Ví dụ: Ôn thi giữa kỳ môn Toán trong 1 tuần, đạt 8+ Tiếng Anh)...",
    quickOptions: ["Lịch ôn thi giữa kỳ", "Lộ trình 30 ngày lấy gốc", "Kế hoạch phân bổ học bài", "Mục tiêu đạt điểm 8+"]
  }
];

interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
  base64: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  attachments?: AttachmentItem[];
}

export default function StudentAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("Tất cả");
  const [activeModalSuggestion, setActiveModalSuggestion] = useState<SuggestionItem | null>(null);
  const [modalDetailInput, setModalDetailInput] = useState<string>("");

  // Quản lý file đính kèm bài tập/hình ảnh/PDF
  const [attachedFiles, setAttachedFiles] = useState<AttachmentItem[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState<boolean>(false);
  const [fileAcceptType, setFileAcceptType] = useState<string>("*");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ngữ cảnh lớp học học sinh đang tham gia
  const [studentClasses, setStudentClasses] = useState<Array<{ id: string; className: string; subject: string; grade: string }>>(DEFAULT_CLASS_OPTIONS);
  const [selectedClassContext, setSelectedClassContext] = useState<{ id: string; className: string; subject: string; grade: string }>(DEFAULT_CLASS_OPTIONS[0]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState<boolean>(false);

  // Ngữ cảnh chương/bài học đang theo học
  const [selectedChapter, setSelectedChapter] = useState<string>(CHAPTER_PRESETS["Toán Học"][0]);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState<boolean>(false);

  // Gợi ý câu hỏi ngẫu nhiên theo môn học
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const refreshSuggestedQuestions = (subjectName: string) => {
    const list = DYNAMIC_QUESTION_PROMPTS[subjectName] || DYNAMIC_QUESTION_PROMPTS["Mặc định"];
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setSuggestedQuestions(shuffled.slice(0, 3));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách lớp học thực tế của học sinh từ backend nếu có
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await classroomService.getStudentClassrooms();
        if (res && res.data && res.data.length > 0) {
          const mapped = res.data.map((c: ITeacherClassroom) => ({
            id: c._id || c.code,
            className: c.name,
            subject: c.subject || "Tổng hợp",
            grade: c.name.match(/\d+/)?.[0] ? `Lớp ${c.name.match(/\d+/)?.[0]}` : "THPT"
          }));
          setStudentClasses([...mapped, DEFAULT_CLASS_OPTIONS[DEFAULT_CLASS_OPTIONS.length - 1]]);
          setSelectedClassContext(mapped[0]);
        }
      } catch (err) {
        console.warn("Không thể tải danh sách lớp học của học sinh, dùng danh sách mặc định", err);
      }
    };
    fetchClassrooms();
  }, []);

  // Cập nhật gợi ý câu hỏi & chương học khi đổi môn học hoặc ngữ cảnh lớp học
  useEffect(() => {
    refreshSuggestedQuestions(selectedClassContext.subject);
    const presets = CHAPTER_PRESETS[selectedClassContext.subject] || [
      "Chương 1: Tổng quan kiến thức",
      "Chương 2: Bài tập vận dụng",
      "Tổng hợp tất cả các chương"
    ];
    setSelectedChapter(presets[0]);
  }, [selectedClassContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Quản lý lịch sử cuộc trò chuyện (Sessions)
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/api/v1/chat/sessions');
      if (res && res.data && res.data.data) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử trò chuyện:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    try {
      const res = await api.get(`/api/v1/chat/sessions/${sessionId}`);
      if (res && res.data && res.data.data) {
        const sessionData = res.data.data;
        setActiveSessionId(sessionId);
        setMessages(sessionData.messages || []);

        if (sessionData.className || sessionData.subject) {
          const matched = studentClasses.find(
            (c) => c.className === sessionData.className || c.subject === sessionData.subject
          );
          if (matched) {
            setSelectedClassContext(matched);
          }
        }
        if (sessionData.chapter) {
          setSelectedChapter(sessionData.chapter);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết cuộc trò chuyện:", err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?")) return;
    try {
      await api.delete(`/api/v1/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Lỗi khi xóa cuộc trò chuyện:", err);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setAttachedFiles([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const triggerFilePicker = (accept: string) => {
    setFileAcceptType(accept);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} vượt quá dung lượng tối đa 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const isImage = file.type.startsWith("image/");
        const newAtt: AttachmentItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || "application/octet-stream",
          previewUrl: isImage ? base64 : undefined,
          base64: base64
        };
        setAttachedFiles((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsAttachMenuOpen(false);
  };

  const handleSendWithText = async (textToSend: string, filesToSend: AttachmentItem[] = attachedFiles) => {
    if ((!textToSend.trim() && filesToSend.length === 0) || isTyping) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: textToSend,
      attachments: filesToSend.length > 0 ? [...filesToSend] : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      // Truyền thông tin lớp học, môn học & file đính kèm sang AI API
      const response: any = await api.post('/api/v1/chat/ask', {
        sessionId: activeSessionId,
        message: textToSend,
        attachments: filesToSend.map((att) => ({
          name: att.name,
          type: att.type,
          base64: att.base64
        })),
        classContext: {
          className: selectedClassContext.className,
          subject: selectedClassContext.subject,
          grade: selectedClassContext.grade,
          chapter: selectedChapter
        }
      });

      if (response && response.data && response.data.reply) {
        setMessages([...newMessages, {
          role: "ai",
          content: response.data.reply
        }]);

        if (response.data.sessionId) {
          const sid = response.data.sessionId;
          setActiveSessionId(sid);
          if (response.data.session) {
            setSessions((prev) => {
              const remaining = prev.filter((s) => s._id !== sid);
              return [response.data.session, ...remaining];
            });
          } else {
            fetchSessions();
          }
        }
      } else {
        setMessages([...newMessages, { role: "ai", content: "Xin lỗi, đã có lỗi xảy ra khi xử lý phản hồi." }]);
      }
    } catch (error) {
      console.error('Lỗi khi gọi AI API:', error);
      setMessages([...newMessages, { role: "ai", content: "Xin lỗi, hiện tại tôi không thể kết nối tới máy chủ. Vui lòng thử lại sau." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    const currentInput = input;
    const currentFiles = [...attachedFiles];
    setInput("");
    handleSendWithText(currentInput, currentFiles);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mở modal khi bấm thẻ gợi ý
  const openSuggestionModal = (item: SuggestionItem) => {
    setActiveModalSuggestion(item);
    setModalDetailInput("");
  };

  // Xử lý gửi prompt từ Modal Prompt Builder
  const handleModalSubmit = (useDefaultOnly: boolean = false) => {
    if (!activeModalSuggestion) return;

    let finalPrompt = "";
    if (useDefaultOnly || !modalDetailInput.trim()) {
      finalPrompt = `[Yêu cầu ${activeModalSuggestion.title} - ${selectedClassContext.className} · Môn ${selectedClassContext.subject}]: ${activeModalSuggestion.defaultPrompt}`;
    } else {
      finalPrompt = `[${activeModalSuggestion.title} - ${selectedClassContext.className} · Môn ${selectedClassContext.subject}]: ${modalDetailInput.trim()}`;
    }

    setActiveModalSuggestion(null);
    handleSendWithText(finalPrompt);
  };

  // Render LaTeX math expressions or fallback text safely
  const renderMathOrText = (formula: string, displayMode: boolean = false) => {
    try {
      const html = katex.renderToString(formula, {
        displayMode,
        throwOnError: false
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span>{formula}</span>;
    }
  };

  // Parse inline text formatting (Bold **text**, Inline Code `code`, Math LaTeX $formula$, Bước 1, Bước 2...)
  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$|\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (!part) return null;
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        return (
          <div key={index} className={styles.mathBlock}>
            {renderMathOrText(part.slice(2, -2).trim(), true)}
          </div>
        );
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        return <span key={index} className={styles.mathInline}>{renderMathOrText(part.slice(1, -1).trim(), false)}</span>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        if (/^(Bước\s+\d+|Đáp số|Kết luận|Lời giải|Chú ý)/i.test(innerText)) {
          return (
            <span key={index} className={styles.stepBadge}>
              {innerText}
            </span>
          );
        }
        return <strong key={index}>{innerText}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // Render Markdown-styled responses for AI
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className={styles.mdH3}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className={styles.mdH2}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className={styles.mdH1}>{line.replace('# ', '')}</h2>;
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanLine = line.trim().substring(2);
        return (
          <div key={idx} className={styles.mdBullet}>
            <span className={styles.bulletDot}>•</span>
            <span>{parseInlineFormatting(cleanLine)}</span>
          </div>
        );
      }

      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className={styles.mdNumItem}>
            <span className={styles.numBadge}>{numMatch[1]}</span>
            <span>{parseInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className={styles.mdSpacing} />;
      }

      return (
        <p key={idx} className={styles.mdPara}>
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  return (
    <div className={styles.container}>
      {/* SIDEBAR LỊCH SỬ HỌC TẬP GỌN GÀNG */}
      <div className={styles.sidebar}>
        <NewChatButton onClick={handleNewChat} />

        <div className={styles.sidebarHeader}>
          <Clock size={18} color="#f47c20" weight="duotone" />
          <span>Lịch sử trò chuyện</span>
        </div>

        <div className={styles.historyList}>
          {isLoadingSessions ? (
            <div className={styles.emptyHistory}>Đang tải lịch sử...</div>
          ) : sessions.length === 0 ? (
            <div className={styles.emptyHistory}>
              Chưa có cuộc trò chuyện nào. Bắt đầu hỏi để lưu lại!
            </div>
          ) : (
            sessions.map((item) => (
              <div
                key={item._id}
                className={`${styles.historyItem} ${activeSessionId === item._id ? styles.activeHistoryItem : ''}`}
                onClick={() => handleSelectSession(item._id)}
                title={item.title}
              >
                <div className={styles.historyIconBox}>
                  <ChatCircle size={16} color={activeSessionId === item._id ? "#2563eb" : "#2f8fa3"} weight="bold" />
                </div>
                <div className={styles.historyMeta}>
                  <span className={styles.historyTitle}>{item.title}</span>
                  <div className={styles.historySubLine}>
                    <span className={styles.subjectPill}>{item.subject || "Tổng hợp"}</span>
                    <span className={styles.dateText}>• {formatRelativeTime(item.updatedAt || item.createdAt)}</span>
                  </div>
                </div>
                <button
                  className={styles.deleteHistoryBtn}
                  onClick={(e) => handleDeleteSession(e, item._id)}
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className={styles.mainChat}>


        {/* TOP BAR: BỘ CHỌN LỚP HỌC VÀ NGỮ CẢNH */}
        <div className={styles.topContextBar}>
          <div className={styles.contextLeft}>
            <Chalkboard size={20} color="#f47c20" weight="duotone" />
            <span className={styles.contextLabel}>Ngữ cảnh học tập:</span>
            
            {/* DROPDOWN CHỌN LỚP */}
            <div className={styles.classDropdownContainer}>
              <button
                className={styles.classDropdownTrigger}
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              >
                <span className={styles.classNameText}>{selectedClassContext.className}</span>
                <span className={styles.classSubjectText}>· {selectedClassContext.subject}</span>
                <CaretDown size={14} weight="bold" />
              </button>

              {isClassDropdownOpen && (
                <div className={styles.classDropdownMenu}>
                  <div className={styles.dropdownMenuHeader}>Chọn lớp học để AI hiểu ngữ cảnh:</div>
                  {studentClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`${styles.classDropdownItem} ${selectedClassContext.id === cls.id ? styles.activeClassItem : ''}`}
                      onClick={() => {
                        setSelectedClassContext(cls);
                        setIsClassDropdownOpen(false);
                      }}
                    >
                      <span className={styles.itemName}>{cls.className}</span>
                      <span className={styles.itemSub}>{cls.subject}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.contextBadgeInfo}>
            <Sparkle size={14} color="#f47c20" weight="fill" />
            <span>AI tự động hiểu bài học hiện tại để giải đáp</span>
          </div>
        </div>

        <div className={styles.chatContent}>
          {messages.length === 0 && (
            <div className={styles.greetingContainer}>
              {/* GRID 6 GỢI Ý HỌC TẬP CHUYÊN SÂU */}
              <div className={styles.suggestionsGrid}>
                {SUGGESTIONS.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={styles.suggestionCard}
                      onClick={() => openSuggestionModal(item)}
                      style={{
                        '--accent-color': item.color,
                        '--bg-color': item.bgColor,
                        '--border-color': item.borderColor
                      } as React.CSSProperties}
                    >
                      <div className={styles.cardHeader}>
                        <div
                          className={styles.cardIconBox}
                          style={{ color: item.color, backgroundColor: item.bgColor }}
                        >
                          <IconComponent size={18} weight="duotone" />
                        </div>
                        <span className={styles.categoryTag} style={{ color: item.color, backgroundColor: item.bgColor }}>
                          {item.badge}
                        </span>
                      </div>

                      <div className={styles.cardContent}>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DANH SÁCH TIN NHẮN TRÒ CHUYỆN */}
          <div className={styles.messagesList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.aiRow}`}>
                <div className={styles.avatar}>
                  {msg.role === 'ai' ? (
                    <Sparkle size={24} weight="fill" color="#f47c20" />
                  ) : (
                    <User size={22} color="#475569" weight="bold" />
                  )}
                </div>
                <div className={styles.messageContent}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={styles.messageAttachmentsGrid}>
                      {msg.attachments.map((att, attIdx) => (
                        <div key={attIdx} className={styles.msgAttachmentCard}>
                          {att.previewUrl ? (
                            <img src={att.previewUrl} alt={att.name} className={styles.msgImgPreview} />
                          ) : (
                            <div className={styles.msgFileBadge}>
                              <FileText size={20} color="#2563eb" weight="duotone" />
                              <div className={styles.msgFileMeta}>
                                <span className={styles.msgFileName}>{att.name}</span>
                                <span className={styles.msgFileSize}>{att.size}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.role === 'ai' ? (
                    <div className={styles.formattedAiText}>
                      {renderFormattedMessage(msg.content)}
                    </div>
                  ) : (
                    msg.content && <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
                <div className={styles.avatar}>
                  <Sparkle size={24} weight="fill" color="#f47c20" />
                </div>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                  <span className={styles.typingText}>Trợ lý AI đang suy nghĩ bài làm...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT BAR */}
        <div className={styles.inputArea}>
          {/* ATTACHMENT PREVIEW STRIP ABOVE INPUT WRAPPER */}
          {attachedFiles.length > 0 && (
            <div className={styles.attachmentsPreviewStrip}>
              {attachedFiles.map((att) => (
                <div key={att.id} className={styles.attachmentChip}>
                  {att.previewUrl ? (
                    <img src={att.previewUrl} alt={att.name} className={styles.chipThumbnail} />
                  ) : (
                    <div className={styles.chipIconBox}>
                      {att.type.includes("pdf") ? (
                        <FilePdf size={18} color="#ef4444" weight="duotone" />
                      ) : (
                        <FileText size={18} color="#2563eb" weight="duotone" />
                      )}
                    </div>
                  )}
                  <div className={styles.chipMeta}>
                    <span className={styles.chipName}>{att.name}</span>
                    <span className={styles.chipSize}>{att.size}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeChipBtn}
                    onClick={() => setAttachedFiles((prev) => prev.filter((item) => item.id !== att.id))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.inputWrapper}>
            {/* HIDDEN FILE INPUT */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept={fileAcceptType}
              multiple
              onChange={handleFileSelect}
            />

            {/* PLUS BUTTON & POPUP MENU */}
            <div className={styles.attachContainer}>
              <button
                type="button"
                className={`${styles.plusBtn} ${isAttachMenuOpen ? styles.activePlus : ""}`}
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                title="Đính kèm bài tập hoặc hình ảnh"
              >
                <Plus size={20} weight="bold" />
              </button>

              {isAttachMenuOpen && (
                <div className={styles.attachMenuPopover}>
                  <button
                    type="button"
                    className={styles.attachMenuItem}
                    onClick={() => triggerFilePicker("image/*")}
                  >
                    <div className={`${styles.menuIconBox} ${styles.imageBg}`}>
                      <Image size={18} weight="duotone" />
                    </div>
                    <div className={styles.menuText}>
                      <span className={styles.menuTitle}>Hình ảnh</span>
                      <span className={styles.menuSub}>PNG, JPG, WebP</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={styles.attachMenuItem}
                    onClick={() => triggerFilePicker("application/pdf")}
                  >
                    <div className={`${styles.menuIconBox} ${styles.pdfBg}`}>
                      <FilePdf size={18} weight="duotone" />
                    </div>
                    <div className={styles.menuText}>
                      <span className={styles.menuTitle}>Tài liệu PDF</span>
                      <span className={styles.menuSub}>File sách/đề thi PDF</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={styles.attachMenuItem}
                    onClick={() => triggerFilePicker(".docx,.xlsx,.pptx,.txt,.csv")}
                  >
                    <div className={`${styles.menuIconBox} ${styles.docBg}`}>
                      <Paperclip size={18} weight="duotone" />
                    </div>
                    <div className={styles.menuText}>
                      <span className={styles.menuTitle}>File bài tập</span>
                      <span className={styles.menuSub}>Word, Excel, Text</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <textarea
              placeholder={
                attachedFiles.length > 0
                  ? "Nhập câu hỏi liên quan đến file đã đính kèm..."
                  : `Hỏi bài tập hoặc thắc mắc môn ${selectedClassContext.subject} (${selectedClassContext.className})...`
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <button
              className={`${styles.sendBtn} ${(input.trim() || attachedFiles.length > 0) ? styles.active : ''}`}
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
            >
              <PaperPlaneRight size={22} weight="fill" />
            </button>
          </div>
          <p className={styles.disclaimer}>
            Trợ lý AI Classroom hỗ trợ giải đáp kiến thức môn học. Hãy luôn kiểm tra lại tài liệu giáo khoa.
          </p>
        </div>
      </div>

      {/* MODAL PROMPT BUILDER TƯƠNG TÁC */}
      {activeModalSuggestion && (
        <div className={styles.modalOverlay} onClick={() => setActiveModalSuggestion(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBox}>
                <div
                  className={styles.modalIconBox}
                  style={{ backgroundColor: activeModalSuggestion.bgColor, color: activeModalSuggestion.color }}
                >
                  {React.createElement(activeModalSuggestion.icon, { size: 24, weight: "duotone" })}
                </div>
                <div>
                  <h3>{activeModalSuggestion.title}</h3>
                  <p>{activeModalSuggestion.description}</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setActiveModalSuggestion(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* CHI TIẾT CÂU HỎI HOẶC BÀI TẬP */}
              <div className={styles.formGroup}>
                <label>Nhập nội dung câu hỏi hoặc bài tập bạn cần hỗ trợ:</label>
                <textarea
                  className={styles.modalTextarea}
                  rows={3}
                  placeholder={activeModalSuggestion.placeholderText}
                  value={modalDetailInput}
                  onChange={(e) => setModalDetailInput(e.target.value)}
                />
              </div>

              {/* QUICK SUGGESTED TEMPLATES */}
              <div className={styles.formGroup}>
                <label className={styles.subLabel}>Mẫu câu hỏi hay dùng:</label>
                <div className={styles.quickOptionsWrap}>
                  {activeModalSuggestion.quickOptions.map((opt, i) => (
                    <button
                      key={i}
                      className={styles.quickOptionBtn}
                      onClick={() => setModalDetailInput(opt)}
                    >
                      + {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                onClick={() => handleModalSubmit(true)}
              >
                Dùng mẫu chuẩn
              </button>
              <SecondaryButton
                size="md"
                onClick={() => handleModalSubmit(false)}
              >
                Bắt đầu học tập ngay 🚀
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




