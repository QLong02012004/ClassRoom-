import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { classroomService } from "@/service/classroom.service";
import { announcementService, type IAnnouncement } from "@/service/announcement.service";
import { useToast } from "@/components/Styles/ToastContext";

export interface ClassroomInfo {
  _id: string;
  className: string;
  subject: string;
  code: string;
  teacherName: string;
  studentCount: number;
  status?: string;
}

export function useClassroomDetailData(classId?: string) {
  const navigate = useNavigate();
  const toast = useToast();

  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (!classId) return;
      if (isInitial) setLoadingData(true);

      // 1. Tải thông tin lớp học
      try {
        const res = await classroomService.getClassroomDetail(classId);
        if (res && res.data) {
          setClassroom({
            _id: res.data._id,
            className: res.data.name,
            subject: res.data.subject || "",
            code: res.data.code,
            teacherName: (res.data as any).teacherId?.name || "Giáo viên",
            studentCount: res.data.students?.length || 0,
            status: res.data.status,
          });
        }
      } catch (err: any) {
        toast.error(err.message || "Không thể tải thông tin lớp học!");
        navigate("/classrooms");
        return;
      }

      // 2. Tải danh sách thông báo bảng tin
      try {
        const annRes = await announcementService.getAnnouncements(classId);
        if (annRes && annRes.data) {
          setAnnouncements(annRes.data);
        }
      } catch (err: any) {
        toast.error(err.message || "Không thể tải bảng tin lớp học!");
      } finally {
        if (isInitial) setLoadingData(false);
      }
    },
    [classId, navigate, toast]
  );

  useEffect(() => {
    loadData(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("classroom_feed_update", (targetClassId?: string) => {
      if (!targetClassId || targetClassId === classId) {
        console.log("⚡ [Socket.io Realtime] Bảng tin có cập nhật mới, đang tự động tải lại...");
        loadData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [classId, loadData]);

  const handleCopyCode = useCallback(() => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    toast.success("Đã sao chép mã gia nhập lớp!", 2000);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [classroom?.code, toast]);

  return {
    classroom,
    announcements,
    setAnnouncements,
    loadingData,
    copiedCode,
    loadData,
    handleCopyCode,
  };
}
