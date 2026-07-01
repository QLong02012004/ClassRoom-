import React, { useState, useEffect } from "react";
import {
  DownloadSimple,
  Users,
  ChalkboardTeacher,
  Chalkboard,
  Activity,
  Gear,
  ArrowUpRight
} from "phosphor-react";
import { Area, AreaChart, Bar, BarChart, Tooltip as RechartsTooltip, XAxis, CartesianGrid, YAxis, Label, Pie, PieChart, Sector, ComposedChart, Line, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../../../components/Styles/ToastContext";
import { dashboardService, type IDashboardStats } from "../../../service/dashboard.service";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";



function StatCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-8 rounded-full" />
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
  )
}

const fakeTeacherStats = [
  { teacher: "", subject: "", classes: [{ className: "Lớp A", students: 30 }, { className: "Lớp B", students: 40 }] },
  { teacher: "", subject: "", classes: [{ className: "Lớp A", students: 20 }, { className: "Lớp B", students: 20 }] },
  { teacher: "", subject: "", classes: [{ className: "Lớp A", students: 10 }, { className: "Lớp B", students: 30 }] },
];

const fakeChartData = [
  { name: "Giáo viên 1", assignments: 12, averageScore: 8 },
  { name: "Giáo viên 2", assignments: 6, averageScore: 5 },
  { name: "Giáo viên 3", assignments: 15, averageScore: 9 },
];

const SkeletonBar = (props: any) => {
  const { x, y, width, height } = props;
  return <rect x={x} y={y} width={width} height={height} className="animate-pulse fill-slate-200" rx={4} ry={4} />;
};

function TeacherChartCard({ teacher, tIndex, isLoading = false }: { teacher: any; tIndex: number, isLoading?: boolean }) {
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const chartConfig: ChartConfig = {
    students: { label: "Học sinh" }
  };

  const chartData = teacher.classes.map((cls: any, index: number) => {
    const key = `class_${index}`;
    chartConfig[key] = {
      label: cls.className,
      color: isLoading ? "#e2e8f0" : `var(--chart-${(index % 5) + 1})`,
    };
    return {
      classKey: key,
      students: cls.students,
      fill: isLoading ? "#e2e8f0" : `var(--color-${key})`,
    };
  });

  const totalStudents = chartData.reduce((acc: any, curr: any) => acc + curr.students, 0);

  return (
    <Card key={tIndex} className="flex flex-col overflow-hidden border-none shadow-md">
      <CardHeader className="items-center pb-0 pt-6">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </>
        ) : (
          <>
            <CardTitle>{teacher.teacher}</CardTitle>
            <CardDescription>Môn: {teacher.subject}</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
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
              strokeWidth={5}
              shape={(props: any) => {
                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
                const isActive = activeIndex === index;
                const isHoveringAny = activeIndex !== -1;
                const RADIAN = Math.PI / 180;
                const midAngle = (startAngle + endAngle) / 2;
                const tx = isActive ? Math.cos(-RADIAN * midAngle) * 20 : 0;
                const ty = isActive ? Math.sin(-RADIAN * midAngle) * 20 : 0;

                return (
                  <g
                    className={isLoading ? "animate-pulse" : ""}
                    style={{
                      transform: `translate(${tx}px, ${ty}px)`,
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      opacity: isHoveringAny && !isActive ? 0.35 : 1,
                      filter: isActive && !isLoading ? 'drop-shadow(0px 8px 12px rgba(0,0,0,0.15))' : 'none',
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
                    />
                  </g>
                );
              }}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
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
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalStudents.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Học sinh
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                )}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm bg-primary text-primary-foreground p-4 mt-4 border-t-0 min-h-[56px] justify-center">
        {isLoading ? (
          <Skeleton className="h-5 w-3/4 opacity-50" />
        ) : (
          <div className="flex items-center gap-2 leading-none font-medium text-base">
            Đang quản lý {teacher.classes.length} lớp học <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
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
        // Thêm độ trễ 1 giây để quan sát được hiệu ứng Skeleton (Loading)
        await new Promise(resolve => setTimeout(resolve, 1000));
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
  }, [toast]);

  const handleExportReport = () => {
    toast.success("Đang tải xuống báo cáo hệ thống...", 3000);

    const bom = "\uFEFF";
    const csvContent = `STT;Tên chỉ số;Giá trị;Tăng trưởng\n1;Tổng học sinh;${stats?.totalStudents || 0};0%\n2;Tổng giáo viên;${stats?.totalTeachers || 0};0%\n3;Lớp đang hoạt động;${stats?.activeClasses || 0};0\n4;Tỷ lệ tương tác;${stats?.engagementRate || 0}%;0`;

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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tổng quan hệ thống</h2>
        <AnimatedAddButton
          onClick={handleExportReport}
          icon={<DownloadSimple size={20} weight="bold" className="shrink-0" />}
        >
          Xuất báo cáo
        </AnimatedAddButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card x-chunk="dashboard-01-chunk-0" className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng học sinh</CardTitle>
                <Users className="h-5 w-5 text-blue-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{stats?.totalStudents?.toLocaleString() || 0}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Tăng trưởng ổn định <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Số liệu thống kê tháng này
                </div>
              </CardContent>
            </Card>

            <Card x-chunk="dashboard-01-chunk-1" className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng giáo viên</CardTitle>
                <ChalkboardTeacher className="h-5 w-5 text-orange-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{stats?.totalTeachers?.toLocaleString() || 0}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Tuyển dụng thêm <ArrowUpRight className="h-4 w-4 text-orange-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Giáo viên tham gia hệ thống
                </div>
              </CardContent>
            </Card>

            <Card x-chunk="dashboard-01-chunk-2" className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lớp đang hoạt động</CardTitle>
                <Chalkboard className="h-5 w-5 text-indigo-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{stats?.activeClasses?.toLocaleString() || 0}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Lớp học mới <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Được tạo trong tuần này
                </div>
              </CardContent>
            </Card>

            <Card x-chunk="dashboard-01-chunk-3" className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ tương tác</CardTitle>
                <Activity className="h-5 w-5 text-emerald-500" weight="duotone" />
              </CardHeader>
              <CardContent className="group-data-[size=sm]/card:px-3 p-6 pt-0 relative flex-1">
                <div className="text-4xl font-bold tracking-tighter">{`${stats?.engagementRate || 0}%`}</div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium leading-none">
                  Trạng thái online <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Kể từ hôm qua
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Hiệu suất giảng dạy của giáo viên</CardTitle>
              <CardDescription>Số lượng bài tập đã giao và điểm trung bình học sinh.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              assignments: {
                label: "Số bài tập giao",
                color: "var(--chart-1)",
              },
              averageScore: {
                label: "Điểm trung bình",
                color: "var(--chart-2)",
              },
            }} className="h-[350px] w-full">
              <BarChart data={isLoading ? fakeChartData : (stats?.teacherPerformanceData || [])} barSize={32} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={isLoading ? undefined : <ChartTooltipContent indicator="dashed" />}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  dataKey="assignments" 
                  name="Số bài tập giao" 
                  fill={isLoading ? "#e2e8f0" : "var(--color-assignments)"} 
                  radius={4} 
                  shape={isLoading ? <SkeletonBar /> : undefined}
                />
                <Bar 
                  dataKey="averageScore" 
                  name="Điểm trung bình (Hệ 10)" 
                  fill={isLoading ? "#e2e8f0" : "var(--color-averageScore)"} 
                  radius={4} 
                  shape={isLoading ? <SkeletonBar /> : undefined}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Hoạt động gần đây</CardTitle>
            </div>
            <Button asChild size="sm" variant="ghost" className="ml-auto gap-1 text-primary hover:text-[#e55c3f] hover:bg-transparent">
              <a href="#">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-8 max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e55c3f] pr-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonAvatar key={`skeleton-avatar-${i}`} />
              ))
            ) : (
              (stats?.recentActions || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex border border-slate-100 shadow-sm">
                    {item.avatar ? (
                      <AvatarImage src={item.avatar} alt={item.user} />
                    ) : null}
                    <AvatarFallback className={item.isSystem ? "bg-slate-800 text-white" : "bg-primary text-white"}>
                      {item.isSystem ? <Gear size={16} weight="bold" /> : item.fallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{item.user}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{item.action}</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap">
                    {item.time}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* TEACHER STATS CHART */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        {isLoading ? (
          fakeTeacherStats.map((teacher, tIndex) => (
            <TeacherChartCard key={`skeleton-card-${tIndex}`} teacher={teacher} tIndex={tIndex} isLoading={true} />
          ))
        ) : stats?.teacherStudentStats?.length ? (
          stats.teacherStudentStats.map((teacher, tIndex) => (
            <TeacherChartCard key={tIndex} teacher={teacher} tIndex={tIndex} />
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-10">
            Chưa có dữ liệu thống kê học sinh của giáo viên.
          </div>
        )}
      </div>
    </div>
  );
}
