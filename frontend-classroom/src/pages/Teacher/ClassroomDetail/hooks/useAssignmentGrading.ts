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

import { useState } from "react";
import { useToast } from "@/components/Styles/ToastContext";
import { activityService } from "@/service/activity.service";
import { gradebookService } from "@/service/gradebook.service";

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
            score: sub.grade !== undefined && sub.grade !== null ? sub.grade : "",
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
      Object.entries(gradingData).forEach(([studentId, data]: [string, any]) => {
        if (data.score !== "" && !isNaN(Number(data.score))) {
          gradesPayload.push({
            studentId,
            score: Number(data.score),
            feedback: data.feedback,
          });
        }
      });

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
