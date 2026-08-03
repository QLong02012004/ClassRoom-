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
  Warning,
  CaretDown
} from "phosphor-react";
import { CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
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

import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { ComicButton } from "../../../components/ui/Buttons/ComicButton";
import AnimatedProgressBar from "../../../components/ui/AnimatedProgressBar";

const calculateLevelAndProgress = (totalXP: number) => {
  let level = 1;
  let currentLevelXP = Math.max(0, Math.round(totalXP));
  let requiredForCurrentLevel = 100 + (level - 1) * 50;

  while (currentLevelXP >= requiredForCurrentLevel) {
    currentLevelXP -= requiredForCurrentLevel;
    level++;
    requiredForCurrentLevel = 100 + (level - 1) * 50;
  }

  const xpInLevel = currentLevelXP;
  const xpRequiredForNext = requiredForCurrentLevel;
  const progressPercent = Math.min(100, Math.round((xpInLevel / xpRequiredForNext) * 100));

  return {
    level,
    xpInLevel,
    xpRequiredForNext,
    progressPercent
  };
};

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
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [studentAnnouncements, setStudentAnnouncements] = useState<any[]>([]);
  const [weaknessData, setWeaknessData] = useState<any[]>([]);
  const [learningStats, setLearningStats] = useState<any[]>([]);

  // Leaderboard State
  const [classes, setClasses] = useState<{ _id: string, name: string }[]>([]);
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
        setLearningStats(res.data.learningStats || []);
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

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };

  const getUrgency = (dueDate: string): { label: string; styleClass: string } => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 0) return { label: 'Quá hạn', styleClass: styles.high };
    if (diffHours <= 24) return { label: 'Gấp', styleClass: styles.high };
    if (diffHours <= 72) return { label: 'Sắp đến', styleClass: styles.medium };
    return { label: 'Bình thường', styleClass: styles.medium };
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
              <span>{gamification.streak ?? 0}</span>
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
        {/* XP Card */}
        {(() => {
          const xp = gamification.xp || stats.totalXP || 0;
          const levelInfo = calculateLevelAndProgress(xp);
          const level = gamification.level || levelInfo.level;
          const progressPercent = gamification.progressPercent !== undefined ? gamification.progressPercent : levelInfo.progressPercent;
          return (
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.yellowBg}`}>
                <Star size={28} weight="fill" />
              </div>
              <span className={styles.statLabel}>Điểm kinh nghiệm (XP)</span>
              <div className={styles.statBottomRow}>
                <span className={styles.statValue}>{xp}</span>
                <span className={styles.statSubtext} style={{ color: '#eab308' }}>
                  Level {level}
                </span>
              </div>
              <div className={styles.progressBarWrapper}>
                <AnimatedProgressBar progress={progressPercent} width="100%" barColor="linear-gradient(90deg, #fde047, #eab308)" />
              </div>
            </div>
          );
        })()}

        {/* Streak Card */}
        {(() => {
          const streak = gamification.streak ?? 0;
          const streakMax = 30; // Mốc tối đa 30 ngày
          const streakPercent = Math.min(100, Math.round((streak / streakMax) * 100));
          const streakLabel = streak >= 7 ? 'Đang cháy! 🔥' :
            streak >= 3 ? 'Tốt lắm! 👍' :
              streak > 0 ? 'Tiếp tục nhé! 💪' : 'Hãy bắt đầu! 🚀';
          return (
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.orangeBg}`}>
                <Fire size={28} weight="fill" />
              </div>
              <span className={styles.statLabel}>Chuỗi học tập (Streak)</span>
              <div className={styles.statBottomRow}>
                <span className={styles.statValue}>
                  {streak} <span style={{ fontSize: '1.2rem', color: '#f97316' }}>Ngày</span>
                </span>
                <span className={`${styles.statSubtext} ${streak >= 3 ? styles.danger : styles.warning}`}>
                  {streakLabel}
                </span>
              </div>
              <div className={styles.progressBarWrapper}>
                <AnimatedProgressBar progress={streakPercent} width="100%" barColor="linear-gradient(90deg, #fdba74, #f97316)" />
              </div>
            </div>
          );
        })()}

        {/* Nộp bài đúng hạn Card */}
        {(() => {
          const rate = stats.onTimeSubmissionRate !== undefined ? stats.onTimeSubmissionRate : 0;
          const rateLabel = rate >= 90 ? 'Xuất sắc 🎯' :
            rate >= 70 ? 'Khá 👍' : 'Cần cố gắng ⚠️';
          const rateClass = rate >= 90 ? styles.success :
            rate >= 70 ? styles.warning : styles.danger;
          return (
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.greenBg}`}>
                <Target size={28} weight="fill" />
              </div>
              <span className={styles.statLabel}>Nộp bài đúng hạn</span>
              <div className={styles.statBottomRow}>
                <span className={styles.statValue}>{rate}%</span>
                <span className={`${styles.statSubtext} ${rateClass}`}>
                  {rateLabel}
                </span>
              </div>
              <div className={styles.progressBarWrapper}>
                <AnimatedProgressBar progress={rate} width="100%" barColor="linear-gradient(90deg, #86efac, #22c55e)" />
              </div>
            </div>
          );
        })()}

        {/* Chuyên cần Card */}
        {(() => {
          const attendance = stats.attendanceRate !== undefined ? stats.attendanceRate : 0;
          const attLabel = attendance >= 90 ? 'Tốt ⚡' :
            attendance >= 70 ? 'Khá 👍' : 'Cần cải thiện ⚠️';
          const attClass = attendance >= 90 ? styles.success :
            attendance >= 70 ? styles.warning : styles.danger;
          return (
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.blueBg}`}>
                <Lightning size={28} weight="fill" />
              </div>
              <span className={styles.statLabel}>Tỉ lệ chuyên cần</span>
              <div className={styles.statBottomRow}>
                <span className={styles.statValue}>{attendance}%</span>
                <span className={`${styles.statSubtext} ${attClass}`}>
                  {attLabel}
                </span>
              </div>
              <div className={styles.progressBarWrapper}>
                <AnimatedProgressBar progress={attendance} width="100%" barColor="linear-gradient(90deg, #93c5fd, #3b82f6)" />
              </div>
            </div>
          );
        })()}
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
                  todoList.map((task) => {
                    const urgency = getUrgency(task.dueDate);
                    return (
                      <div
                        key={task._id}
                        className={styles.todoItem}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/assignments/${task._id}`)}
                        title="Nhấn để xem và làm bài tập"
                      >
                        <div className={styles.checkbox}>
                          <div className={styles.circle}></div>
                        </div>
                        <div className={styles.itemInfo}>
                          <h4 className={styles.itemTitle}>{task.title}</h4>
                          <span className={styles.itemMeta}>
                            {task.className} • Hạn: {formatDate(task.dueDate)}
                          </span>
                        </div>
                        <div className={styles.itemRight}>
                          <span className={`${styles.urgencyBadge} ${urgency.styleClass}`}>
                            {urgency.label}
                          </span>
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
              {/* Progress Card - Tổng hợp tiến độ nộp bài của lớp có nhiều bài nhất */}
              <div className={styles.adaptiveCard}>
                {(() => {
                  const topClass = learningStats[0];
                  const progressPercent = topClass?.progressPercent ?? 0;
                  const submittedCount = topClass?.submittedCount ?? 0;
                  const totalAssignments = topClass?.totalAssignments ?? 0;
                  const className = topClass?.className ?? 'Chưa có dữ liệu';
                  const subject = topClass?.subject ?? '';
                  const dashOffset = 264 - (264 * progressPercent) / 100;
                  return (
                    <>
                      <div className={styles.adaptiveCardInfo}>
                        <h4>Tiến độ: {className}</h4>
                        <p>{subject ? subject : 'Hoàn thành bài tập'}</p>

                        {/* Mini stats row */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <span className={styles.submittedBadge}>
                            ✓ {submittedCount} đã nộp
                          </span>
                          {(totalAssignments - submittedCount) > 0 && (
                            <span className={styles.remainingBadge}>
                              ⏳ {totalAssignments - submittedCount} còn lại
                            </span>
                          )}
                        </div>

                        {/* Encouragement message */}
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                          {progressPercent === 100
                            ? '🎉 Xuất sắc! Bạn đã hoàn thành tất cả bài tập!'
                            : progressPercent >= 50
                            ? '💪 Tiếp tục cố gắng, bạn đang tiến bộ!'
                            : totalAssignments === 0
                            ? '📚 Chưa có bài tập nào được giao.'
                            : '🚀 Hãy bắt đầu làm bài để tăng tiến độ!'}
                        </p>

                        <ComicButton size="sm" onClick={() => navigate('/assignments')}>
                          Xem bài tập <ArrowRight size={14} weight="bold" />
                        </ComicButton>
                      </div>
                      <div className={styles.radialProgress}>
                        <svg viewBox="0 0 100 100" className={styles.svgCircle}>
                          <circle cx="50" cy="50" r="42" className={styles.circleBg} />
                          <circle cx="50" cy="50" r="42" className={styles.circleProgress} style={{ strokeDashoffset: dashOffset }} />
                        </svg>
                        <div className={styles.radialText}>
                          <span className={styles.percentage}>{progressPercent}%</span>
                          <span className={styles.fraction}>{submittedCount}/{totalAssignments} Bài</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Weakness Warning Card */}
              <div className={`${styles.adaptiveCard} ${styles.warningCard}`}>
                <div className={styles.warningIconWrapper}>
                  <Warning size={40} weight="duotone" />
                </div>
                <div className={styles.adaptiveCardInfo}>
                  <h4 className={styles.warningTitle}>Cảnh báo Lỗ hổng!</h4>
                  <p>Bạn đang sai nhiều ở dạng bài: <strong style={{ color: '#b91c1c' }}>{weaknessData[0]?.tag || 'Hàm số Mũ'}</strong></p>
                  <div className={styles.errorRateBadge}>Tỷ lệ sai: {weaknessData[0]?.errorRate || 80}%</div>
                  <ComicButton
                    variant="warning"
                    size="sm"
                    onClick={() => handlePracticeClick(weaknessData[0]?.tag || 'Hàm số Mũ')}
                  >
                    Luyện tập ngay <ArrowRight size={14} weight="bold" />
                  </ComicButton>
                </div>
              </div>
            </div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1.5 focus:outline-none transition-colors cursor-pointer"
                    >
                      <span className="max-w-[90px] truncate">
                        {classes.find(c => c._id === selectedClassId)?.name || "Chọn lớp"}
                      </span>
                      <CaretDown size={12} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuLabel className="text-[11px] text-slate-400 font-bold px-2 py-1 uppercase">Chọn lớp học</DropdownMenuLabel>
                    {classes.map(c => (
                      <DropdownMenuItem
                        key={c._id}
                        onClick={() => setSelectedClassId(c._id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-between ${selectedClassId === c._id ? "bg-orange-50 text-orange-600 font-bold" : "text-slate-700 hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600"}`}
                      >
                        <span className="truncate">{c.name}</span>
                        {selectedClassId === c._id && <CheckIcon className="w-3.5 h-3.5 text-orange-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
