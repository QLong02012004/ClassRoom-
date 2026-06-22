import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowRight, CheckCircle, BookOpen, Clock, Trash, Plus, Spinner, X, CaretDown } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import styles from "./TeacherSchedule.module.scss";

const TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
const START_HOUR = 7;
const HOUR_HEIGHT = 80; // px per hour

// Hàm parse thời gian "HH:mm" thành số giờ thập phân
const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
};

export default function TeacherSchedule() {
  const toast = useToast();

  const [classes, setClasses] = useState<ITeacherClassroom[]>([]);
  const [schedules, setSchedules] = useState<ISchedule[]>([]);
  
  const [activeView, setActiveView] = useState("Tuần");
  const [activeFilter, setActiveFilter] = useState("Tất cả lớp");

  // Form thêm lịch mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1); // 1: Thứ 2
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:00");
  const [progress, setProgress] = useState(0);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lấy ngày thứ trong tuần thực tế
  const today = new Date();
  // js day: 0 = Sunday, 1 = Monday, 2 = Tuesday...
  // dayOfWeek: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
  const currentJsDay = today.getDay();
  const currentDayOfWeek = currentJsDay === 0 ? 7 : currentJsDay;
  
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentTime = currentHour + currentMinute / 60;

  // Tính toán các ngày trong tuần này để hiển thị tiêu đề lịch
  const getWeekDates = () => {
    const dates = [];
    const first = today.getDate() - (currentDayOfWeek - 1);
    for (let i = 0; i < 5; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(first + i);
      dates.push({
        day: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"][i],
        date: String(nextDate.getDate()),
        isToday: currentDayOfWeek === (i + 1),
        value: i + 1
      });
    }
    return dates;
  };

  const DAYS = useMemo(() => getWeekDates(), [currentDayOfWeek]);

  // Load classrooms & schedules
  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [classRes, scheduleRes] = await Promise.all([
        classroomService.getTeacherClassrooms(),
        scheduleService.getSchedule()
      ]);
      if (classRes.data) {
        setClasses(classRes.data);
        if (classRes.data.length > 0) {
          setSelectedClassId(classRes.data[0]._id);
          setSubject(classRes.data[0].subject || "");
        }
      }
      if (scheduleRes.data) {
        setSchedules(scheduleRes.data);
      }
    } catch {
      toast.error("Không thể tải thông tin lịch giảng dạy");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Bộ lọc danh sách lớp cho sidebar
  const filters = useMemo(() => {
    return ["Tất cả lớp", ...classes.map(c => c.name)];
  }, [classes]);

  // Lọc lịch dạy hiển thị trên lịch
  const filteredSchedules = useMemo(() => {
    if (activeFilter === "Tất cả lớp") return schedules;
    return schedules.filter(s => s.classId?.name === activeFilter);
  }, [schedules, activeFilter]);

  // Lịch đang diễn ra hoặc sắp diễn ra tiếp theo
  const ongoingLesson = useMemo(() => {
    const todayLessons = schedules.filter(s => s.dayOfWeek === currentDayOfWeek);
    // 1. Tìm lịch đang diễn ra
    const current = todayLessons.find(l => {
      const start = parseTime(l.startTime);
      const end = parseTime(l.endTime);
      return currentTime >= start && currentTime <= end;
    });
    if (current) return current;

    // 2. Tìm lịch sắp diễn ra tiếp theo trong ngày
    const next = todayLessons
      .filter(l => parseTime(l.startTime) > currentTime)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))[0];
    
    return next || null;
  }, [schedules, currentTime, currentDayOfWeek]);

  // Danh sách lịch dạy hôm nay
  const todayClassesList = useMemo(() => {
    const lessons = schedules.filter(s => s.dayOfWeek === currentDayOfWeek);
    return lessons
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
      .map(l => {
        const start = parseTime(l.startTime);
        const end = parseTime(l.endTime);
        let status = "Sắp tới";
        let statusColor = "blue";

        if (currentTime > end) {
          status = "Hoàn thành";
          statusColor = "green";
        } else if (currentTime >= start && currentTime <= end) {
          status = "Đang giảng";
          statusColor = "red";
        }

        return {
          ...l,
          timeLabel: `${l.startTime} - ${l.endTime}`,
          title: `${l.classId?.name || "Lớp học"} - ${l.subject}`,
          status,
          statusColor
        };
      });
  }, [schedules, currentTime, currentDayOfWeek]);

  // Xử lý tạo lịch dạy mới
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !subject) {
      toast.error("Vui lòng điền đủ thông tin!");
      return;
    }
    setSubmitting(true);
    try {
      await scheduleService.createSchedule({
        classId: selectedClassId,
        subject,
        chapter,
        dayOfWeek,
        startTime,
        endTime,
        progress
      });
      toast.success("Lên lịch giảng dạy thành công!");
      setShowAddModal(false);
      setChapter("");
      setProgress(0);
      
      // Reload schedule list
      const scheduleRes = await scheduleService.getSchedule();
      if (scheduleRes.data) {
        setSchedules(scheduleRes.data);
      }
    } catch {
      toast.error("Không thể lên lịch dạy");
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý xóa lịch dạy
  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa lịch giảng dạy này không?")) return;
    try {
      await scheduleService.deleteSchedule(id);
      toast.success("Đã xóa lịch giảng dạy");
      setSchedules(prev => prev.filter(s => s._id !== id));
    } catch {
      toast.error("Không thể xóa lịch dạy");
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find(c => c._id === classId);
    if (cls) {
      setSubject(cls.subject || "");
    }
  };

  return (
    <div className={styles.container}>
      {/* CỘT CHÍNH (MAIN SCHEDULE) */}
      <div className={styles.mainContent}>
        {/* Tiêu đề & Toggle View */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Lịch Giảng Dạy Tuần Này</h1>
            <p className={styles.pageSubtitle}>
              Tuần hiện tại &bull; {today.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className={styles.viewToggle}>
            {["Ngày", "Tuần", "Tháng"].map((view) => (
              <button
                key={view}
                className={`${styles.viewBtn} ${activeView === view ? styles.activeView : ""}`}
                onClick={() => setActiveView(view)}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {/* Lưới Lịch */}
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <div className={styles.timeColumnHeader}>Giờ</div>
            {DAYS.map((d, i) => (
              <div
                key={i}
                className={`${styles.dayColumnHeader} ${d.isToday ? styles.todayHeader : ""}`}
              >
                <span className={styles.dayText}>{d.day}</span>
                <span className={styles.dateText}>{d.date}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.calendarBody}>
            {/* Cột thời gian (Trục Y) */}
            <div className={styles.timeLabelsColumn}>
              {TIME_SLOTS.map((time, idx) => (
                <div key={idx} className={styles.timeLabel} style={{ height: HOUR_HEIGHT }}>
                  {time}
                </div>
              ))}
            </div>

            {/* Các cột Ngày */}
            <div className={styles.daysColumnsGrid}>
              <div className={styles.gridLinesAbsolute}>
                {TIME_SLOTS.map((_, idx) => (
                  <div key={idx} className={styles.gridLine} style={{ top: idx * HOUR_HEIGHT }}></div>
                ))}
              </div>

              {loadingData ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                  <Spinner size={32} className={styles.spinning} />
                </div>
              ) : DAYS.map((day, dayIdx) => (
                <div key={dayIdx} className={`${styles.dayColumn} ${day.isToday ? styles.todayColBg : ""}`}>
                  {filteredSchedules
                    .filter(l => l.dayOfWeek === day.value)
                    .map(lesson => {
                      const start = parseTime(lesson.startTime);
                      const end = parseTime(lesson.endTime);
                      const top = (start - START_HOUR) * HOUR_HEIGHT;
                      const height = (end - start) * HOUR_HEIGHT;
                      const isOngoing = lesson._id === ongoingLesson?._id;

                      return (
                        <div
                          key={lesson._id}
                          className={`${styles.lessonCardAbsolute} ${isOngoing ? styles.lessonOngoing : ""}`}
                          style={{ top, height }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(lesson._id); }}
                            style={{
                              position: 'absolute',
                              right: 6,
                              top: 6,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: isOngoing ? '#fecaca' : '#ef4444',
                              zIndex: 10
                            }}
                          >
                            <Trash size={14} />
                          </button>
                          <div className={styles.lessonTime}>{lesson.startTime} - {lesson.endTime}</div>
                          <div className={styles.lessonTitle}>{lesson.classId?.name || "Lớp học"} - {lesson.subject}</div>
                          <div className={styles.lessonRoom}>{lesson.chapter || "Chương trình học"}</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ (RIGHT SIDEBAR) */}
      <div className={styles.rightSidebar}>
        {/* Nút thêm lịch mới */}
        <button className={styles.btnAddSchedule} onClick={() => setShowAddModal(true)}>
          <Plus size={18} weight="bold" />
          Lên lịch dạy mới
        </button>

        {/* Khối Đang diễn ra */}
        {ongoingLesson ? (
          <div className={styles.ongoingCard}>
            <div className={styles.ongoingHeader}>
              <span className={styles.ongoingBadge}>ĐANG DIỄN RA</span>
              <span className={styles.ongoingTime}>{ongoingLesson.startTime} - {ongoingLesson.endTime}</span>
            </div>
            <h3 className={styles.ongoingClass}>
              Lớp {ongoingLesson.classId?.name || "Lớp học"} - {ongoingLesson.subject}
            </h3>
            <p className={styles.ongoingChapter}>{ongoingLesson.chapter || "Chưa thiết lập chương học"}</p>
            
            <div className={styles.progressSection}>
              <div className={styles.progressLabels}>
                <span>Tiến độ bài giảng</span>
                <span>{ongoingLesson.progress}%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: `${ongoingLesson.progress}%` }}></div>
              </div>
            </div>

            <div className={styles.ongoingActions}>
              <button className={styles.actionBtn}>
                <CheckCircle size={18} weight="regular" />
                Điểm danh
              </button>
              <button className={styles.actionBtn}>
                <BookOpen size={18} weight="regular" />
                Tài liệu
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.ongoingCard}>
            <p style={{ margin: 0, textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Không có tiết học nào đang diễn ra.
            </p>
          </div>
        )}

        {/* Khối Tiết học hôm nay */}
        <div className={styles.todayScheduleCard}>
          <div className={styles.cardHeader}>
            <h4>Tiết học hôm nay</h4>
            <span className={styles.countBadge}>{todayClassesList.length} Tiết</span>
          </div>
          <div className={styles.timeline}>
            {todayClassesList.length > 0 ? todayClassesList.map((item, idx) => (
              <div key={idx} className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${styles[`dot_${item.statusColor}`]}`}></div>
                <div className={styles.timelineContent}>
                  <div className={styles.timeText}>{item.timeLabel}</div>
                  <div className={styles.classTitle}>{item.title}</div>
                  <span className={`${styles.statusBadge} ${styles[`badge_${item.statusColor}`]}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            )) : (
              <p className={styles.noDataText}>Không có tiết học nào hôm nay.</p>
            )}
          </div>
        </div>

        {/* Khối Bộ lọc nhanh */}
        <div className={styles.filterCard}>
          <div className={styles.cardHeader}>
            <h4>Bộ lọc theo lớp</h4>
          </div>
          <div className={styles.filterChips}>
            {filters.map((filter) => (
              <button
                key={filter}
                className={`${styles.filterChip} ${activeFilter === filter ? styles.activeChip : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL LÊN LỊCH DẠY MỚI */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <form className={styles.modalContent} onSubmit={handleCreateSchedule}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Lên Lịch Giảng Dạy</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Lớp học</label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.dropdownTriggerBtn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>
                        {classes.find(c => c._id === selectedClassId)?.name || "Chọn lớp"}
                      </span>
                      <CaretDown size={14} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100 }}>
                    {classes.map(c => (
                      <DropdownMenuItem
                        key={c._id}
                        onClick={() => handleClassChange(c._id)}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                      >
                        {c.name} {c.subject ? `(${c.subject})` : ""}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className={styles.formGroup}>
                <label>Môn học / Tiêu đề</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Nhập môn học..." required />
              </div>

              <div className={styles.formGroup}>
                <label>Thứ trong tuần</label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.dropdownTriggerBtn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>
                        {dayOfWeek === 7 ? "Chủ Nhật" : `Thứ ${dayOfWeek + 1}`}
                      </span>
                      <CaretDown size={14} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100 }}>
                    {[
                      { label: "Thứ 2", value: 1 },
                      { label: "Thứ 3", value: 2 },
                      { label: "Thứ 4", value: 3 },
                      { label: "Thứ 5", value: 4 },
                      { label: "Thứ 6", value: 5 },
                      { label: "Thứ 7", value: 6 },
                      { label: "Chủ Nhật", value: 7 },
                    ].map(d => (
                      <DropdownMenuItem
                        key={d.value}
                        onClick={() => setDayOfWeek(d.value)}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                      >
                        {d.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 2 }}>
                <label>Chương học / Ghi chú</label>
                <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="VD: Chương I: Đạo hàm" />
              </div>

              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Tiến độ giảng dạy (%)</label>
                <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Giờ bắt đầu</label>
                <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="VD: 07:30" required />
              </div>
              <div className={styles.formGroup}>
                <label>Giờ kết thúc</label>
                <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="VD: 09:00" required />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnCancel} onClick={() => setShowAddModal(false)}>
                Hủy bỏ
              </button>
              <button type="submit" className={styles.btnConfirm} disabled={submitting}>
                {submitting ? <Spinner size={16} className={styles.spinning} /> : "Thêm lịch dạy"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
