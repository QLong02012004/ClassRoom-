import React, { useState, useRef, useEffect } from "react";
import {
  PaperPlaneRight,
  Sparkle,
  Plus,
  ChatCircle,
  DotsThree,
  User
} from "phosphor-react";
import styles from "./StudentAssistant.module.scss";
import api from "../../../utils/AxiosCustomize";

// Mock Data cho lịch sử
const MOCK_HISTORY = [
  { id: "h1", title: "Giải phương trình bậc 2", date: "Hôm nay" },
  { id: "h2", title: "Tóm tắt bài Bình Ngô Đại Cáo", date: "Hôm qua" },
  { id: "h3", title: "Cách dùng cấu trúc Câu điều kiện", date: "7 ngày trước" },
];

export default function StudentAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    {
      role: "ai",
      content: "Xin chào! Tôi là Trợ lý học tập AI. Tôi có thể giúp bạn giải bài tập, tóm tắt kiến thức hoặc lên lộ trình học tập. Bạn cần giúp gì hôm nay?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      // Call Backend API
      const response: any = await api.post('/api/v1/chat/ask', { message: currentInput });
      if (response && response.data && response.data.reply) {
        setMessages([...newMessages, {
          role: "ai",
          content: response.data.reply
        }]);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      {/* SIDEBAR LỊCH SỬ (Giống Gemini) */}
      <div className={styles.sidebar}>
        <button className={styles.newChatBtn}>
          <Plus size={20} />
          <span>Đoạn chat mới</span>
        </button>

        <div className={styles.historyList}>
          <p className={styles.historyGroup}>Hôm nay</p>
          {MOCK_HISTORY.filter(h => h.date === "Hôm nay").map(item => (
            <div key={item.id} className={styles.historyItem}>
              <ChatCircle size={18} />
              <span className={styles.historyTitle}>{item.title}</span>
              <DotsThree size={18} className={styles.moreIcon} />
            </div>
          ))}

          <p className={styles.historyGroup}>Trước đó</p>
          {MOCK_HISTORY.filter(h => h.date !== "Hôm nay").map(item => (
            <div key={item.id} className={styles.historyItem}>
              <ChatCircle size={18} />
              <span className={styles.historyTitle}>{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className={styles.mainChat}>
        <div className={styles.chatContent}>
          {messages.length === 1 && (
            <div className={styles.greeting}>
              <Sparkle size={48} weight="fill" color="#f47c20" />
              <h2>Tôi có thể giúp gì cho bạn?</h2>
            </div>
          )}

          <div className={styles.messagesList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.aiRow}`}>
                <div className={styles.avatar}>
                  {msg.role === 'ai' ? (
                    <Sparkle size={24} weight="fill" color="#f47c20" />
                  ) : (
                    <User size={24} color="#64748B" />
                  )}
                </div>
                <div className={styles.messageContent}>
                  <p>{msg.content}</p>
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
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT BAR */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <textarea
              placeholder="Nhập câu hỏi của bạn ở đây..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={`${styles.sendBtn} ${input.trim() ? styles.active : ''}`}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <PaperPlaneRight size={24} weight="fill" />
            </button>
          </div>
          <p className={styles.disclaimer}>AI có thể đưa ra thông tin không chính xác. Hãy luôn kiểm tra lại các thông tin quan trọng.</p>
        </div>
      </div>
    </div>
  );
}
