import React, { useState, useEffect } from "react";
import {
  DownloadSimple,
  Users,
  ChalkboardTeacher,
  Chalkboard,
  Activity,
  Gear,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  FolderSimplePlus,
  FileText,
  Megaphone
} from "phosphor-react";
import { Bar, BarChart, CartesianGrid, Cell, Label, Legend, Pie, PieChart, Sector, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../../../components/Styles/ToastContext";
import { dashboardService, type IDashboardStats } from "../../../service/dashboard.service";
import { AnimatedAddButton } from "../../../components/ui/Buttons/AnimatedAddButton";
import { ChartBarStacked } from "@/components/ui/ChartBarStacked";
import { io } from "socket.io-client";

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

const fakeTeacherStats = [
  { teacher: "", subject: "", classes: [{ className: "Lớp A", students: 30 }, { className: "Lớp B", students: 40 }] },
  { teacher: "", subject: "", classes: [{ className: "Lớp A", students: 20 }, { className: "Lớp B", students: 20 }] },
  { teacher: "", subject: "", classes: [{ className: "Lớp A", students: 10 }, { className: "Lớp B", students: 30 }] },
];

const fakeChartData = [
  { month: "Tháng 3", students: 45, teachers: 5 },
  { month: "Tháng 4", students: 78, teachers: 8 },
  { month: "Tháng 5", students: 110, teachers: 12 },
  { month: "Tháng 6", students: 160, teachers: 15 },
  { month: "Tháng 7", students: 210, teachers: 18 },
  { month: "Tháng 8", students: 265, teachers: 22 },
];

const distinctClassColors = [
  { hex: "#f47c20", bg: "bg-orange-50/90", border: "border-orange-200/80", text: "text-orange-700", dot: "bg-[#f47c20]" },
  { hex: "#2f8fa3", bg: "bg-cyan-50/90", border: "border-cyan-200/80", text: "text-cyan-700", dot: "bg-[#2f8fa3]" },
  { hex: "#059669", bg: "bg-emerald-50/90", border: "border-emerald-200/80", text: "text-emerald-700", dot: "bg-[#059669]" },
  { hex: "#7c3aed", bg: "bg-purple-50/90", border: "border-purple-200/80", text: "text-purple-700", dot: "bg-[#7c3aed]" },
  { hex: "#d97706", bg: "bg-amber-50/90", border: "border-amber-200/80", text: "text-amber-700", dot: "bg-[#d97706]" },
  { hex: "#ec4899", bg: "bg-pink-50/90", border: "border-pink-200/80", text: "text-pink-700", dot: "bg-[#ec4899]" },
  { hex: "#2563eb", bg: "bg-blue-50/90", border: "border-blue-200/80", text: "text-blue-700", dot: "bg-[#2563eb]" },
  { hex: "#e11d48", bg: "bg-rose-50/90", border: "border-rose-200/80", text: "text-rose-700", dot: "bg-[#e11d48]" },
  { hex: "#4f46e5", bg: "bg-indigo-50/90", border: "border-indigo-200/80", text: "text-indigo-700", dot: "bg-[#4f46e5]" },
  { hex: "#0d9488", bg: "bg-teal-50/90", border: "border-teal-200/80", text: "text-teal-700", dot: "bg-[#0d9488]" }
];

const SkeletonBar = (props: any) => {
  const { x, y, width, height } = props;
  return <rect x={x} y={y} width={width} height={height} className="animate-pulse fill-slate-200" rx={4} ry={4} />;
};

function TeacherChartCard({ teacher, tIndex, isLoading = false }: { teacher: any; tIndex: number, isLoading?: boolean }) {
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const cardThemes = [
    {
      btnBg: "bg-cyan-50/80 hover:bg-cyan-100/90 border-cyan-100/80 text-[#2f8fa3] hover:text-[#257586]",
      dotBg: "bg-[#2f8fa3]",
      emptyHoverBorder: "hover:border-[#2f8fa3]/50",
      emptyIconHover: "group-hover/empty:text-[#2f8fa3]"
    },
    {
      btnBg: "bg-orange-50/80 hover:bg-orange-100/90 border-orange-100/80 text-[#f47c20] hover:text-[#d96b18]",
      dotBg: "bg-[#f47c20]",
      emptyHoverBorder: "hover:border-[#f47c20]/50",
      emptyIconHover: "group-hover/empty:text-[#f47c20]"
    },
    {
      btnBg: "bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-100/80 text-[#059669] hover:text-[#047857]",
      dotBg: "bg-[#059669]",
      emptyHoverBorder: "hover:border-[#059669]/50",
      emptyIconHover: "group-hover/empty:text-[#059669]"
    }
  ];

  const currentTheme = cardThemes[tIndex % cardThemes.length];

  const chartConfig: ChartConfig = {
    students: { label: "Học sinh" }
  };

  const activeClassesWithStudents = (teacher.classes || []).filter((cls: any) => cls.students > 0);

  const chartData = activeClassesWithStudents.map((cls: any, index: number) => {
    const key = `class_${index}`;
    const classColor = distinctClassColors[(tIndex * 5 + index) % distinctClassColors.length];
    const color = isLoading ? "#e2e8f0" : classColor.hex;
    chartConfig[key] = {
      label: cls.className,
      color: color,
    };
    return {
      classKey: key,
      students: cls.students,
      fill: color,
    };
  });

  const totalStudents = (teacher.classes || []).reduce((acc: any, curr: any) => acc + (curr.students || 0), 0);

  return (
    <Card key={tIndex} className="flex flex-col overflow-hidden border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white">
      <CardHeader className="items-center pb-0 pt-6">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </>
        ) : (
          <>
            <CardTitle className="text-slate-800 font-bold text-lg capitalize">{teacher.teacher}</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Môn: {teacher.subject}</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col items-center justify-center min-h-[250px]">
        {isLoading ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="students"
                nameKey="classKey"
                innerRadius={60}
                strokeWidth={0}
              />
            </PieChart>
          </ChartContainer>
        ) : totalStudents === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 my-auto w-full">
            {/* Dashed Donut Ring Empty State */}
            <div className={`w-36 h-36 rounded-full border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-3 text-center transition-all ${currentTheme.emptyHoverBorder} group/empty shadow-2xs`}>
              <div className={`w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-2xs mb-1 text-slate-400 ${currentTheme.emptyIconHover} group-hover/empty:scale-110 transition-all`}>
                <Users size={20} weight="duotone" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight">Chưa có học sinh</span>
              <span className="text-[9.5px] font-medium text-slate-400 mt-0.5">Đang chờ cập nhật</span>
            </div>

            {/* List of class chips taught by teacher */}
            {teacher.classes && teacher.classes.length > 0 && (
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 max-w-[260px]">
                {teacher.classes.map((cls: any, cIdx: number) => {
                  const classColor = distinctClassColors[(tIndex * 5 + cIdx) % distinctClassColors.length];
                  return (
                    <span
                      key={`chip-${cIdx}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${classColor.bg} border ${classColor.border} text-[11px] font-bold ${classColor.text} shadow-2xs hover:scale-[1.04] transition-all`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${classColor.dot}`} />
                      {cls.className}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[250px] w-full max-w-[250px] mx-auto"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="students"
                nameKey="classKey"
                innerRadius={60}
                outerRadius={85}
                strokeWidth={0}
                shape={(props: any) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
                  const isActive = activeIndex === index;
                  const isHoveringAny = activeIndex !== -1;
                  const RADIAN = Math.PI / 180;
                  const midAngle = (startAngle + endAngle) / 2;
                  const tx = isActive ? Math.cos(-RADIAN * midAngle) * 16 : 0;
                  const ty = isActive ? Math.sin(-RADIAN * midAngle) * 16 : 0;

                  return (
                    <g
                      className={isLoading ? "animate-pulse" : ""}
                      style={{
                        transform: `translate(${tx}px, ${ty}px)`,
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        opacity: isHoveringAny && !isActive ? 0.4 : 1,
                        filter: isActive && !isLoading ? 'drop-shadow(0px 8px 15px rgba(0,0,0,0.15))' : 'none',
                        cursor: isLoading ? 'default' : 'pointer'
                      }}
                    >
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        cornerRadius={6}
                      />
                    </g>
                  );
                }}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                ))}
                {isLoading ? undefined : (
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-slate-900 text-3xl font-extrabold"
                            >
                              {totalStudents.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-slate-500 font-medium text-xs"
                            >
                              Học sinh
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                )}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 border-t-0 bg-transparent">
        {isLoading ? (
          <Skeleton className="h-10 w-full rounded-2xl" />
        ) : (
          <button className={`group w-full py-2.5 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-2xs hover:shadow-sm hover:scale-[1.01] ${currentTheme.btnBg}`}>
            <span>Đang quản lý {teacher.classes.length} lớp học</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getAdminStats();
        if (res.data) {
          setStats(res.data);
        }
      } catch (error: any) {
        toast.error("Không thể tải dữ liệu thống kê: " + error.message, 3000);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();

    // Kết nối Socket.IO Real-time
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const socket = io(backendUrl, {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('⚡ [AdminDashboard] Đã kết nối Socket.IO Real-time!');
    });

    socket.on('admin_stats_update', () => {
      console.log('🔄 [AdminDashboard] Nhận sự kiện admin_stats_update -> Nạp lại thống kê...');
      fetchStats();
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const handleExportReport = () => {
    toast.success("Đang tải xuống báo cáo hệ thống...", 3000);

    const bom = "\uFEFF";
    const csvContent = `STT;Tên chỉ số;Giá trị;Tăng trưởng\n1;Tổng học sinh;${stats?.totalStudents || 0};0%\n2;Tổng giáo viên;${stats?.totalTeachers || 0};0%\n3;Lớp đang hoạt động;${stats?.activeClasses || 0};0\n4;Tỷ lệ điểm danh toàn hệ thống;${stats?.attendanceRate ?? 0}%;0%`;

    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Bao_Cao_He_Thong_Classroom.csv");
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 bg-slate-50/50 min-h-screen w-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#f47c20]">
            Tổng quan hệ thống
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Báo cáo tổng hợp số liệu và chỉ số hoạt động toàn bộ nền tảng ClassRoom.
          </p>
        </div>
        <AnimatedAddButton
          onClick={handleExportReport}
          icon={<DownloadSimple size={20} weight="bold" className="shrink-0" />}
        >
          Xuất báo cáo
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
            {/* Card 1: Total Students */}
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
                <span className="text-xs font-bold">Tăng trưởng ổn định</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#006064]/70">Số liệu thống kê tháng này</p>
            </div>

            {/* Card 2: Total Teachers */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#e65100]">Tổng giáo viên</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {stats?.totalTeachers?.toLocaleString() || 0}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ChalkboardTeacher size={26} weight="duotone" className="text-[#f47c20]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#f47c20]">
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-bold">Tuyển dụng thêm</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#e65100]/70">Giáo viên tham gia hệ thống</p>
            </div>

            {/* Card 3: Active Classes */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-sky-50 to-teal-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#00838f]">Lớp đang hoạt động</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {stats?.activeClasses?.toLocaleString() || 0}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Chalkboard size={26} weight="duotone" className="text-[#00acc1]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#00838f]">
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-bold">Lớp học mới</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#00838f]/70">Được tạo trong tuần này</p>
            </div>

            {/* Card 4: Attendance Rate */}
            <div className="rounded-3xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-gradient-to-br from-rose-50 to-orange-100/60 border-none">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#bf360c]">Tỷ lệ điểm danh hôm nay</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  {`${stats?.attendanceRate ?? 0}%`}
                </p>
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Activity size={26} weight="duotone" className="text-[#ff7043]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#d84315]">
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-bold">Học sinh có mặt hôm nay</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-[#bf360c]/70">Ghi nhận trên toàn hệ thống</p>
            </div>
          </>
        )}
      </div>


      {/* Main Charts & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* User Growth Stacked Bar Chart Component */}
        <ChartBarStacked
          data={stats?.userGrowthData}
          isLoading={isLoading}
          className="lg:col-span-3"
        />

        {/* Recent Activity List */}
        <Card className="lg:col-span-2 border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white p-2 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center pb-2 pt-4 px-6">
            <div className="grid gap-1">
              <CardTitle className="text-lg font-bold text-slate-800">Hoạt động gần đây</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#f47c20] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e0690d] px-4 pt-2 flex-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonAvatar key={`skeleton-avatar-${i}`} />
              ))
            ) : (
              (stats?.recentActions || []).map((item) => {
                const renderActivityIcon = (type?: string) => {
                  switch (type) {
                    case 'create_class':
                    case 'classroom':
                      return (
                        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs flex-shrink-0">
                          <ChalkboardTeacher size={20} weight="duotone" />
                        </div>
                      );
                    case 'assignment':
                      return (
                        <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs flex-shrink-0">
                          <BookOpen size={20} weight="duotone" />
                        </div>
                      );
                    case 'quiz':
                      return (
                        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs flex-shrink-0">
                          <FileText size={20} weight="duotone" />
                        </div>
                      );
                    case 'attendance':
                      return (
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs flex-shrink-0">
                          <CalendarCheck size={20} weight="duotone" />
                        </div>
                      );
                    case 'file':
                    case 'resource':
                      return (
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs flex-shrink-0">
                          <FolderSimplePlus size={20} weight="duotone" />
                        </div>
                      );
                    default:
                      return (
                        <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs flex-shrink-0">
                          <Megaphone size={20} weight="duotone" />
                        </div>
                      );
                  }
                };

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100 group"
                  >
                    {renderActivityIcon(item.actionType)}
                    <div className="flex-1 min-w-0 grid gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-[#f47c20] transition-colors truncate">
                          {item.teacherName || item.user}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 leading-normal flex items-center gap-1 flex-wrap mt-0.5">
                        <span>{item.actionText || item.action}</span>
                        {item.className && item.className !== 'Hệ thống' && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-500 text-[11px]">cho lớp</span>
                            <span className="font-bold text-slate-800 bg-slate-100/90 border border-slate-200/60 px-1.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                              {item.className}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
          <CardFooter className="pt-3 pb-2 px-4 border-t border-slate-100/80 bg-white rounded-b-3xl">
            <AnimatedAddButton
              icon={<ArrowUpRight size={18} weight="bold" className="shrink-0" />}
              className="w-full text-xs py-2 rounded-2xl shadow-xs justify-center font-bold tracking-wide"
            >
              Xem tất cả
            </AnimatedAddButton>
          </CardFooter>
        </Card>
      </div>

      {/* Teacher Stats Pie Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          fakeTeacherStats.map((teacher, tIndex) => (
            <TeacherChartCard key={`skeleton-card-${tIndex}`} teacher={teacher} tIndex={tIndex} isLoading={true} />
          ))
        ) : stats?.teacherStudentStats?.length ? (
          stats.teacherStudentStats.map((teacher, tIndex) => (
            <TeacherChartCard key={tIndex} teacher={teacher} tIndex={tIndex} />
          ))
        ) : (
          <div className="col-span-full text-center text-slate-400 font-medium py-10">
            Chưa có dữ liệu thống kê học sinh của giáo viên.
          </div>
        )}
      </div>
    </div>
  );
}
