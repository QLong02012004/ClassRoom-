/**
 * ============================================================================
 * TÊN FILE: useClassroomActivities.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Teacher/ClassroomDetail/hooks/useClassroomActivities.ts
 * MỤC ĐÍCH:
 *   Custom Hook quản lý danh sách Hoạt động học tập (Bài tập & Đề thi) của Lớp học.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Quản lý state lọc 3 cấp: Dạng bài (`filterType`), Mục đích (`filterCategory`), Trạng thái (`filterStatus`), và Từ khóa tìm kiếm (`searchQuery`).
 *   - Lắng nghe WebSockets `submission_update` để tự động làm mới danh sách bài tập.
 *   - Cung cấp hàm `handleToggleQuizStatus` đóng/mở bài trắc nghiệm và `fetchActivities` tải lại dữ liệu từ server.
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/components/Styles/ToastContext";
import { activityService } from "@/service/activity.service";
import type { Selection } from "@heroui/react";

interface UseClassroomActivitiesProps {
  classId?: string;
  setAssignments?: React.Dispatch<React.SetStateAction<any[]>>;
  setLoadingAssignments?: (loading: boolean) => void;
}

export function useClassroomActivities({
  classId,
  setAssignments,
  setLoadingAssignments,
}: UseClassroomActivitiesProps) {
  const toast = useToast();
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"all" | "quiz" | "document">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "homework" | "periodic">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuizKeys, setSelectedQuizKeys] = useState<Selection>(new Set());

  const loadAllActivities = useCallback(async () => {
    if (!classId) return;
    try {
      setLoadingActivities(true);
      setLoadingQuizzes(true);
      if (setLoadingAssignments) setLoadingAssignments(true);
      const res: any = await activityService.getClassActivities(classId);
      const list = Array.isArray(res) ? res : res?.data || [];
      setAllActivities(list);
      setQuizzes(list.filter((a: any) => a.type === "quiz"));
      if (setAssignments) setAssignments(list.filter((a: any) => a.type !== "quiz"));
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách hoạt động!");
    } finally {
      setLoadingActivities(false);
      setLoadingQuizzes(false);
      if (setLoadingAssignments) setLoadingAssignments(false);
    }
  }, [classId, toast, setLoadingAssignments, setAssignments]);

  const loadAllActivitiesRef = useRef(loadAllActivities);
  useEffect(() => {
    loadAllActivitiesRef.current = loadAllActivities;
  }, [loadAllActivities]);

  useEffect(() => {
    if (!classId) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("submission_update", (data?: { classId?: string; assignmentId?: string }) => {
      if (!data || !data.classId || data.classId === classId) {
        console.log("⚡ [Socket.io Realtime] Bài nộp có cập nhật mới, đang làm mới danh sách bài tập...");
        loadAllActivitiesRef.current();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [classId]);

  const totalPendingCount = allActivities.reduce(
    (acc, act) => acc + (act.pendingGradeCount || 0),
    0
  );

  const filteredActivities = useMemo(() => {
    const filtered = allActivities.filter((item: any) => {
      if (filterType === "quiz" && item.type !== "quiz") return false;
      if (filterType === "document" && item.type === "quiz") return false;

      if (filterCategory !== "all") {
        if (filterCategory === "homework") {
          if (item.category !== "homework") return false;
        } else if (filterCategory === "periodic") {
          if (item.category !== "periodic" && item.category !== "mock_exam") return false;
        } else {
          if (item.category !== filterCategory) return false;
        }
      }

      if (filterStatus !== "all") {
        const currentSt = (item.status || "open").toLowerCase();
        if (filterStatus === "open" && currentSt !== "open") return false;
        if (filterStatus === "closed" && currentSt !== "closed") return false;
        if (filterStatus === "draft" && currentSt !== "draft") return false;

        const subCount = item.submissionCount || 0;
        const gradedCount = item.gradedCount || 0;
        const isGraded = gradedCount > 0 && gradedCount >= subCount && subCount > 0;
        const isUngraded = (item.pendingGradeCount && item.pendingGradeCount > 0) || (subCount > 0 && gradedCount < subCount);

        if (filterStatus === "graded" && !isGraded) return false;
        if (filterStatus === "ungraded" && !isUngraded) return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });

    // SẮP XẾP ƯU TIÊN: Các bài tập có bài nộp chưa chấm sẽ được đẩy lên ĐẦU DẠNG BẢNG/LƯỚI
    return [...filtered].sort((a: any, b: any) => {
      const getPendingCount = (item: any) => {
        const subCount = item.submissionCount || 0;
        const gradedCount = item.gradedCount || 0;
        if (item.pendingGradeCount !== undefined && item.pendingGradeCount > 0) {
          return item.pendingGradeCount;
        }
        if (subCount > 0 && gradedCount < subCount) {
          return subCount - gradedCount;
        }
        return 0;
      };

      const pendingA = getPendingCount(a);
      const pendingB = getPendingCount(b);

      // 1. Ưu tiên bài có học sinh chưa chấm lên trên bài 0 có bài chưa chấm
      if (pendingA > 0 && pendingB === 0) return -1;
      if (pendingB > 0 && pendingA === 0) return 1;

      // 2. Nếu cả 2 đều có bài chưa chấm -> Ưu tiên bài có số lượng bài chưa chấm nhiều hơn
      if (pendingA > 0 && pendingB > 0 && pendingA !== pendingB) {
        return pendingB - pendingA;
      }

      // 3. Nếu cùng số bài chưa chấm (hoặc đều = 0) -> Ưu tiên bài tạo mới nhất
      const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
      return timeB - timeA;
    });
  }, [allActivities, filterType, filterCategory, filterStatus, searchQuery]);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const currentActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getQuizStatus = (quizItem: any) => {
    const status = quizItem.status || "open";
    if (quizItem.startDate && new Date(quizItem.startDate).getTime() > Date.now()) {
      const d = new Date(quizItem.startDate);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { label: `Hẹn giờ mở: ${timeStr} ${dateStr}`, class: "bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-extrabold" };
    }
    if (status === "draft")
      return { label: "Bản nháp", class: "bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs" };
    if (status === "closed")
      return { label: "Đã đóng", class: "bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs" };

    if (quizItem.type !== "quiz") {
      const subCount = quizItem.submissionCount || 0;
      const gradedCount = quizItem.gradedCount || 0;
      const pendingCount =
        quizItem.pendingGradeCount !== undefined
          ? quizItem.pendingGradeCount
          : Math.max(0, subCount - gradedCount);

      if (gradedCount > 0 && gradedCount >= subCount && subCount > 0) {
        return { label: "Đã chấm", class: "bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs" };
      }
      return { label: `Chưa chấm (${pendingCount})`, class: "bg-orange-50 text-[#f47c20] border border-orange-200/90 shadow-2xs" };
    }

    return { label: "Đang mở", class: "bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs" };
  };

  const selectedQuizIds = useMemo(() => {
    if (selectedQuizKeys === "all") {
      return quizzes.map((q: any) => q._id);
    }
    return Array.from(selectedQuizKeys) as string[];
  }, [selectedQuizKeys, quizzes]);

  const handleBulkDeleteQuizzes = async () => {
    if (selectedQuizIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedQuizIds.length} đề thi đã chọn?`)) {
      try {
        await Promise.all(selectedQuizIds.map((id) => activityService.deleteActivity(id)));
        toast.success("Đã xóa các đề thi thành công!");
        setSelectedQuizKeys(new Set());
        loadAllActivities();
      } catch (err: any) {
        toast.error(err.message || "Có lỗi xảy ra khi xóa hàng loạt!");
      }
    }
  };

  const handleBulkChangeStatusQuizzes = async (status: "open" | "closed") => {
    if (selectedQuizIds.length === 0) return;
    try {
      await Promise.all(selectedQuizIds.map((id) => activityService.updateActivity(id, { status })));
      toast.success(`Đã ${status === "open" ? "mở" : "đóng"} các đề thi thành công!`);
      setSelectedQuizKeys(new Set());
      loadAllActivities();
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const handleToggleQuizStatus = async (quizItem: any) => {
    if (!quizItem || !quizItem._id) return;
    const currentStatus = (quizItem.status || "open").toLowerCase();
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      const res = await activityService.updateActivity(quizItem._id, { status: newStatus });
      if (res) {
        setAllActivities((prev) =>
          prev.map((a) => (a._id === quizItem._id ? { ...a, status: newStatus } : a))
        );
        setQuizzes((prevQuizzes) =>
          prevQuizzes.map((q) => (q._id === quizItem._id ? { ...q, status: newStatus } : q))
        );
        if (setAssignments) {
          setAssignments((prev) =>
            prev.map((a) => (a._id === quizItem._id ? { ...a, status: newStatus } : a))
          );
        }
        toast.success(`Đã ${newStatus === "open" ? "mở" : "đóng"} bài tập "${quizItem.title}"`);
      }
    } catch (error: any) {
      toast.error(error.message || error.response?.data?.message || "Lỗi khi cập nhật trạng thái bài tập");
    }
  };

  return {
    allActivities,
    setAllActivities,
    loadingActivities,
    loadingQuizzes,
    quizzes,
    setQuizzes,
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    totalPendingCount,
    filteredActivities,
    currentActivities,
    totalPages,
    getQuizStatus,
    selectedQuizKeys,
    setSelectedQuizKeys,
    handleBulkDeleteQuizzes,
    handleBulkChangeStatusQuizzes,
    handleToggleQuizStatus,
    loadAllActivities,
  };
}
