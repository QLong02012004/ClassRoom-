/**
 * ============================================================================
 * TÊN FILE: useAssignmentGrading.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Teacher/ClassroomDetail/hooks/useAssignmentGrading.ts
 * MỤC ĐÍCH:
 *   Custom Hook quản lý chấm điểm bài nộp tự luận và xóa bài tập khỏi lớp học.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lấy danh sách bài nộp của học sinh (`loadAssignmentSubmissions`).
 *   - Quản lý modal xác nhận xóa bài tập (`handleConfirmDeleteAssignment`).
 *   - Gọi `gradebookService.saveGrades` khi Giáo viên nhập điểm & lời phê cho học sinh.
 * ============================================================================
 */

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/components/Styles/ToastContext";
import { activityService } from "@/service/activity.service";
import { gradebookService } from "@/service/gradebook.service";
import { format4DigitScore } from "@/utils/scoreFormatter";

interface UseAssignmentGradingProps {
  loadAllActivities: () => Promise<void>;
  setGradingData: (data: any) => void;
  gradingData: any;
}

export function useAssignmentGrading({
  loadAllActivities,
  setGradingData,
  gradingData,
}: UseAssignmentGradingProps) {
  const toast = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  const selectedAssignmentRef = useRef<any>(null);

  const loadAssignmentSubmissions = async (assignmentId: string) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      setLoadingSubmissions(true);
      const res = await gradebookService.getAssignmentSubmissions(assignmentId);
      if (res && res.data) {
        setAssignmentSubmissions(res.data);
        const initialGrading: Record<string, { score: number | string; feedback: string }> = {};
        res.data.forEach((sub: any) => {
          const studentIdStr = typeof sub.studentId === "object" ? sub.studentId._id : sub.studentId;
          initialGrading[studentIdStr] = {
            score: sub.grade !== undefined && sub.grade !== null ? format4DigitScore(sub.grade) : "",
            feedback: sub.feedback || "",
          };
        });
        setGradingData(initialGrading);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách bài nộp!");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // ── Socket.io: lắng nghe học sinh nộp/nộp lại bài → tự động reload ──────
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("submission_update", (data?: { assignmentId?: string; classId?: string }) => {
      const currentAssignment = selectedAssignmentRef.current;
      if (!currentAssignment) return;
      // Reload nếu event liên quan tới bài đang xem (hoặc không có assignmentId cụ thể)
      if (!data?.assignmentId || data.assignmentId === currentAssignment._id) {
        console.log("⚡ [Teacher Socket] Học sinh nộp/nộp lại bài → tự động cập nhật danh sách bài nộp...");
        loadAssignmentSubmissions(currentAssignment._id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync ref với selectedAssignment state để socket callback luôn có giá trị mới nhất
  useEffect(() => {
    selectedAssignmentRef.current = selectedAssignment;
  }, [selectedAssignment]);

  const handleDeleteAssignmentClick = (assignmentItem: any) => {
    setAssignmentToDelete(assignmentItem);
    setIsDeleteAssignmentDialogOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setIsDeletingAssignment(true);
    try {
      await activityService.deleteActivity(assignmentToDelete._id);
      toast.success("Xóa bài tập thành công!");
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentToDelete._id));
      setIsDeleteAssignmentDialogOpen(false);
      setAssignmentToDelete(null);
      if (loadAllActivities) {
        await loadAllActivities();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa bài tập này!");
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;
    setIsSavingGrades(true);
    try {
      const gradesPayload: { studentId: string; score: number; feedback?: string }[] = [];
      for (const [studentId, data] of Object.entries(gradingData) as [string, any][]) {
        if (data.score !== "" && !isNaN(Number(data.score))) {
          const scoreNum = Number(data.score);
          if (scoreNum < 0 || scoreNum > 10) {
            toast.error("Điểm số phải nằm trong thang điểm từ 00.00 đến 10.00!");
            setIsSavingGrades(false);
            return;
          }
          gradesPayload.push({
            studentId,
            score: scoreNum,
            feedback: data.feedback,
          });
        }
      }

      if (gradesPayload.length === 0) {
        toast.warning("Vui lòng nhập điểm số cho ít nhất 1 học sinh trước khi lưu!");
        setIsSavingGrades(false);
        return;
      }

      await gradebookService.saveGrades({
        assignmentId: selectedAssignment._id,
        grades: gradesPayload,
      });
      toast.success("Lưu điểm & nhận xét thành công!");
      await loadAssignmentSubmissions(selectedAssignment._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Lỗi khi lưu bảng điểm!");
    } finally {
      setIsSavingGrades(false);
    }
  };

  return {
    assignments,
    setAssignments,
    loadingAssignments,
    setLoadingAssignments,
    selectedAssignment,
    setSelectedAssignment,
    assignmentSubmissions,
    setAssignmentSubmissions,
    loadingSubmissions,
    isSavingGrades,
    isDeleteAssignmentDialogOpen,
    setIsDeleteAssignmentDialogOpen,
    assignmentToDelete,
    isDeletingAssignment,
    loadAssignmentSubmissions,
    handleDeleteAssignmentClick,
    confirmDeleteAssignment,
    handleSaveGrades,
  };
}
