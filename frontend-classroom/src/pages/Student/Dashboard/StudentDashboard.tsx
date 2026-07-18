import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  CheckSquare, 
  Clipboard,
  Compass,
  Flask,
  Book,
  ArrowRight,
  Star,
  Bell,
  ChatCircle,
  PaperPlaneTilt,
  CaretDown,
  CaretUp,
  Fire,
  StarFour,
  Medal,
  PlayCircle,
  Clock,
  CalendarCheck,
  CheckCircle,
  GraduationCap
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { WeaknessRadar } from "./components/WeaknessRadar";
import { dashboardService } from "../../../service/dashboard.service.ts";
import { analyticsService } from "../../../service/analytics.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import type { IComment } from "../../../service/announcement.service.ts";
import styles from "./StudentDashboard.module.scss";

import { ChartBarStacked } from "./components/ChartBarStacked";

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
      {/* 1. WELCOME BANNER (SEO EDUCATION STYLE) */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeText}>
            <h1>Khám phá tri thức, {username}! 🚀</h1>
            <p>
              Hành trình học tập của bạn đang diễn ra rất tốt. Hôm nay bạn có <strong>{todoList.length}</strong> nhiệm vụ và <strong>{todaySchedule.length}</strong> lớp học chờ đón. Hãy chinh phục những cột mốc mới nhé!
            </p>
            
            {/* QUICK ACTIONS */}
            <div className={styles.quickActions}>
              <button className={styles.btnQuick} onClick={() => navigate("/classrooms")}>
                <PlayCircle size={20} weight="duotone" />
                Vào lớp học
              </button>
              <button className={styles.btnQuick} onClick={() => navigate("/assignments")}>
                <CheckSquare size={20} weight="duotone" />
                Làm bài tập
              </button>
              <button className={styles.btnQuick} onClick={() => navigate("/schedule")}>
                <CalendarCheck size={20} weight="duotone" />
                Xem lịch học
              </button>
              <button className={styles.btnQuick}>
                <Book size={20} weight="duotone" />
                Kho tài liệu
              </button>
            </div>
          </div>
          
          <div className={styles.heroImageWrapper}>
            <img src="/education_hero_illustration_1784359209588.png" alt="Education Hero" className={styles.heroImage} />
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS WITH PROGRESS */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orangeBg}`}>
            <BookOpen size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Tổng số lớp học</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {stats.totalClasses.toString().padStart(2, '0')}
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
             <div className={styles.progressBar} style={{ width: '100%', background: '#f97316' }}></div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.greenBg}`}>
            <CheckSquare size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Tỉ lệ chuyên cần</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {stats.attendanceRate}%
            </span>
            <span className={`${styles.statSubtext} ${styles.success}`}>
              Tốt
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
             <div className={styles.progressBar} style={{ width: `${stats.attendanceRate}%`, background: '#10b981' }}></div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.redBg}`}>
            <Clipboard size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Bài tập cần nộp</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {stats.pendingAssignmentsCount.toString().padStart(2, '0')}
            </span>
          </div>
          <div className={styles.progressBarWrapper}>
             <div className={styles.progressBar} style={{ width: '60%', background: '#ef4444' }}></div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blueBg}`}>
            <Star size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Kinh nghiệm (XP)</span>
          <div className={styles.statBottomRow}>
            {stats.totalXP === 0 ? (
              <>
                <span className={styles.statValue} style={{ color: '#cbd5e1' }}>0</span>
                <span className={styles.statSubtext} style={{ color: '#94a3b8', fontWeight: 600 }}>Tân binh</span>
              </>
            ) : (
              <>
                <span className={styles.statValue}>{stats.totalXP}</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-700 uppercase tracking-wide">
                  Level {Math.floor(stats.totalXP / 100) + 1}
                </span>
              </>
            )}
          </div>
          <div className={styles.progressBarWrapper}>
             <div className={styles.progressBar} style={{ width: stats.totalXP ? `${Math.min(100, (stats.totalXP % 100))}%` : '0%', background: '#eab308' }}></div>
          </div>
        </div>
      </section>

      {/* 3. ROW 2: TODO LIST & TODAY SCHEDULE */}
      <section className={styles.middleGrid}>
        
        {/* Left Column: Todo List */}
        <div className={styles.todoSection}>
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
        <div className={styles.scheduleSection}>
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
                    <button className={styles.btnJoin}>Vào lớp</button>
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

      {/* WEAKNESS RADAR SECTION */}
      <section className="mb-6">
        <WeaknessRadar data={weaknessData} onPracticeClick={handlePracticeClick} />
      </section>

      {/* 4. ROW 3: LEARNING PROGRESS & WEEKLY GOALS */}
      <section className={styles.bottomGrid}>
         <ChartBarStacked data={learningProgress} />

         <div className={styles.goalsSection}>
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
                       <div className={styles.goalProgressBar} style={{ width: `${percentage}%`}}></div>
                     </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </section>
      
      {/* 5. ROW 4: ANNOUNCEMENTS */}
      <section className={styles.timelineSection}>
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    practiceLimit === num 
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
