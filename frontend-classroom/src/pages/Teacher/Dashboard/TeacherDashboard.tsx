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
} from "phosphor-react";
import { createMockClassroom, } from "../../../utils/mockDb";
import type { Classroom } from "../../../utils/mockDb";
import { useToast } from "../../../components/Styles/ToastContext";
import { dashboardService } from "../../../service/dashboard.service";
import type { ITeacherDashboardStats } from "../../../service/dashboard.service";
import { scheduleService } from "../../../service/schedule.service";
import type { ISchedule } from "../../../service/schedule.service";
import { notificationService } from "../../../service/notification.service";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  LabelList
} from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
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
    </div>
  )
}

const SkeletonBar = (props: any) => {
  const { x, y, width, height } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#e2e8f0" rx={4} ry={4} />
    </g>
  );
};

import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

import styles from "./TeacherDashboard.module.scss";

interface ScoreStats {
  gioi: number;
  kha: number;
  trungBinh: number;
  yeuKem: number;
}


export default function TeacherDashboard() {
  const toast = useToast();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(320);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({ className: "", subject: "" });

  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [scoreStats, setScoreStats] = useState<ScoreStats>({ gioi: 142, kha: 110, trungBinh: 68, yeuKem: 12 });

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ITeacherDashboardStats["stats"] | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<ITeacherDashboardStats["atRiskStudents"]>([]);
  const [sendingWarning, setSendingWarning] = useState<string | null>(null); // studentId đang gửi

  // Schedules State
  const [schedules, setSchedules] = useState<ISchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getTeacherDashboardStats();
      // Thêm độ trễ 1 giây để quan sát được hiệu ứng Skeleton (Loading)
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (res.data) {
        setStats(res.data.stats);
        setScoreStats(res.data.scoreDistribution);
        setTrendData(res.data.trendData || []);
        setRecentActivities(res.data.recentActivities || []);
        setAtRiskStudents(res.data.atRiskStudents || []);
        // Map classes to the Classroom mock structure for dropdown
        const mappedClasses = res.data.classes.map(c => ({
          _id: c._id,
          className: c.className,
          subject: c.subject || 'Môn học',
          classCode: '',
          teacherId: '',
          createdAt: ''
        }));
        setClassrooms(mappedClasses);
        setTotalStudents(res.data.stats.totalStudents);
      }
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu thống kê!");
    } finally {
      setIsLoading(false);
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
    loadData();
    loadSchedules();

    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("open-new-class-modal", handleOpenModal);

    return () => {
      window.removeEventListener("open-new-class-modal", handleOpenModal);
    };
  }, []);

  // Optional: filtering logic can be implemented if the backend supports passing classId
  // For now, it shows overall stats since we don't have a specific class filter endpoint yet.
  useEffect(() => {
    if (selectedClassFilter !== "all") {
      // Could fetch stats for a specific class here
    }
  }, [selectedClassFilter]);

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

  const maxScoreVal = Math.max(scoreStats.gioi, scoreStats.kha, scoreStats.trungBinh, scoreStats.yeuKem, 1);
  const getBarHeight = (val: number) => `${(val / maxScoreVal) * 100}%`;

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

  return (
    <div className="flex flex-col gap-6 p-2">

      {/* 1. KHỐI THẺ THỐNG KÊ (TEACHER STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số lớp</CardTitle>
                <BookOpen className="h-5 w-5 text-orange-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{isLoading ? "..." : stats?.totalClasses || 0}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Lớp học đang quản lý <ArrowUpRight className="h-4 w-4 text-orange-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Cập nhật mới nhất
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Học sinh</CardTitle>
                <Users className="h-5 w-5 text-blue-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{isLoading ? "..." : stats?.totalStudents || 0}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Tổng số đang tham gia <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Của tất cả các lớp
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chuyên cần</CardTitle>
                <CheckSquare className="h-5 w-5 text-emerald-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{isLoading ? "..." : `${stats?.attendanceRate || 0}%`}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Tỷ lệ đi học <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Trung bình các lớp
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bài tập cần chấm</CardTitle>
                <Clipboard className="h-5 w-5 text-red-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{isLoading ? "..." : stats?.pendingGrades || 0}</div>
                <div className="mt-4 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Đã nộp</span>
                    <span className="text-slate-900 font-bold">{stats?.totalSubmitted || 0}/{stats?.totalExpectedSubmissions || 0} học sinh</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${stats?.totalExpectedSubmissions ? Math.round(((stats?.totalSubmitted || 0) / stats.totalExpectedSubmissions) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 2. KHỐI PHÂN TÍCH VÀ FEED HOẠT ĐỘNG (TEACHER GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Biểu đồ phổ điểm */}
        <Card className="lg:col-span-2 flex flex-col pt-0 gap-0 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 bg-primary text-white rounded-t-xl">
            <div>
              <CardTitle className="text-white">Biểu đồ phổ điểm</CardTitle>
              <CardDescription className="text-white/80">Thống kê kết quả học kỳ 1</CardDescription>
            </div>
            <div className="w-48">
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger className="w-full bg-white text-slate-900 border-none shadow-sm h-9">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-48">
                  <SelectItem value="all">Tất cả các lớp</SelectItem>
                  {classrooms.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-4">
            <ChartContainer config={scoreChartConfig} className="w-full h-[200px] mx-auto">
              <BarChart
                accessibilityLayer
                data={scoreChartData}
                layout="vertical"
                margin={{ right: 30 }}
              >
                <CartesianGrid horizontal={false} vertical={true} strokeDasharray="3 3" />
                <YAxis
                  dataKey="level"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  hide
                />
                <XAxis dataKey="students" type="number" tickLine={false} axisLine={false} fontSize={12} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="students" radius={4} maxBarSize={48} shape={isLoading ? <SkeletonBar /> : undefined}>
                  {!isLoading && (
                    <>
                      <LabelList
                        dataKey="level"
                        position="insideLeft"
                        offset={12}
                        className="fill-white font-medium"
                        fontSize={13}
                      />
                      <LabelList
                        dataKey="students"
                        position="right"
                        offset={12}
                        className="fill-foreground font-bold"
                        fontSize={13}
                      />
                    </>
                  )}
                </Bar>
              </BarChart>
            </ChartContainer>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-emerald-600 text-xs font-bold uppercase mb-1">Giỏi</div>
                <div className="text-emerald-700 font-black text-xl">{isLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.gioi}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-blue-600 text-xs font-bold uppercase mb-1">Khá</div>
                <div className="text-blue-700 font-black text-xl">{isLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.kha}</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-orange-600 text-xs font-bold uppercase mb-1">Trung bình</div>
                <div className="text-orange-700 font-black text-xl">{isLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.trungBinh}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-red-600 text-xs font-bold uppercase mb-1">Yếu/Kém</div>
                <div className="text-red-700 font-black text-xl">{isLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : scoreStats.yeuKem}</div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm pt-4 border-t border-slate-100">
              <span className="text-slate-600 font-semibold">Tỷ lệ đạt Khá / Giỏi</span>
              <span className="font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                {scoreStats.gioi + scoreStats.kha + scoreStats.trungBinh + scoreStats.yeuKem === 0 ? 0 : Math.round(((scoreStats.gioi + scoreStats.kha) / (scoreStats.gioi + scoreStats.kha + scoreStats.trungBinh + scoreStats.yeuKem)) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Hoạt động gần đây */}
        <Card className="flex flex-col pt-0 gap-0 border-primary/20">
          <CardHeader className="pb-4 pt-5 bg-primary text-white rounded-t-xl">
            <CardTitle className="text-white">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors pr-4 pt-6 pb-2">
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-4">
              {isLoading ? (
                <div className="space-y-6 pl-4 pt-4">
                  <SkeletonAvatar />
                  <SkeletonAvatar />
                  <SkeletonAvatar />
                </div>
              ) : recentActivities.length > 0 ? recentActivities.map((activity, idx) => (
                <div key={activity.id || idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-primary ring-4 ring-white"></span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={activity.avatar} alt={activity.user} className="h-6 w-6 rounded-full border border-slate-200 shadow-sm object-cover" />
                        <span className="text-sm font-bold text-slate-900">{activity.user}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{activity.time}</span>
                    </div>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm relative mt-1">
                      {/* Speech bubble arrow */}
                      <span className="absolute -top-[6px] left-4 w-3 h-3 bg-slate-50 border-t border-l border-slate-100 rotate-45"></span>
                      {activity.action}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="pl-6 text-sm text-slate-500 font-medium pb-2">Chưa có hoạt động nào gần đây.</div>
              )}
            </div>
          </CardContent>
          <div className="p-4 pt-0 mt-auto">
            <PrimaryButton variant="outline" className="w-full">Xem tất cả</PrimaryButton>
          </div>
        </Card>
      </div>

      {/* 3. WIDGET GRID (LỊCH DẠY + CẢNH BÁO HỌC SINH) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LỊCH DẠY HÔM NAY */}
        <Card className="pt-0 gap-0 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 bg-primary text-white rounded-t-xl border-b border-primary/20">
            <div>
              <CardTitle className="text-white">Lịch dạy hôm nay</CardTitle>
              <CardDescription className="text-white/80 mt-1">Danh sách các lớp bạn có lịch dạy trong ngày hôm nay</CardDescription>
            </div>
            <PrimaryButton variant="outline" size="sm" className="font-semibold text-slate-600" onClick={() => navigate("/schedule")}>
              Xem toàn bộ lịch
            </PrimaryButton>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSchedules ? (
              <div className="p-6 space-y-6 divide-y divide-slate-100">
                <SkeletonAvatar />
                <SkeletonAvatar />
                <SkeletonAvatar />
              </div>
            ) : (() => {
              const currentJSday = new Date().getDay();
              // Map JS getDay (0=Sun, 1=Mon...) to backend dayOfWeek (1=Mon, 2=Tue... 7 = Sun)
              const todayDayOfWeek = currentJSday === 0 ? 7 : currentJSday;

              // To ensure the widget isn't empty in case DB uses different logic or there are no classes today,
              // we will sort schedules by upcoming day (starting from today).
              const sortedSchedules = [...schedules].sort((a, b) => {
                if (a.dayOfWeek === b.dayOfWeek) {
                  return a.startTime.localeCompare(b.startTime);
                }
                // Sort starting from today's dayOfWeek
                const aDist = (a.dayOfWeek - todayDayOfWeek + 7) % 7;
                const bDist = (b.dayOfWeek - todayDayOfWeek + 7) % 7;
                return aDist - bDist;
              });

              // Lấy tối đa 5 lịch sắp tới
              const upcomingSchedules = sortedSchedules.slice(0, 5);

              if (upcomingSchedules.length === 0) {
                return <div className="p-8 text-center text-slate-500 font-medium">Bạn chưa có lịch dạy nào.</div>;
              }

              return (
                <div className="divide-y divide-slate-100">
                  {upcomingSchedules.map((schedule, idx) => {
                    const isToday = schedule.dayOfWeek === todayDayOfWeek;
                    const dayText = schedule.dayOfWeek === 7 ? "Chủ nhật" : `Thứ ${schedule.dayOfWeek + 1}`;
                    return (
                      <div key={schedule._id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`min-w-[72px] h-[60px] px-2 flex flex-col items-center justify-center rounded-xl border ${isToday ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            <span className="text-[10px] font-bold uppercase whitespace-nowrap">{isToday ? 'Hôm nay' : dayText}</span>
                            <span className="text-[15px] font-black">{schedule.startTime}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{schedule.classId?.name || "Lớp học ẩn"}</h4>
                            <div className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1"><BookOpen size={14} /> Môn: {schedule.subject}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><CheckSquare size={14} /> {schedule.endTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 flex gap-2 justify-end">
                          <PrimaryButton variant="secondary" size="sm" className="font-bold text-slate-700 bg-white border border-slate-200 shadow-sm">Vào lớp</PrimaryButton>
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
        <Card className="pt-0 gap-0 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 bg-red-500 text-white rounded-t-xl border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <WarningCircle size={24} weight="fill" className="text-white" />
              <div>
                <CardTitle className="text-white">Cảnh báo học sinh</CardTitle>
                <CardDescription className="text-white/80 mt-1">Vắng nhiều hoặc điểm dưới trung bình</CardDescription>
              </div>
            </div>

          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-6 divide-y divide-slate-100">
                <SkeletonAvatar />
                <SkeletonAvatar />
                <SkeletonAvatar />
              </div>
            ) : (!atRiskStudents || atRiskStudents.length === 0) ? (
              <div className="p-8 text-center text-emerald-600 font-medium">Không có học sinh nào trong diện cảnh báo. Tuyệt vời!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {atRiskStudents.map((student, idx) => (
                  <div key={student.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={student.avatar} alt={student.name} className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-[15px]">{student.name}</h4>
                        <div className="text-sm text-slate-500 font-medium mt-0.5">
                          Lớp: {student.className}
                        </div>
                      </div>
                    </div>
                      <div className="mt-3 sm:mt-0 flex items-center justify-end gap-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${student.severity === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {student.issue}
                        </span>
                        <PrimaryButton
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-500 border border-red-200 shadow-sm gap-1 transition-colors"
                          disabled={sendingWarning === student.id}
                          onClick={() => handleSendWarning(student)}
                        >
                          <BellRinging size={13} weight="fill" />
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateClass}>
            <DialogHeader>
              <DialogTitle>Tạo Lớp Học Mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin tên và môn học để tạo lớp mới.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="modalClassName">Tên lớp học</Label>
                <Input
                  id="modalClassName"
                  placeholder="Ví dụ: Lớp Toán 10A"
                  value={newClass.className}
                  onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modalSubject">Môn học / Chủ đề</Label>
                <Input
                  id="modalSubject"
                  placeholder="Ví dụ: Toán học - Đại Số"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <PrimaryButton type="button" variant="outline" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </PrimaryButton>
              <PrimaryButton type="submit">Xác nhận tạo</PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
