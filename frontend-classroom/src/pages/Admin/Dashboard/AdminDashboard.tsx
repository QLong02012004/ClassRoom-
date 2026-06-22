import React, { useState, useEffect } from "react";
import {
  DownloadSimple,
  Plus,
  Users,
  ChalkboardTeacher,
  Chalkboard,
  Activity,
  Gear
} from "phosphor-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, CartesianGrid, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "../../../components/Styles/ToastContext";
import { dashboardService, type IDashboardStats } from "../../../service/dashboard.service";

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
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1400px] mx-auto bg-[#fafafa] min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Chào mừng trở lại, quản trị viên. Đây là tình trạng hoạt động của hệ thống hôm nay.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2 bg-white text-slate-700 font-semibold shadow-sm border-slate-200"
            onClick={handleExportReport}
          >
            <DownloadSimple size={16} weight="bold" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Tổng học sinh */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Users size={24} weight="fill" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng học sinh</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900">{isLoading ? "..." : stats?.totalStudents?.toLocaleString() || 0}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +12% so với tháng trước
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tổng giáo viên */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <ChalkboardTeacher size={24} weight="fill" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng giáo viên</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900">{isLoading ? "..." : stats?.totalTeachers?.toLocaleString() || 0}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +3%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Lớp học đang hoạt động */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Chalkboard size={24} weight="fill" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lớp học đang hoạt động</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900">{isLoading ? "..." : stats?.activeClasses?.toLocaleString() || 0}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Tỷ lệ tương tác */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Activity size={24} weight="fill" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tỷ lệ tương tác</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900">{isLoading ? "..." : `${stats?.engagementRate || 0}%`}</h3>
              <span className="text-xs font-medium text-slate-500">
                (Đang online / Làm bài tập)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE SECTION (Charts 70% + Recent Actions 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* CHART AREA (70%) */}
        <Card className="lg:col-span-7 shadow-sm border-gray-200 flex flex-col bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Tần suất hoạt động hệ thống</CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-1">Lượng bài tập được nộp & số lượt đăng nhập trong 7 ngày qua</CardDescription>
            </div>
            <Select defaultValue="7days">
              <SelectTrigger className="w-[140px] h-9 text-sm font-semibold bg-slate-50">
                <SelectValue placeholder="7 ngày qua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 pt-6 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trafficData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FE6747" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#FE6747" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  name="Lượt hoạt động"
                  stroke="#FE6747" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#FE6747" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RECENT ACTIONS (30%) */}
        <Card className="lg:col-span-3 shadow-sm border-gray-200 bg-white flex flex-col">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900">Hoạt động gần đây</CardTitle>
            <button className="text-sm font-semibold text-primary hover:underline">Xem tất cả</button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="flex flex-col divide-y divide-slate-100">
              {(stats?.recentActions || []).map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4">
                  <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                    {item.avatar ? (
                      <AvatarImage src={item.avatar} alt={item.user} />
                    ) : null}
                    <AvatarFallback className={item.isSystem ? "bg-slate-800 text-white" : "bg-primary text-white"}>
                      {item.isSystem ? <Gear size={16} weight="bold" /> : item.fallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.user}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-snug">
                      {item.action}
                    </p>
                    <div className="pt-2">
                      <Badge variant="outline" className={`font-semibold ${item.badgeColor}`}>
                        {item.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
