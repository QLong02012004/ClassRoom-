import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  CheckSquare,
  Clipboard,

} from "phosphor-react";
import { createMockClassroom, } from "../../../utils/mockDb";
import type { Classroom } from "../../../utils/mockDb";
import { useToast } from "../../../components/Styles/ToastContext";
import { dashboardService } from "../../../service/dashboard.service";
import type { ITeacherDashboardStats } from "../../../service/dashboard.service";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
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
}

const trendData = [
  { month: "Tháng 8", currentYear: 82, lastYear: 80 },
  { month: "Tháng 9", currentYear: 86, lastYear: 82 },
  { month: "Tháng 10", currentYear: 90, lastYear: 85 },
  { month: "Tháng 11", currentYear: 88, lastYear: 86 },
  { month: "Tháng 12", currentYear: 94, lastYear: 90 },
  { month: "Tháng 1", currentYear: 96, lastYear: 92 },
];

export default function TeacherDashboard() {
  const toast = useToast();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(320);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({ className: "", subject: "" });

  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [scoreStats, setScoreStats] = useState<ScoreStats>({ gioi: 142, kha: 110, trungBinh: 68 });

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ITeacherDashboardStats["stats"] | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getTeacherDashboardStats();
      if (res.data) {
        setStats(res.data.stats);
        setScoreStats(res.data.scoreDistribution);
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

  useEffect(() => {
    loadData();

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

  const maxScoreVal = Math.max(scoreStats.gioi, scoreStats.kha, scoreStats.trungBinh, 1);
  const getBarHeight = (val: number) => `${(val / maxScoreVal) * 100}%`;

  return (
    <div className="flex flex-col gap-6 p-2">

      {/* 1. KHỐI THẺ THỐNG KÊ (TEACHER STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">
              <BookOpen size={26} weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tổng số lớp</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : stats?.totalClasses || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
              <Users size={26} weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Học sinh</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : stats?.totalStudents || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <CheckSquare size={26} weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chuyên cần</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : `${stats?.attendanceRate || 0}%`}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
              <Clipboard size={26} weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bài tập cần chấm</p>
              <h3 className="text-2xl font-bold">{isLoading ? "..." : stats?.pendingGrades || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. KHỐI PHÂN TÍCH VÀ FEED HOẠT ĐỘNG (TEACHER GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Biểu đồ phổ điểm */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Biểu đồ phổ điểm</CardTitle>
              <CardDescription>Thống kê kết quả học kỳ 1</CardDescription>
            </div>
            <div className="w-48">
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả các lớp</SelectItem>
                  {classrooms.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-4">
            <div className={styles.barChartContainer}>
              <div className={styles.barChart}>
                <div className={styles.barItem}>
                  <span className={styles.barValue}>{scoreStats.gioi} HS</span>
                  <div className={styles.barColumnWrap}>
                    <div className={`${styles.barColumn} ${styles.gioi}`} style={{ height: getBarHeight(scoreStats.gioi) }} />
                  </div>
                  <span className={styles.barLabel}>Giỏi</span>
                </div>
                <div className={styles.barItem}>
                  <span className={styles.barValue}>{scoreStats.kha} HS</span>
                  <div className={styles.barColumnWrap}>
                    <div className={`${styles.barColumn} ${styles.kha}`} style={{ height: getBarHeight(scoreStats.kha) }} />
                  </div>
                  <span className={styles.barLabel}>Khá</span>
                </div>
                <div className={styles.barItem}>
                  <span className={styles.barValue}>{scoreStats.trungBinh} HS</span>
                  <div className={styles.barColumnWrap}>
                    <div className={`${styles.barColumn} ${styles.trungbinh}`} style={{ height: getBarHeight(scoreStats.trungBinh) }} />
                  </div>
                  <span className={styles.barLabel}>Trung bình</span>
                </div>
              </div>
              <div className={styles.chartDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Tỷ lệ đạt Khá / Giỏi</span>
                  <span className={styles.count} style={{ color: "#10B981" }}>
                    {Math.round(((scoreStats.gioi + scoreStats.kha) / (scoreStats.gioi + scoreStats.kha + scoreStats.trungBinh)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hoạt động gần đây */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="flex gap-3 relative">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex flex-col flex-1">
                <span className="text-sm"><strong>Nguyễn Văn A</strong> đã nộp bài tập <span className="text-orange-500 font-medium">Toán Hình học</span></span>
                <span className="text-xs text-muted-foreground mt-1">2 phút trước</span>
              </div>
            </div>

            <div className="flex gap-3 relative">
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex flex-col flex-1">
                <span className="text-sm"><strong>Lê Thị B</strong> bình luận trên bảng tin lớp <strong>12A1</strong></span>
                <span className="text-xs text-muted-foreground mt-1">15 phút trước</span>
              </div>
            </div>

            <div className="flex gap-3 relative">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex flex-col flex-1">
                <span className="text-sm"><strong>Trần Minh C</strong> được điểm danh có mặt</span>
                <span className="text-xs text-muted-foreground mt-1">1 giờ trước</span>
              </div>
            </div>
          </CardContent>
          <div className="p-4 pt-0 mt-auto">
            <Button variant="outline" className="w-full">Xem tất cả</Button>
          </div>
        </Card>
      </div>

      {/* 3. BIỂU ĐỒ XU HƯỚNG CHUYÊN CẦN */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Xu hướng chuyên cần</CardTitle>
            <CardDescription>Biến động tỷ lệ đi học trong 6 tháng qua</CardDescription>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Hiện tại
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div> Năm ngoái
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                formatter={(value: any) => [`${value}%`, '']}
              />
              <Area
                type="monotone"
                name="Năm ngoái"
                dataKey="lastYear"
                stroke="#cbd5e1"
                strokeDasharray="5 5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorLast)"
              />
              <Area
                type="monotone"
                name="Hiện tại"
                dataKey="currentYear"
                stroke="#10B981"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#colorCurrent)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Xác nhận tạo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
