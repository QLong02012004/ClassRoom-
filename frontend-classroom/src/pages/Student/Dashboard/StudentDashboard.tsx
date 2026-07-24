import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Fire,
  StarFour,
  CheckCircle,
  GraduationCap,
  Star,
  Target,
  Lightning,
  Trophy,
  Notebook,
  ChartBar,
  Books,
  ChatTeardropText,
  Crown,
  ChatCircleDots,
  PaperPlaneRight,
  Warning
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { SecondaryButton } from "../../../components/ui/Buttons/SecondaryButton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { WeaknessRadar } from "./components/WeaknessRadar";
import { dashboardService } from "../../../service/dashboard.service.ts";
import { analyticsService } from "../../../service/analytics.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import type { IComment } from "../../../service/announcement.service.ts";
import styles from "./StudentDashboard.module.scss";

import { ChartBarStacked } from "./components/ChartBarStacked";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import AnimatedProgressBar from "../../../components/ui/AnimatedProgressBar";

export default function StudentDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [username, setUsername] = useState<string>("Học sinh A");

  // Dashboard State
  const [stats, setStats] = useState<any>({
    totalClasses: 0,
    attendanceRate: 0,
    pendingAssignmentsCount: 0,
    totalXP: 0
  });
  const [gamification, setGamification] = useState<any>({
    xp: 0,
    level: 1,
    streak: 0
  });
  const [todoList, setTodoList] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [learningProgress, setLearningProgress] = useState<any[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [studentAnnouncements, setStudentAnnouncements] = useState<any[]>([]);
  const [weaknessData, setWeaknessData] = useState<any[]>([]);

  // Leaderboard State
  const [classes, setClasses] = useState<{_id: string, name: string}[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Practice Modal
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false);
  const [selectedPracticeTag, setSelectedPracticeTag] = useState("");
  const [practiceLimit, setPracticeLimit] = useState(10);

  // Trạng thái bình luận
  const [expandedAnn, setExpandedAnn] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Chat Widget State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "GV", text: "Các em nhớ nộp bài tập về nhà trước 12h đêm nay nhé!", time: "10:05 AM", isMe: false },
    { id: 2, sender: "Me", text: "Dạ vâng ạ.", time: "10:07 AM", isMe: true }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: username,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");

    // Simulate auto reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "GV",
        text: "Cảm ơn em đã phản hồi! Thầy đã ghi nhận.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      }]);
    }, 1500);
  };

  const loadData = async () => {
    const currentUsername = user?.name || localStorage.getItem("username") || "Học sinh A";
    setUsername(currentUsername);

    try {
      const res = await dashboardService.getStudentDashboardStats();
      if (res && res.data) {
        setStats(res.data.stats || {});
        setGamification(res.data.gamification || {});
        setTodoList(res.data.todoList || []);
        setTodaySchedule(res.data.todaySchedule || []);
        setLearningProgress(res.data.learningProgress || []);
        setStudentAnnouncements(res.data.announcements || []);
        setWeeklyGoals(res.data.weeklyGoals || []);
        const cls = res.data.classes || [];
        setClasses(cls);
        if (cls.length > 0 && !selectedClassId) {
          setSelectedClassId(cls[0]._id);
        }
      }

      const weaknessRes = await analyticsService.getStudentWeaknessRadar();
      if (weaknessRes && weaknessRes.data && weaknessRes.data.length > 0) {
        setWeaknessData(weaknessRes.data);
      } else {
        // Mock data để demo UI
        setWeaknessData([
          { tag: 'Hàm số mũ và logarit', total: 10, wrong: 8, errorRate: 80 },
          { tag: 'Hình học không gian', total: 12, wrong: 7, errorRate: 58 }
        ]);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải thông tin dashboard từ server!");
    }

    // Mock load announcements from old logic or API.
    // Assuming backend returns it or we just use empty array for now since we focused on Gamification.
    // For now we'll fetch announcements from timeline API if we had one.
  };

  useEffect(() => {
    loadData();
  }, [username, user]);

  useEffect(() => {
    if (selectedClassId) {
      dashboardService.getLeaderboard(selectedClassId).then(res => {
        if (res && res.data) {
          // Trả về tối đa top 10
          setLeaderboard(res.data.slice(0, 10));
        }
      }).catch(err => {
        console.error("Lỗi tải leaderboard:", err);
      });
    }
  }, [selectedClassId]);

  const handleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
        toast.success("Tuyệt vời! Bạn đã hoàn thành một công việc.");
      }
      return newSet;
    });
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };

  const handlePracticeClick = (tag: string) => {
    setSelectedPracticeTag(tag);
    setPracticeLimit(10);
    setPracticeDialogOpen(true);
  };

  const handleStartPractice = () => {
    setPracticeDialogOpen(false);
    navigate(`/practice?tag=${encodeURIComponent(selectedPracticeTag)}&limit=${practiceLimit}`);
  };

  return (
    <div className={styles.dashboard}>
      {/* 1. WELCOME BANNER (INTERACTIVE HERO CARD) */}
      <div className={styles.welcomeBanner}>
        <div className={styles.bannerLeft}>
          <div className={styles.greetingTop}>
            <StarFour size={16} weight="fill" className={styles.sparkleIcon} />
            <span>CHÀO MỪNG TRỞ LẠI</span>
            <div className={styles.streakBadgeBanner}>
              <Fire size={16} weight="fill" className={styles.streakIcon} />
              <span>{gamification.streak || 1}</span>
            </div>
          </div>
          <h1>Chào {username} 👋</h1>
          <p>Tiếp tục lộ trình và giữ vững chuỗi ngày học của bạn.</p>
        </div>

        <div className={styles.bannerCenter}>
          <img src="/owl_mascot.png" alt="Cú Thông Thái" className={styles.mascotImage} />
          <div className={styles.mascotPlatform}></div>
          <span className={styles.mascotName}>Cú Thông Thái</span>
        </div>

        <div className={styles.bannerRight}>
          <div className={styles.speechBubble}>
            <p>
              Cú cú! Mình là Cú Thông Thái 🦉 Hôm nay cậu có <strong>{stats.pendingAssignmentsCount || 3}</strong> bài tập cần hoàn thành đấy!
            </p>
            <PrimaryButton variant="muted" className="w-fit" onClick={() => navigate("/assignments")}>
              Làm bài ngay <ArrowRight size={16} weight="bold" />
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* 1.5 QUICK ACTIONS */}
      <section className={`${styles.quickActions} tour-step-quick-actions`}>
        <button className={styles.actionCard} onClick={() => navigate('/assignments')}>
          <div className={`${styles.actionIcon} ${styles.bgBlue}`}>
            <Notebook size={24} weight="duotone" />
          </div>
          <span>Làm bài tập đến hạn</span>
        </button>
        <button className={styles.actionCard} onClick={() => navigate('/grades')}>
          <div className={`${styles.actionIcon} ${styles.bgGreen}`}>
            <ChartBar size={24} weight="duotone" />
          </div>
          <span>Xem bảng điểm chi tiết</span>
        </button>
        <button className={styles.actionCard} onClick={() => navigate('/materials')}>
          <div className={`${styles.actionIcon} ${styles.bgOrange}`}>
            <Books size={24} weight="duotone" />
          </div>
          <span>Kho tài liệu bài giảng</span>
        </button>
        <button className={styles.actionCard} onClick={() => navigate('/chat')}>
          <div className={`${styles.actionIcon} ${styles.bgPurple}`}>
            <ChatTeardropText size={24} weight="duotone" />
          </div>
          <span>Hỏi bài giáo viên</span>
        </button>
      </section>

      {/* 2. STAT CARDS WITH PROGRESS */}
      <section className={`${styles.statsGrid} tour-step-stats`}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.yellowBg}`}>
            <Star size={28} weight="fill" />
          </div>
          <span className={styles.statLabel}>Điểm kinh nghiệm (XP)</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {gamification.xp || stats.totalXP || 0}
            </span>
            <span className={styles.statSubtext} style={{ color: '#eab308' }}>
              Level {gamification.level || Math.floor((stats.totalXP || 0) / 100) + 1}
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
            <AnimatedProgressBar progress={Math.min(100, (gamification.xp || stats.totalXP || 0) % 100)} width="100%" barColor="linear-gradient(90deg, #fde047, #eab308)" />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orangeBg}`}>
            <Fire size={28} weight="fill" />
          </div>
          <span className={styles.statLabel}>Chuỗi học tập (Streak)</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {gamification.streak || 0} <span style={{fontSize: '1.2rem', color: '#f97316'}}>Ngày</span>
            </span>
            <span className={`${styles.statSubtext} ${styles.danger}`}>
              Đang cháy! 🔥
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
            <AnimatedProgressBar progress={100} width="100%" barColor="linear-gradient(90deg, #fdba74, #f97316)" />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.greenBg}`}>
            <Target size={28} weight="fill" />
          </div>
          <span className={styles.statLabel}>Nộp bài đúng hạn</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {stats.onTimeSubmissionRate !== undefined ? stats.onTimeSubmissionRate : 95}%
            </span>
            <span className={`${styles.statSubtext} ${
              (stats.onTimeSubmissionRate || 95) >= 90 ? styles.success :
              (stats.onTimeSubmissionRate || 95) >= 70 ? styles.warning : styles.danger
            }`}>
              {(stats.onTimeSubmissionRate || 95) >= 90 ? 'Xuất sắc 🎯' :
               (stats.onTimeSubmissionRate || 95) >= 70 ? 'Khá 👍' : 'Cần cố gắng ⚠️'}
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
            <AnimatedProgressBar progress={stats.onTimeSubmissionRate !== undefined ? stats.onTimeSubmissionRate : 95} width="100%" barColor="linear-gradient(90deg, #86efac, #22c55e)" />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blueBg}`}>
            <Lightning size={28} weight="fill" />
          </div>
          <span className={styles.statLabel}>Tỉ lệ chuyên cần</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {stats.attendanceRate || 0}%
            </span>
            <span className={`${styles.statSubtext} ${styles.success}`}>
              Tốt ⚡
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
            <AnimatedProgressBar progress={stats.attendanceRate || 0} width="100%" barColor="linear-gradient(90deg, #93c5fd, #3b82f6)" />
          </div>
        </div>
      </section>

      <div className={styles.mainLayout}>
        {/* CỘT TRÁI - 70% */}
        <div className={styles.leftColumn}>

      {/* 3. ROW 2: TODO LIST & TODAY SCHEDULE */}
      <section className={styles.middleGrid}>

        {/* Left Column: Todo List */}
        <div className={`${styles.todoSection} tour-step-todo`}>
          <div className={styles.sectionHeader}>
            <h3>Việc cần làm hôm nay</h3>
            <button className={styles.btnViewAll} onClick={() => navigate("/assignments")}>
              Xem tất cả
            </button>
          </div>
          <div className={styles.todoList}>
            {todoList.length > 0 ? (
              todoList.map((task, idx) => {
                const isCompleted = completedTasks.has(task._id);
                return (
                  <div key={task._id} className={`${styles.todoItem} ${isCompleted ? styles.completed : ''}`}>
                    <div
                      className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
                      onClick={() => handleTaskComplete(task._id)}
                    >
                      {isCompleted && <CheckCircle size={20} weight="fill" color="#10b981" />}
                      {!isCompleted && <div className={styles.circle}></div>}
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{task.title}</h4>
                      <span className={styles.itemMeta}>
                        {task.className} • Hạn: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    <div className={styles.itemRight}>
                      {idx === 0 && !isCompleted ? (
                        <span className={`${styles.urgencyBadge} ${styles.high}`}>Gấp</span>
                      ) : (
                        <span className={`${styles.urgencyBadge} ${styles.medium}`}>Bình thường</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <img src="/empty_tasks_illustration_1784358523914.png" alt="All done" className={styles.emptyImg} />
                <p className={styles.emptyTitle}>Tuyệt vời!</p>
                <p className={styles.emptySub}>Bạn đã hoàn thành tất cả nhiệm vụ hôm nay. Hãy nghỉ ngơi hoặc ôn lại bài cũ nhé!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schedule */}
        <div className={`${styles.scheduleSection} tour-step-schedule`}>
          <div className={styles.sectionHeader}>
            <h3>Lịch học hôm nay</h3>
          </div>
          <div className={styles.scheduleList}>
            {todaySchedule.length > 0 ? (
              todaySchedule.map((cls, idx) => (
                <div key={cls._id} className={styles.scheduleItem}>
                  <div className={styles.timeCol}>
                    <span className={styles.time}>{cls.startTime}</span>
                    <span className={styles.timeEnd}>{cls.endTime}</span>
                  </div>
                  <div className={styles.divider}></div>
                  <div className={styles.infoCol}>
                    <h4>{cls.className}</h4>
                    <p>{cls.teacherName}</p>
                  </div>
                  <div className={styles.actionCol}>
                    <SecondaryButton style={{ fontSize: '0.8rem', padding: '0.6em 1.2em' }}>Vào lớp</SecondaryButton>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <GraduationCap size={48} weight="duotone" color="#94a3b8" />
                <p className={styles.emptyTitle}>Hôm nay bạn được nghỉ!</p>
                <p className={styles.emptySub}>Không có lịch học nào được xếp trong ngày hôm nay.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ADAPTIVE LEARNING CENTER */}
      <section className={`${styles.adaptiveLearningSection} tour-step-adaptive`}>
        <div className={styles.sectionHeader}>
          <h3>Tiến độ & Phân tích Học tập</h3>
        </div>
        
        <div className={styles.adaptiveLearningGrid}>
          {/* Progress Card */}
          <div className={styles.adaptiveCard}>
            <div className={styles.adaptiveCardInfo}>
              <h4>Tiến độ môn Toán</h4>
              <p>Chương 1: Khảo sát Hàm số</p>
              <button className={styles.btnStart} onClick={() => navigate('/materials')}>
                Bắt đầu học <ArrowRight size={16} weight="bold" />
              </button>
            </div>
            
            <div className={styles.radialProgress}>
              <svg viewBox="0 0 100 100" className={styles.svgCircle}>
                <circle cx="50" cy="50" r="42" className={styles.circleBg} />
                <circle cx="50" cy="50" r="42" className={styles.circleProgress} style={{ strokeDashoffset: `calc(264 - (264 * 42) / 100)` }} />
              </svg>
              <div className={styles.radialText}>
                <span className={styles.percentage}>42%</span>
                <span className={styles.fraction}>25/59 Bài</span>
              </div>
            </div>
          </div>

          {/* Weakness Warning Card */}
          <div className={`${styles.adaptiveCard} ${styles.warningCard}`}>
            <div className={styles.warningIconWrapper}>
              <Warning size={40} weight="duotone" />
            </div>
            <div className={styles.adaptiveCardInfo}>
              <h4 className={styles.warningTitle}>Cảnh báo Lỗ hổng!</h4>
              <p>Bạn đang sai nhiều ở dạng bài: <strong style={{color: '#b91c1c'}}>{weaknessData[0]?.tag || 'Hàm số Mũ'}</strong></p>
              <div className={styles.errorRateBadge}>Tỷ lệ sai: {weaknessData[0]?.errorRate || 80}%</div>
              <button 
                className={styles.btnWarning} 
                onClick={() => handlePracticeClick(weaknessData[0]?.tag || 'Hàm số Mũ')}
              >
                Luyện tập ngay <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROW 3: LEARNING PROGRESS & WEEKLY GOALS */}
      <section className={styles.bottomGrid}>
        <ChartBarStacked data={learningProgress} />

        <div className={styles.bottomRightGrid}>
          <div className={`${styles.goalsSection} tour-step-weekly-goals`}>
          <h3>Mục tiêu tuần này</h3>
          <div className={styles.goalsList}>
            {weeklyGoals.map(goal => {
              const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div key={goal.id} className={styles.goalItem}>
                  <div className={styles.goalInfo}>
                    <h4>{goal.title}</h4>
                    <span>{goal.current}/{goal.target} {goal.unit}</span>
                  </div>
                  <div className={styles.goalProgress}>
                    <AnimatedProgressBar progress={percentage} width="100%" barColor="linear-gradient(90deg, #f47c20 0%, #faa266 100%)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      {/* 5. ROW 4: ANNOUNCEMENTS */}
      <section className={`${styles.timelineSection} tour-step-timeline`}>
        <h3>Thông báo từ giáo viên</h3>
        <div className={styles.timelineList}>
          {studentAnnouncements.length > 0 ? (
            studentAnnouncements.map((ann) => (
              <div key={ann.id} className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${styles.blue}`}></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTime}>{ann.time} - {ann.authorName} ({ann.className})</span>
                  <p className={styles.timelineAction}>{ann.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <img src="/empty_activities_illustration_1784358537578.png" alt="No announcements" className={styles.emptyImgSmall} />
              <p className={styles.emptySub}>Chưa có thông báo nào từ giáo viên.</p>
            </div>
          )}
        </div>
      </section>

        </div> {/* Hết bottomRightGrid */}
      </section>

        </div> {/* Hết Cột Trái */}

        {/* CỘT PHẢI - 30% */}
        <div className={styles.rightColumn}>
          {/* LEADERBOARD WIDGET */}
          <div className={`${styles.widgetCard} tour-step-leaderboard`}>
            <div className={styles.widgetHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={24} weight="duotone" color="#eab308" />
                <h3>Bảng xếp hạng XP</h3>
              </div>
              {classes.length > 0 && (
                <select 
                  className="text-xs p-1 rounded border border-slate-200 max-w-[120px] truncate bg-transparent focus:outline-none" 
                  value={selectedClassId} 
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className={styles.leaderboardList}>
              {leaderboard.length > 0 ? leaderboard.map((student, idx) => (
                <div key={student.id} className={`${styles.leaderboardItem} ${student.name === username ? styles.currentUser : ''}`}>
                  <div className={styles.rankBadge}>{idx + 1}</div>
                  <div className={styles.avatarPlaceholder} style={{ overflow: 'hidden' }}>
                     {student.avatar && student.avatar.length > 2 ? <img src={student.avatar} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : student.name.charAt(0)}
                  </div>
                  <div className={styles.studentInfo}>
                    <span className={styles.name}>{student.name}</span>
                    <span className={styles.xp}>{student.xp} XP</span>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.875rem', color: '#64748b' }}>Chưa có dữ liệu.</div>
              )}
            </div>
          </div>

          {/* CHAT WIDGET */}
          <div className={`${styles.widgetCard} ${styles.chatWidget}`}>
            <div className={styles.widgetHeader}>
              <ChatCircleDots size={24} weight="duotone" color="#3b82f6" />
              <h3>Trao đổi lớp học</h3>
            </div>
            <div className={styles.chatContainer} ref={chatContainerRef}>
              {chatMessages.map(msg => (
                <div key={msg.id} className={`${styles.chatMessage} ${msg.isMe ? styles.myMessage : ''}`}>
                  {!msg.isMe && <div className={styles.chatAvatar}>{msg.sender}</div>}
                  <div className={styles.chatBubble}>
                    <p>{msg.text}</p>
                    <span className={styles.chatTime}>{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <form className={styles.chatInputContainer} onSubmit={handleSendChat}>
              <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={styles.chatInput}
              />
              <button type="submit" className={styles.btnSendChat} disabled={!chatInput.trim()}>
                <PaperPlaneRight size={20} weight="fill" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PRACTICE DIALOG */}
      <Dialog open={practiceDialogOpen} onOpenChange={setPracticeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#FE6747] text-xl">Luyện tập ngay!</DialogTitle>
            <DialogDescription>
              Bạn đang chọn luyện tập chuyên đề <b>{selectedPracticeTag}</b>. Hãy chọn số lượng câu hỏi bạn muốn làm nhé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center gap-4">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setPracticeLimit(num)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${practiceLimit === num
                    ? 'bg-[#FE6747] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPracticeDialogOpen(false)}
              className="px-4 py-2 rounded-lg font-medium text-slate-500 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              onClick={handleStartPractice}
              className="px-6 py-2 rounded-lg font-bold text-white bg-[#FE6747] hover:bg-[#e5593c] transition-colors"
            >
              Bắt đầu làm bài
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
