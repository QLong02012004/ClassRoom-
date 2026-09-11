/**
 * ============================================================================
 * TÊN FILE: activityScheduler.ts
 * ĐƯỜNG DẪN: backend-classroom/src/services/activityScheduler.ts
 * MỤC ĐÍCH:
 *   Bộ lập lịch tự động (Scheduler) kiểm tra các bài tập / đề thi có hẹn giờ (startDate > thời điểm tạo).
 *   Khi đến thời gian mở (startDate <= now), hệ thống sẽ:
 *     1. Đánh dấu `isNotified = true`.
 *     2. Gửi thông báo chuông tới tất cả học sinh trong lớp.
 *     3. Bắn WebSockets feed & activity update theo thời gian thực tới học sinh.
 * ============================================================================
 */

import { ClassActivityModel } from '../models/ClassActivity';
import { ClassModel } from '../models/Class';
import { createUserNotification } from './notificationService';
import { UserRole, NotificationType, QuizStatus } from '../constants/enums';
import {
  notifyClassroomFeedUpdate,
  notifyStudentClassroomsUpdate,
  notifyTeacherClassroomsUpdate,
  notifyAdminStatsUpdate
} from '../socket';

export const checkAndPublishScheduledActivities = async () => {
  try {
    const now = new Date();
    // Tìm các bài tập có hẹn giờ (isNotified: false) mà thời gian mở đã đến (startDate <= now)
    // Giới hạn trong vòng 7 ngày gần nhất
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const scheduledActivities = await ClassActivityModel.find({
      isNotified: false,
      startDate: { $lte: now, $gte: sevenDaysAgo },
      status: { $ne: QuizStatus.CLOSED }
    });

    if (!scheduledActivities || scheduledActivities.length === 0) {
      return;
    }

    console.log(`[Scheduler] ⏰ Tìm thấy ${scheduledActivities.length} bài tập hẹn giờ đã đến thời gian mở.`);

    for (const act of scheduledActivities) {
      // Đánh dấu đã gửi thông báo để tránh trùng lặp
      act.isNotified = true;
      await act.save();

      try {
        const cls = await ClassModel.findById(act.classId).lean();
        if (cls && cls.students && cls.students.length > 0) {
          const isQuiz = act.type === 'quiz';
          const notifType = isQuiz ? NotificationType.QUIZ : NotificationType.ASSIGNMENT;
          const notifTitle = isQuiz ? 'Đề thi trắc nghiệm đã mở' : 'Bài tập mới trong lớp học';
          const notifMsg = `Bài "${act.title}" trong lớp ${cls.name} đã bắt đầu mở, hãy vào làm bài!`;

          for (const stId of cls.students) {
            await createUserNotification(
              stId.toString(),
              UserRole.STUDENT,
              '',
              notifTitle,
              notifMsg,
              notifType
            );
          }
        }
      } catch (errNotif) {
        console.error(`[Scheduler] ❌ Lỗi gửi thông báo cho bài tập ${act._id}:`, errNotif);
      }

      // Phát tín hiệu WebSockets cập nhật cho học sinh và giáo viên
      notifyClassroomFeedUpdate(act.classId.toString());
      notifyStudentClassroomsUpdate();
      notifyTeacherClassroomsUpdate();
      notifyAdminStatsUpdate();
    }
  } catch (error) {
    console.error('[Scheduler] ❌ Lỗi khi kiểm tra bài tập hẹn giờ:', error);
  }
};

let schedulerInterval: NodeJS.Timeout | null = null;

export const startActivityScheduler = (intervalMs = 30000) => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Chạy ngay 1 lần khi khởi động
  checkAndPublishScheduledActivities();

  // Thiết lập chu kỳ kiểm tra định kỳ (mặc định mỗi 30 giây)
  schedulerInterval = setInterval(checkAndPublishScheduledActivities, intervalMs);
  console.log(`[Scheduler] 🚀 Activity Scheduler đã khởi động (chu kỳ ${intervalMs / 1000}s).`);
};
