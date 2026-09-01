import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  CheckSquare,
  Clipboard,
  ArrowUpRight,
  WarningCircle,
  BellRinging,
  Plus,
  FileText,
  CalendarCheck,
  Megaphone,
  FolderSimplePlus,
  ChalkboardTeacher,
} from "phosphor-react";
import { createMockClassroom } from "../../../utils/mockDb";
import type { Classroom } from "../../../utils/mockDb";
import { useToast } from "../../../components/Styles/ToastContext";
import { dashboardService } from "../../../service/dashboard.service";
import type { ITeacherDashboardStats } from "../../../service/dashboard.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { notificationService } from "../../../service/notification.service";
import { useAuth } from "../../../context/AuthContext";
import { checkTeacherProfileComplete } from "../../../utils/profileChecker";
import { ProfileWarningModal } from "../../../components/ui/Dialogs/ProfileWarningModal";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { AnimatedAddButton } from "@/components/ui/Buttons/AnimatedAddButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function StatCardSkeleton() {
  return (
    <Card className="flex flex-col border-none ring-0 shadow-[0_10px_25px_rgba(0,0,0,0.04)] rounded-3xl bg-white p-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </CardHeader>
      <CardContent className="p-6 pt-0 relative flex-1">
        <Skeleton className="h-10 w-24 mt-1" />
        <Skeleton className="h-4 w-3/4 mt-4" />
        <Skeleton className="h-3 w-1/2 mt-2" />
      </CardContent>
    </Card>
  );
}

export function SkeletonAvatar() {
  return (
    <div className="flex w-full items-center gap-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="grid gap-2 flex-1">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      <Skeleton className="h-4 w-12 ml-auto" />
    </div>
  );
}

const SkeletonBar = (props: any) => {
  const { x, y, width, height } = props;
  return <rect x={x} y={y} width={width} height={height} className="animate-pulse fill-slate-200" rx={6} ry={6} />;
};

interface ScoreStats {
  gioi: number;
  kha: number;
  trungBinh: number;
  yeuKem: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfileWarningModal, setShowProfileWarningModal] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [newClass, setNewClass] = useState({ className: "", subject: "" });

  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [scoreStats, setScoreStats] = useState<ScoreStats>({ gioi: 142, kha: 110, trungBinh: 68, yeuKem: 12 });

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ITeacherDashboardStats["stats"] | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<ITeacherDashboardStats["atRiskStudents"]>([]);
  const [sendingWarning, setSendingWarning] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Schedules State
  const [schedules, setSchedules] = useState<ISchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const [scoreStatsLoading, setScoreStatsLoading] = useState(false);

  const loadData = async (classIdFilter = selectedClassFilter, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setScoreStatsLoading(true);
    }

    try {
      const res = await dashboardService.getTeacherDashboardStats(classIdFilter);
      if (res.data) {
        setStats(res.data.stats);
        setScoreStats(res.data.scoreDistribution);
        setRecentActivities(res.data.recentActivities || []);
        setAtRiskStudents(res.data.atRiskStudents || []);

        setClassrooms(prev => {
          if (prev.length > 0) return prev;
          return res.data.classes.map(c => ({
            _id: c._id,
            className: c.className,
            subject: c.subject || 'Môn học',
            classCode: '',
            teacherId: '',
            createdAt: ''
          }));
        });
      }
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu thống kê!");
    } finally {
      setIsLoading(false);
      setScoreStatsLoading(false);
    }
  };

  const loadSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const res = await scheduleService.getSchedule();
      if (res.data) {
        setSchedules(res.data);
      }
    } catch (error: any) {
      console.error("Lỗi khi tải lịch dạy:", error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    loadData(selectedClassFilter, false);
  }, [selectedClassFilter]);

  useEffect(() => {
    loadData('all', true);
    loadSchedules();

    const handleOpenModal = () => {
      const { isComplete, missingFields } = checkTeacherProfileComplete(user);
      if (!isComplete) {
        setMissingProfileFields(missingFields);
        setShowProfileWarningModal(true);
        return;
      }
      setShowModal(true);
    };
    window.addEventListener("open-new-class-modal", handleOpenModal);

    return () => {
      window.removeEventListener("open-new-class-modal", handleOpenModal);
    };
  }, [user]);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.className || !newClass.subject) {
      toast.error("Vui lòng điền đầy đủ thông tin tên lớp và môn học!");
      return;
    }

    try {
      createMockClassroom(newClass.className, newClass.subject);
      toast.success(`Tạo lớp học "${newClass.className}" thành công!`, 3000);
      setNewClass({ className: "", subject: "" });
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error("Đã xảy ra lỗi trong quá trình tạo lớp!");
    }
  };

  const handleSendWarning = async (student: { id: string; name: string; issue: string }) => {
    if (sendingWarning) return;
    setSendingWarning(student.id);
    try {
      await notificationService.sendWarning(
        student.id,
        `⚠️ Cảnh báo từ giáo viên`,
        `Bạn đang trong diện cảnh báo: ${student.issue}. Hãy cố gắng cải thiện để đạt kết quả tốt hơn!`
      );
      toast.success(`Đã gửi cảnh báo tới ${student.name}!`);
    } catch (err: any) {
      toast.error(err.message || `Không thể gửi cảnh báo tới ${student.name}!`);
    } finally {
      setSendingWarning(null);
    }
  };

  const scoreChartData = [
    { level: "Giỏi", students: scoreStats.gioi, fill: "#10b981" },
    { level: "Khá", students: scoreStats.kha, fill: "#3b82f6" },
    { level: "Trung bình", students: scoreStats.trungBinh, fill: "#f59e0b" },
    { level: "Yếu/Kém", students: scoreStats.yeuKem, fill: "#ef4444" },
  ];

  const scoreChartConfig = {
    students: {
      label: "Học sinh",
    },
    label: {
      color: "var(--background)",
    },
  } satisfies ChartConfig;

  const totalEvaluatedStudents = scoreStats.gioi + scoreStats.kha + scoreStats.trungBinh + scoreStats.yeuKem;
  const goodPassRate = totalEvaluatedStudents === 0 ? 0 : Math.round(((scoreStats.gioi + scoreStats.kha) / totalEvaluatedStudents) * 100);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 bg-slate-50/50 min-h-screen w-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#f47c20]">
            Tổng quan giảng dạy
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Báo cáo chi tiết hoạt động lớp học, tình hình chấm điểm và tiến độ học tập của học sinh.
          </p>
        </div>
        <AnimatedAddButton
          onClick={() => {
            const { isComplete, missingFields } = checkTeacherProfileComplete(user);
            if (!isComplete) {
              setMissingProfileFields(missingFields);
              setShowProfileWarningModal(true);
              return;
            }
            setShowModal(true);
          }}
          icon={<Plus size={20} weight="bold" className="shrink-0" />}
        >
          Tạo lớp mới
        </AnimatedAddButton>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: Total Classes */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#e65100]">Tổng số lớp</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {stats?.totalClasses?.toLocaleString() || 0}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <BookOpen size={26} weight="duotone" className="text-[#f47c20]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#f47c20]">
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-bold">Lớp học đang phụ trách</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#e65100]/70">Cập nhật mới nhất học kỳ</p>
            </div>

            {/* Card 2: Total Students */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-cyan-50 to-cyan-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#006064]">Tổng học sinh</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {stats?.totalStudents?.toLocaleString() || 0}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Users size={26} weight="duotone" className="text-[#2f8fa3]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#2f8fa3]">
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-bold">Đang tham gia học tập</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#006064]/70">Sĩ số tất cả các lớp</p>
            </div>

            {/* Card 3: Attendance Rate */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-emerald-50 to-teal-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#047857]">Tỷ lệ đi học</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {`${stats?.attendanceRate ?? 0}%`}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckSquare size={26} weight="duotone" className="text-[#059669]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#059669]">
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-bold">Chuyên cần trung bình</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#047857]/70">Thống kê trên toàn bộ các lớp</p>
            </div>

            {/* Card 4: Pending Grades */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-rose-50 to-orange-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#be123c]">Bài tập cần chấm</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {stats?.pendingGrades?.toLocaleString() || 0}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Clipboard size={26} weight="duotone" className="text-[#e11d48]" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#be123c]">Đã nộp bài</span>
                  <span className="text-slate-800">{stats?.totalSubmitted || 0}/{stats?.totalExpectedSubmissions || 0} HS</span>
                </div>
                <div className="w-full h-2 bg-rose-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e11d48] rounded-full transition-all duration-500"
                    style={{ width: `${stats?.totalExpectedSubmissions ? Math.round(((stats?.totalSubmitted || 0) / stats.totalExpectedSubmissions) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Charts & Recent Activity */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Biểu đồ phổ điểm */}
        <Card className="xl:col-span-7 border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white p-2 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-6">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Biểu đồ phổ điểm học sinh</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">Thống kê phân bố học lực qua các bài kiểm tra</CardDescription>
            </div>
            <div className="w-44">
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold shadow-2xs h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Tất cả các lớp" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                  <SelectItem value="all" className="text-xs font-semibold text-slate-700 cursor-pointer">Tất cả các lớp</SelectItem>
                  {classrooms.map(c => (
                    <SelectItem key={c._id} value={c._id} className="text-xs font-semibold text-slate-700 cursor-pointer">{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-2 px-6">
            <ChartContainer config={scoreChartConfig} className="w-full h-[210px] mx-auto">
              <BarChart
                accessibilityLayer
                data={scoreChartData}
                layout="vertical"
                margin={{ right: 35, left: 10 }}
              >
                <CartesianGrid horizontal={false} vertical={true} strokeDasharray="3 3" stroke="#f1f5f9" />
                <YAxis
                  dataKey="level"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  hide
                />
                <XAxis dataKey="students" type="number" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} stroke="#94a3b8" />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-2xl px-3.5 py-2 font-semibold min-w-0"
                      formatter={(value, name, item) => (
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="text-slate-700 font-bold text-xs">{item.payload?.level || name}</span>
                          <span className="text-[#f47c20] font-extrabold text-xs ml-2 whitespace-nowrap">
                            {value} Học sinh
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="students" radius={6} maxBarSize={44} shape={isLoading || scoreStatsLoading ? <SkeletonBar /> : undefined}>
                  {!isLoading && !scoreStatsLoading && (
                    <>
                      <LabelList
                        dataKey="level"
                        position="insideLeft"
                        offset={14}
                        className="fill-white font-extrabold"
                        fontSize={12}
                      />
                      <LabelList
                        dataKey="students"
                        position="right"
                        offset={12}
                        className="fill-slate-800 font-extrabold"
                        fontSize={12}
                      />
                    </>
                  )}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* 4 Thống kê thang học lực */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/80 rounded-2xl p-3 text-center border border-emerald-200/80 shadow-2xs hover:shadow-sm transition-all">
                <div className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-0.5">Giỏi</div>
                <div className="text-emerald-800 font-black text-xl">{isLoading || scoreStatsLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.gioi}</div>
              </div>
              <div className="bg-blue-50/80 rounded-2xl p-3 text-center border border-blue-200/80 shadow-2xs hover:shadow-sm transition-all">
                <div className="text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-0.5">Khá</div>
                <div className="text-blue-800 font-black text-xl">{isLoading || scoreStatsLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.kha}</div>
              </div>
              <div className="bg-amber-50/80 rounded-2xl p-3 text-center border border-amber-200/80 shadow-2xs hover:shadow-sm transition-all">
                <div className="text-amber-700 text-[11px] font-bold uppercase tracking-wider mb-0.5">Trung bình</div>
                <div className="text-amber-800 font-black text-xl">{isLoading || scoreStatsLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.trungBinh}</div>
              </div>
              <div className="bg-rose-50/80 rounded-2xl p-3 text-center border border-rose-200/80 shadow-2xs hover:shadow-sm transition-all">
                <div className="text-rose-700 text-[11px] font-bold uppercase tracking-wider mb-0.5">Yếu / Kém</div>
                <div className="text-rose-800 font-black text-xl">{isLoading || scoreStatsLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.yeuKem}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs py-3 px-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-slate-600 font-semibold">Tỷ lệ học sinh đạt Khá / Giỏi toàn diện:</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-3 py-1 rounded-lg">
                {goodPassRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Hoạt động gần đây */}
        <Card className="xl:col-span-5 border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white p-2 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
            <div className="grid gap-1">
              <CardTitle className="text-lg font-bold text-slate-800">Hoạt động gần đây</CardTitle>
            </div>
          </CardHeader>

          <CardContent className={`grid gap-3 transition-all duration-300 ${showAllActivities ? 'max-h-[520px]' : 'max-h-[350px]'} overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#f47c20] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e0690d] px-4 pt-2 flex-1`}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <SkeletonAvatar key={`skeleton-avatar-${i}`} />
              ))
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className="flex items-start gap-3 p-3 rounded-2xl transition-all border border-transparent hover:bg-slate-50/80 hover:border-slate-100 group"
                >
                  <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 shadow-2xs flex-shrink-0">
                    <Clipboard size={18} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0 grid gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#f47c20] transition-colors truncate">
                        {activity.user}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                        {activity.time}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">
                      {activity.action}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">Chưa có hoạt động nào gần đây.</div>
            )}
          </CardContent>

          <CardFooter className="pt-3 pb-2 px-4 border-t border-slate-100/80 bg-white rounded-b-3xl">
            <PrimaryButton
              variant="default"
              className="w-full text-xs py-2.5 rounded-2xl shadow-xs justify-center font-bold tracking-wide flex items-center gap-2"
              onClick={() => setShowAllActivities(!showAllActivities)}
            >
              <ArrowUpRight size={18} weight="bold" className={`shrink-0 transition-transform duration-300 ${showAllActivities ? 'rotate-90' : ''}`} />
              <span>{showAllActivities ? "Thu gọn bớt" : "Xem tất cả"}</span>
            </PrimaryButton>
          </CardFooter>
        </Card>
      </div>

      {/* Widgets Grid: Lịch dạy hôm nay & Cảnh báo học sinh */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LỊCH DẠY HÔM NAY */}
        <Card className="border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white p-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-6 border-b border-slate-100">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Lịch dạy sắp tới</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">Danh sách các lớp có lịch dạy trong tuần</CardDescription>
            </div>
            <PrimaryButton variant="outline" size="sm" className="font-bold text-xs text-slate-700 bg-white border border-slate-200/80 shadow-2xs rounded-xl" onClick={() => navigate("/schedule")}>
              Xem toàn bộ lịch
            </PrimaryButton>
          </CardHeader>

          <CardContent className="p-4 pt-3">
            {isLoadingSchedules ? (
              <div className="space-y-4">
                <SkeletonAvatar />
                <SkeletonAvatar />
              </div>
            ) : (() => {
              const currentJSday = new Date().getDay();
              const todayDayOfWeek = currentJSday === 0 ? 7 : currentJSday;

              const sortedSchedules = [...schedules].sort((a, b) => {
                if (a.dayOfWeek === b.dayOfWeek) {
                  return a.startTime.localeCompare(b.startTime);
                }
                const aDist = (a.dayOfWeek - todayDayOfWeek + 7) % 7;
                const bDist = (b.dayOfWeek - todayDayOfWeek + 7) % 7;
                return aDist - bDist;
              });

              const upcomingSchedules = sortedSchedules.slice(0, 5);

              if (upcomingSchedules.length === 0) {
                return <div className="p-8 text-center text-slate-500 font-medium text-xs">Bạn chưa có lịch dạy nào.</div>;
              }

              return (
                <div className="divide-y divide-slate-100/80">
                  {upcomingSchedules.map((schedule, idx) => {
                    const isToday = schedule.dayOfWeek === todayDayOfWeek;
                    const dayText = schedule.dayOfWeek === 7 ? "Chủ nhật" : `Thứ ${schedule.dayOfWeek + 1}`;
                    return (
                      <div key={schedule._id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className={`min-w-[76px] h-[56px] px-2 flex flex-col items-center justify-center rounded-2xl border ${isToday ? 'bg-orange-50/90 border-orange-200 text-orange-600 shadow-2xs' : 'bg-slate-50 border-slate-200/80 text-slate-600'}`}>
                            <span className="text-[10px] font-extrabold uppercase whitespace-nowrap">{isToday ? 'Hôm nay' : dayText}</span>
                            <span className="text-[14px] font-black">{schedule.startTime}</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{schedule.classId?.name || "Lớp học ẩn"}</h4>
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1"><BookOpen size={13} className="text-orange-500" /> Môn: {schedule.subject}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><CheckSquare size={13} className="text-emerald-500" /> Kết thúc: {schedule.endTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 flex gap-2 justify-end">
                          <PrimaryButton variant="secondary" size="sm" className="font-bold text-xs text-slate-700 bg-white border border-slate-200/80 shadow-2xs rounded-xl hover:bg-slate-50">Vào lớp</PrimaryButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* CẢNH BÁO HỌC SINH */}
        <Card className="border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white p-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
                <WarningCircle size={20} weight="fill" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Cảnh báo học sinh</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">Học sinh vắng nhiều hoặc điểm dưới trung bình</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-3">
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonAvatar />
                <SkeletonAvatar />
              </div>
            ) : (!atRiskStudents || atRiskStudents.length === 0) ? (
              <div className="p-8 text-center text-emerald-600 font-bold text-xs bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
                🎉 Tuyệt vời! Không có học sinh nào trong diện cảnh báo.
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {atRiskStudents.map((student, idx) => (
                  <div key={student.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={student.avatar} alt={student.name} className="h-10 w-10 rounded-full border border-slate-200 object-cover shadow-2xs" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Lớp: <strong className="text-slate-700">{student.className}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center justify-end gap-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${student.severity === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200/90 shadow-2xs' : 'bg-amber-50 text-amber-700 border-amber-200/90 shadow-2xs'}`}>
                        {student.issue}
                      </span>
                      <PrimaryButton
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200/80 shadow-2xs rounded-xl gap-1.5 transition-all"
                        disabled={sendingWarning === student.id}
                        onClick={() => handleSendWarning(student)}
                      >
                        <BellRinging size={14} weight="fill" />
                        {sendingWarning === student.id ? "Đang gửi..." : "Cảnh báo"}
                      </PrimaryButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* POPUP MODAL GIÁO VIÊN TẠO LỚP MỚI */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[440px] bg-white rounded-3xl p-6">
          <form onSubmit={handleCreateClass}>
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-slate-900">Tạo Lớp Học Mới</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Nhập thông tin tên và môn học để khởi tạo lớp học mới cho giáo viên.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="modalClassName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tên lớp học</Label>
                <Input
                  id="modalClassName"
                  placeholder="Ví dụ: Lớp Toán 10A"
                  value={newClass.className}
                  onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                  className="rounded-xl text-xs py-2 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modalSubject" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Môn học / Chủ đề</Label>
                <Input
                  id="modalSubject"
                  placeholder="Ví dụ: Toán học - Đại Số"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="rounded-xl text-xs py-2 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <PrimaryButton type="button" variant="outline" className="rounded-xl text-xs font-bold text-slate-600" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </PrimaryButton>
              <AnimatedAddButton type="submit">Xác nhận tạo</AnimatedAddButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CẢNH BÁO HOÀN THIỆN HỒ SƠ */}
      <ProfileWarningModal
        isOpen={showProfileWarningModal}
        onClose={() => setShowProfileWarningModal(false)}
        missingFields={missingProfileFields}
      />
    </div>
  );
}
