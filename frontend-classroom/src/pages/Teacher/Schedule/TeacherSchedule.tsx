import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowRight, CheckCircle, BookOpen, Clock, Trash, Plus, Spinner, X, CaretDown, Coffee, CalendarCheck, Users, MapPin, VideoCamera, WarningCircle, CaretLeft, CaretRight, CalendarBlank, Chalkboard, BookBookmark, Calendar, Note, ChartLineUp, Fire } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { SecondaryButton } from "../../../components/ui/SecondaryButton";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";
import FireEffect from "./FireEffect";
import styles from "./TeacherSchedule.module.scss";

const TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
const TIME_OPTIONS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];
const START_HOUR = 7;
const HOUR_HEIGHT = 80; // px per hour

// Hàm parse thời gian "HH:mm" thành số giờ thập phân
const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
};



const THEMES = ["theme_blue", "theme_green", "theme_purple", "theme_orange", "theme_pink", "theme_teal"];
const getClassTheme = (classId: string | undefined) => {
  if (!classId) return styles.theme_blue;
  let hash = 0;
  for (let i = 0; i < classId.length; i++) {
    hash = classId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % THEMES.length;
  // Fallback to blue if undefined (just in case)
  return styles[THEMES[index]] || styles.theme_blue;
};

export default function TeacherSchedule() {
  const toast = useToast();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ITeacherClassroom[]>([]);
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const [activeView, setActiveView] = useState("Tuần");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState("");

  // Form states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1); // 1: Thứ 2
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:00");
  const [progress, setProgress] = useState(0);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{ message: string; suggestions: { startTime: string; endTime: string }[] } | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate days for the current selected week
  const days = useMemo(() => {
    const today = new Date();

    // Nếu đang ở chế độ Ngày
    if (activeView === "Ngày") {
      const currentDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      return [{
        value: currentDay,
        label: currentDay === 7 ? "Chủ Nhật" : `Thứ ${currentDay + 1}`,
        date: currentDate.getDate(),
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isToday: currentDate.toDateString() === today.toDateString()
      }];
    }

    // Mặc định chế độ Tuần
    const currentDay = currentDate.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diffToMonday);

    return [1, 2, 3, 4, 5, 6, 7].map((dayValue, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        value: dayValue,
        label: dayValue === 7 ? "Chủ Nhật" : `Thứ ${dayValue + 1}`,
        date: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isToday: date.toDateString() === today.toDateString()
      };
    });
  }, [currentDate, activeView]);

  // Navigate weeks/days
  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - (activeView === "Ngày" ? 1 : 7));
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (activeView === "Ngày" ? 1 : 7));
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // String formatting for header
  const getHeaderMonthYearString = () => {
    if (days.length === 0) return "";
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    if (firstDay.month === lastDay.month) {
      return `Tháng ${firstDay.month}, ${firstDay.year}`;
    } else if (firstDay.year === lastDay.year) {
      return `Tháng ${firstDay.month} - ${lastDay.month}, ${firstDay.year}`;
    } else {
      return `Tháng ${firstDay.month}, ${firstDay.year} - Tháng ${lastDay.month}, ${lastDay.year}`;
    }
  };

  const generateMiniCalendarDays = useCallback(() => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const calendarDays = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return calendarDays;
  }, [miniCalendarDate]);

  const today = new Date();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentTime = currentHour + currentMinute / 60;

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

  // Bộ lọc danh sách lớp cho sidebar (Not needed as we moved to combobox)
  // Lọc lịch dạy hiển thị trên lịch
  const filteredSchedules = useMemo(() => {
    if (activeFilters.length === 0) return schedules;
    return schedules.filter(s => activeFilters.includes(s.classId?.name || ""));
  }, [schedules, activeFilters]);

  // Lịch đang diễn ra hoặc sắp diễn ra tiếp theo
  const ongoingLesson = useMemo(() => {
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const todayLessons = schedules.filter(s => s.dayOfWeek === dayOfWeek);
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
  }, [schedules, currentTime, today]);

  // Danh sách lịch dạy hôm nay
  const todayClassesList = useMemo(() => {
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const lessons = schedules.filter(s => s.dayOfWeek === dayOfWeek);
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
  }, [schedules, currentTime, today]);

  // Xử lý lưu (tạo mới hoặc cập nhật) lịch dạy
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !subject) {
      toast.error("Vui lòng điền đủ thông tin!");
      return;
    }
    setSubmitting(true);
    try {
      if (editingScheduleId) {
        await scheduleService.updateSchedule(editingScheduleId, {
          classId: selectedClassId,
          subject,
          chapter,
          dayOfWeek,
          startTime,
          endTime,
          progress
        });
        toast.success("Cập nhật lịch giảng dạy thành công!");
      } else {
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
      }
      setShowAddModal(false);
      setEditingScheduleId(null);
      setChapter("");
      setProgress(0);

      // Reload schedule list
      const scheduleRes = await scheduleService.getSchedule();
      if (scheduleRes.data) {
        setSchedules(scheduleRes.data);
      }
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.suggestions) {
        setConflictData(error.response.data);
      } else {
        const msg = error.response?.data?.message || (editingScheduleId ? "Không thể cập nhật lịch dạy" : "Không thể lên lịch dạy");
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal sửa lịch
  const handleEditSchedule = (lesson: ISchedule) => {
    setEditingScheduleId(lesson._id);
    setSelectedClassId(lesson.classId._id);
    setSubject(lesson.subject);
    setChapter(lesson.chapter || "");
    setDayOfWeek(lesson.dayOfWeek);
    setStartTime(lesson.startTime);
    setEndTime(lesson.endTime);
    setProgress(lesson.progress || 0);
    setShowAddModal(true);
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

  // --- DRAG & DROP LOGIC ---
  const [creatingSlot, setCreatingSlot] = useState<{ dayValue: number; startY: number; currentY: number } | null>(null);

  const formatTimeHelper = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const handleDragStart = (e: React.DragEvent, lessonId: string) => {
    e.dataTransfer.setData("lessonId", lessonId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dayValue: number) => {
    e.preventDefault();
    const lessonId = e.dataTransfer.getData("lessonId");
    if (!lessonId) return;

    const lesson = schedules.find(l => l._id === lessonId);
    if (!lesson) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dropY = e.clientY - rect.top;

    const snapToPixels = (30 / 60) * HOUR_HEIGHT; // 40px
    const snappedTop = Math.round(dropY / snapToPixels) * snapToPixels;
    const newStartH = START_HOUR + Math.floor(snappedTop / HOUR_HEIGHT);
    const newStartM = Math.round((snappedTop % HOUR_HEIGHT) / HOUR_HEIGHT * 60);

    const oldStart = parseTime(lesson.startTime);
    const oldEnd = parseTime(lesson.endTime);
    const duration = oldEnd - oldStart;

    const newEndT = newStartH + newStartM / 60 + duration;
    const newEndH = Math.floor(newEndT);
    const newEndM = Math.round((newEndT % 1) * 60);

    const newStartTime = formatTimeHelper(newStartH, newStartM);
    const newEndTime = formatTimeHelper(newEndH, newEndM);

    // Tạm thời cập nhật UI
    setSchedules(prev => prev.map(s => {
      if (s._id === lessonId) {
        return { ...s, dayOfWeek: dayValue, startTime: newStartTime, endTime: newEndTime };
      }
      return s;
    }));

    try {
      await scheduleService.updateSchedule(lessonId, {
        dayOfWeek: dayValue,
        startTime: newStartTime,
        endTime: newEndTime
      });
      toast.success("Đã thay đổi lịch học");
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.suggestions) {
        toast.error("Trùng lịch! Đang mở gợi ý lịch học trống.");
        // Rollback UI to actual backend state
        const scheduleRes = await scheduleService.getSchedule();
        if (scheduleRes.data) {
          setSchedules(scheduleRes.data);
          // Find the reverted lesson to edit it
          const reverted = scheduleRes.data.find(s => s._id === lessonId);
          if (reverted) {
            handleEditSchedule(reverted);
            setConflictData(error.response.data);
          }
        }
      } else {
        toast.error(error.response?.data?.message || "Lỗi khi thay đổi lịch");
        loadInitialData(); // Phục hồi dữ liệu
      }
    }
  };

  // --- DRAG TO CREATE LOGIC ---
  const handleMouseDown = (e: React.MouseEvent, dayValue: number) => {
    if (e.button !== 0) return; // Chỉ chuột trái
    if ((e.target as HTMLElement).closest(`.${styles.lessonCardAbsolute}`)) return; // Bỏ qua nếu click vào lesson card

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setCreatingSlot({ dayValue, startY: y, currentY: y });
  };

  const handleMouseMove = (e: React.MouseEvent, dayValue: number) => {
    if (!creatingSlot || creatingSlot.dayValue !== dayValue) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setCreatingSlot(prev => prev ? { ...prev, currentY: y } : null);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!creatingSlot) return;

    const startTop = Math.min(creatingSlot.startY, creatingSlot.currentY);
    const endTop = Math.max(creatingSlot.startY, creatingSlot.currentY);

    const snapToPixels = (30 / 60) * HOUR_HEIGHT; // snap theo 30 phút
    const snappedStartTop = Math.round(startTop / snapToPixels) * snapToPixels;
    let snappedEndTop = Math.round(endTop / snapToPixels) * snapToPixels;
    if (snappedEndTop <= snappedStartTop) snappedEndTop = snappedStartTop + snapToPixels;

    const startH = Math.min(23, START_HOUR + Math.floor(snappedStartTop / HOUR_HEIGHT));
    const startM = Math.round((snappedStartTop % HOUR_HEIGHT) / HOUR_HEIGHT * 60);
    const endH = Math.min(23, START_HOUR + Math.floor(snappedEndTop / HOUR_HEIGHT));
    const endM = Math.round((snappedEndTop % HOUR_HEIGHT) / HOUR_HEIGHT * 60);

    setDayOfWeek(creatingSlot.dayValue);
    setStartTime(formatTimeHelper(startH, startM));
    setEndTime(formatTimeHelper(endH, endM));

    if (classes.length > 0 && !selectedClassId) {
      handleClassChange(classes[0]._id);
    }

    setShowAddModal(true);
    setCreatingSlot(null);
  };

  return (
    <div className={styles.container}>
      {/* CỘT CHÍNH (MAIN SCHEDULE) */}
      <div className={styles.mainContent}>
        {/* Tiêu đề & Toggle View */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.todayControls}>
              <button className={styles.btnToday} onClick={handleToday}>
                Hôm nay
              </button>
              <div className={styles.navArrows}>
                <button className={styles.btnIcon} onClick={handlePrevWeek}>
                  <CaretLeft size={18} weight="bold" />
                </button>
                <button className={styles.btnIcon} onClick={handleNextWeek}>
                  <CaretRight size={18} weight="bold" />
                </button>
              </div>
            </div>
            <h2 className={styles.headerTitle}>{getHeaderMonthYearString()}</h2>
          </div>

          <div className={styles.headerCenter}>
            <div className={styles.filterCombobox}>
              {activeFilters.length > 0 && (
                <div className={styles.filterChips}>
                  {activeFilters.map(f => (
                    <span key={f} className={styles.filterChip}>
                      {f}
                      <button onClick={(e) => { e.stopPropagation(); setActiveFilters(prev => prev.filter(x => x !== f)); }}>
                        <X size={12} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className={styles.filterTrigger}>
                    {activeFilters.length === 0 && <span className={styles.placeholder}>Chọn lớp...</span>}
                    <Plus size={16} weight="bold" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white border border-slate-200 shadow-lg rounded-xl p-0 overflow-hidden" style={{ zIndex: 1100 }}>
                  <div className={styles.comboboxSearch}>
                    <input
                      type="text"
                      placeholder="Tìm tên lớp..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {classes.filter(c => c.name.toLowerCase().includes(filterSearch.toLowerCase())).map(c => {
                      const isSelected = activeFilters.includes(c.name);
                      return (
                        <DropdownMenuItem
                          key={c._id}
                          onClick={() => {
                            setActiveFilters(prev => isSelected ? prev.filter(f => f !== c.name) : [...prev, c.name]);
                          }}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors flex justify-between items-center outline-none ${isSelected ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {c.name}
                          {isSelected && <CheckCircle size={16} weight="fill" color="#0d9488" />}
                        </DropdownMenuItem>
                      )
                    })}
                    {classes.filter(c => c.name.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-slate-500">
                        Không tìm thấy lớp học.
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className={styles.headerRight}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className={styles.viewSelector}>
                  <span>{activeView}</span>
                  <CaretDown size={14} weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100 }}>
                <DropdownMenuItem
                  onClick={() => setActiveView("Ngày")}
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${activeView === "Ngày" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  Ngày
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveView("Tuần")}
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${activeView === "Tuần" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  Tuần
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2 text-sm text-slate-400 rounded-lg cursor-not-allowed">
                  Tháng (Không khả dụng)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AnimatedAddButton onClick={() => {
              setEditingScheduleId(null);
              setSubject("");
              setChapter("");
              setProgress(0);
              setShowAddModal(true);
            }} />
          </div>
        </div>

        {/* Lưới Lịch */}
        <div className={styles.calendarCard}>
          {/* Header các ngày trong tuần */}
          <div className={`${styles.calendarHeader} ${activeView === "Ngày" ? styles.dayViewGridHeader : ""}`}>
            <div className={styles.timeColumnHeader}>Giờ</div>
            {days.map((d, i) => (
              <div
                key={i}
                className={`${styles.dayColumnHeader} ${d.isToday ? styles.todayHeader : ""}`}
              >
                <span className={styles.dayText}>{d.label}</span>
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
            <div className={`${styles.daysColumnsGrid} ${activeView === "Ngày" ? styles.dayViewGridBody : ""}`}>
              {/* Lưới nền (background grid) */}
              <div className={styles.gridLinesAbsolute}>
                {TIME_SLOTS.map((_, idx) => (
                  <div key={idx} className={styles.gridLine} style={{ top: idx * HOUR_HEIGHT }}></div>
                ))}

                {/* Đường kẻ thời gian hiện tại (Current Time Line) */}
                {currentTime >= START_HOUR && currentTime <= 23 && (() => {
                  const formattedTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                  return (
                    <div
                      className={styles.currentTimeLine}
                      style={{ top: (currentTime - START_HOUR) * HOUR_HEIGHT }}
                    >
                      <div className={styles.currentTimeLabel}>{formattedTime}</div>
                      <div className={styles.currentTimeDot}></div>
                    </div>
                  );
                })()}
              </div>

              {loadingData ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                  <Spinner size={32} className={styles.spinning} />
                </div>
              ) : days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`${styles.dayColumn} ${day.isToday ? styles.todayColBg : ""}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.value)}
                  onMouseDown={(e) => handleMouseDown(e, day.value)}
                  onMouseMove={(e) => handleMouseMove(e, day.value)}
                  onMouseUp={handleMouseUp}
                >
                  {filteredSchedules
                    .filter(l => l.dayOfWeek === day.value)
                    .map(lesson => {
                      const start = parseTime(lesson.startTime);
                      const end = parseTime(lesson.endTime);
                      const top = (start - START_HOUR) * HOUR_HEIGHT;
                      // Trừ đi 4px chiều cao để tạo khe hở (gap) giữa các khối lịch liền kề nhau
                      const height = (end - start) * HOUR_HEIGHT - 6; 
                      const isOngoing = lesson._id === ongoingLesson?._id;
                      const isCurrent = isOngoing && currentTime >= start && currentTime <= end;
                      const isUpcoming = isOngoing && currentTime < start;
                      const isUpcoming15Mins = isUpcoming && (start - currentTime <= 0.25);
                      const themeClass = getClassTheme(lesson.classId?._id);

                      let stateClass = "";
                      if (isCurrent) stateClass = styles.lessonOngoing;
                      else if (isUpcoming) stateClass = styles.lessonUpcoming;

                      if (day.isToday && (isCurrent || isUpcoming15Mins)) {
                        stateClass += ` ${styles.lessonHeartbeat}`;
                      }

                      return (
                        <div
                          key={lesson._id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, lesson._id)}
                          onClick={() => handleEditSchedule(lesson)}
                          className={`${styles.lessonCardAbsolute} ${themeClass} ${stateClass}`}
                          style={{ top, height, cursor: 'grab' }}
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

                          {day.isToday && (isCurrent || isUpcoming15Mins) && <FireEffect />}

                          <div className={styles.lessonTime}>{lesson.startTime} - {lesson.endTime}</div>
                          <div className={styles.lessonTitle}>{lesson.classId?.name || "Lớp học"} - {lesson.subject}</div>
                          <div className={styles.lessonRoom}>{lesson.chapter || "Chương trình học"}</div>

                          {/* TOOLTIP HIỂN THỊ KHI HOVER */}
                          <div className={styles.tooltipContent}>
                            <h5 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                              {lesson.chapter || "Chưa cập nhật tên bài giảng"}
                            </h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                              <Users size={16} color="#3b82f6" weight="fill" />
                              <span>Sĩ số: <strong>{classes.find(c => c._id === lesson.classId?._id)?.students?.length || 0}</strong> học viên</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                              <MapPin size={16} color="#10b981" weight="fill" />
                              <span>Phòng: <strong>301 - Tòa A</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                              <VideoCamera size={16} color="#8b5cf6" weight="fill" />
                              <span>Meet: <span style={{ color: '#3b82f6' }}>meet.google.com/abc</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Render ghost element khi đang kéo để tạo mới lịch */}
                  {creatingSlot && creatingSlot.dayValue === day.value && (
                    <div
                      className={styles.creatingSlotGhost}
                      style={{
                        top: Math.min(creatingSlot.startY, creatingSlot.currentY),
                        height: Math.max(creatingSlot.startY, creatingSlot.currentY) - Math.min(creatingSlot.startY, creatingSlot.currentY)
                      }}
                    >
                      <Plus size={20} color="#3b82f6" />
                      <span>Thêm lịch dạy</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ (RIGHT SIDEBAR) */}
      <div className={styles.rightSidebar}>
        {/* MINI CALENDAR */}
        <div className={styles.miniCalendarCard}>
          <div className={styles.miniCalendarHeader}>
            <span className={styles.miniCalendarTitle}>
              Tháng {miniCalendarDate.getMonth() + 1}, {miniCalendarDate.getFullYear()}
            </span>
            <div className={styles.miniCalendarNav}>
              <button className={styles.miniNavBtn} onClick={() => setMiniCalendarDate(new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() - 1, 1))}>
                <CaretLeft size={16} weight="bold" />
              </button>
              <button className={styles.miniNavBtn} onClick={() => setMiniCalendarDate(new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() + 1, 1))}>
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>
          <div className={styles.miniCalendarGrid}>
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
              <div key={d} className={styles.miniCalendarDayName}>{d}</div>
            ))}
            {generateMiniCalendarDays().map((d, i) => {
              const isSelected = d.date.toDateString() === currentDate.toDateString();
              const isToday = d.date.toDateString() === new Date().toDateString();
              return (
                <button
                  key={i}
                  className={`${styles.miniCalendarDay} ${!d.isCurrentMonth ? styles.notCurrentMonth : ''} ${isSelected ? styles.selectedDay : ''} ${isToday && !isSelected ? styles.todayDay : ''}`}
                  onClick={() => {
                    setCurrentDate(d.date);
                    setMiniCalendarDate(d.date);
                  }}
                >
                  {d.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Khối Đang diễn ra */}
        {ongoingLesson && (
          <div className={styles.ongoingCard}>
            <div className={styles.ongoingHeader}>
              <span className={`${styles.ongoingBadge} ${styles.pulseBadge}`}>
                <Fire size={16} weight="fill" className={styles.pulseIcon} style={{ marginRight: '4px' }} />
                ĐANG DIỄN RA
              </span>
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
              <button
                className={styles.actionBtn}
                onClick={() => navigate('/attendance', { state: { classId: ongoingLesson.classId?._id } })}
              >
                <CheckCircle size={18} weight="regular" />
                Điểm danh
              </button>
              <button className={styles.actionBtn}>
                <BookOpen size={18} weight="regular" />
                Tài liệu
              </button>
            </div>
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
              <div className={styles.emptyTodayState}>
                <CalendarCheck size={40} weight="duotone" color="#60a5fa" />
                <p>Không có tiết học nào hôm nay.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL LÊN LỊCH DẠY MỚI */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <form className={styles.modalContent} onSubmit={handleSaveSchedule}>
            <div className={styles.modalHeader}>
              <h3>{editingScheduleId ? "Chỉnh Sửa Lịch Giảng Dạy" : "Lên Lịch Giảng Dạy"}</h3>
              <button type="button" onClick={() => { setShowAddModal(false); setEditingScheduleId(null); setConflictData(null); }} className={styles.btnClose}>
                <X size={20} />
              </button>
            </div>

            {/* HIỂN THỊ CẢNH BÁO TRÙNG LỊCH & GỢI Ý */}
            {conflictData && (
              <div className={styles.conflictAlert}>
                <WarningCircle size={24} color="#ef4444" weight="fill" />
                <div className={styles.conflictAlertContent}>
                  <strong>Đã xảy ra trùng lịch!</strong>
                  <p>{conflictData.message}</p>
                  <p className={styles.suggestionTitle}>Gợi ý giờ học trống trong ngày:</p>
                  <div className={styles.suggestionChips}>
                    {conflictData.suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className={styles.suggestionChip}
                        onClick={() => {
                          setStartTime(s.startTime);
                          setEndTime(s.endTime);
                          setConflictData(null);
                        }}
                      >
                        <Clock size={14} weight="bold" />
                        {s.startTime} - {s.endTime}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formRow3}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><Chalkboard size={18} weight="duotone" color="#64748b" /> <span>Lớp học</span></label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.dropdownTriggerBtn}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {classes.find(c => c._id === selectedClassId)?.name || "Chọn lớp"}
                      </span>
                      <CaretDown size={14} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100, maxHeight: 250, overflowY: 'auto' }}>
                    {classes.map(c => (
                      <DropdownMenuItem
                        key={c._id}
                        onClick={() => { setSelectedClassId(c._id); setConflictData(null); }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                      >
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}><BookBookmark size={18} weight="duotone" color="#64748b" /> <span>Môn / Tiêu đề</span></label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Nhập môn học..." required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}><Calendar size={18} weight="duotone" color="#64748b" /> <span>Thứ trong tuần</span></label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.dropdownTriggerBtn}>
                      <span>
                        {dayOfWeek === 7 ? "Chủ Nhật" : `Thứ ${dayOfWeek + 1}`}
                      </span>
                      <CaretDown size={14} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100, maxHeight: 250, overflowY: 'auto' }}>
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
                        onClick={() => { setDayOfWeek(d.value); setConflictData(null); }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                      >
                        {d.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className={styles.formRow2}>
              <div className={styles.formGroup} style={{ flex: 1.5 }}>
                <label className={styles.formLabel}><Note size={18} weight="duotone" color="#64748b" /> <span>Chương học / Ghi chú</span></label>
                <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="VD: Chương I: Đạo hàm" />
              </div>

              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}><ChartLineUp size={18} weight="duotone" color="#64748b" /> <span>Tiến độ giảng dạy (%)</span></label>
                <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
              </div>
            </div>

            <div className={styles.formRow2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><Clock size={18} weight="duotone" color="#64748b" /> <span>Giờ bắt đầu</span></label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.dropdownTriggerBtn}>
                      <span>{startTime || "Chọn giờ"}</span>
                      <CaretDown size={14} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100, maxHeight: 200, overflowY: 'auto' }}>
                    {TIME_OPTIONS.map(time => (
                      <DropdownMenuItem
                        key={time}
                        onClick={() => { setStartTime(time); setConflictData(null); }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        {time}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><Clock size={18} weight="duotone" color="#64748b" /> <span>Giờ kết thúc</span></label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.dropdownTriggerBtn}>
                      <span>{endTime || "Chọn giờ"}</span>
                      <CaretDown size={14} weight="bold" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1" style={{ zIndex: 1100, maxHeight: 200, overflowY: 'auto' }}>
                    {TIME_OPTIONS.map(time => (
                      <DropdownMenuItem
                        key={time}
                        onClick={() => { setEndTime(time); setConflictData(null); }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        {time}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={() => { setShowAddModal(false); setEditingScheduleId(null); }} className={styles.btnCancel}>Hủy</button>
              <SecondaryButton type="submit" disabled={submitting}>
                {submitting ? <Spinner size={20} className={styles.spinning} /> : (editingScheduleId ? "Cập nhật" : "Tạo Lịch")}
              </SecondaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
