import React from "react";
import styles from "../TeacherClassroomDetail.module.scss";

interface ClassroomScheduleTabProps {
  classroom: any;
}

export const ClassroomScheduleTab: React.FC<ClassroomScheduleTabProps> = ({ classroom }) => {
  return (
    <div className={styles.tabContentPanel}>
      <div className={styles.reportCard}>
        <h3>Lịch trình học tập</h3>
        <p>Lịch dạy và các buổi học thêm được xếp lịch cho lớp {classroom?.className}.</p>
        <div className={styles.scheduleTimeline}>
          <div className={styles.timelineEvent}>
            <span className={styles.eventTime}>Thứ 2 (08:00 - 09:30)</span>
            <div className={styles.eventInfo}>
              <h4>Buổi ôn tập Đại Số</h4>
              <p>Chương Đạo hàm & Khảo sát hàm số</p>
            </div>
          </div>
          <div className={styles.timelineEvent}>
            <span className={styles.eventTime}>Thứ 4 (18:00 - 19:30)</span>
            <div className={styles.eventInfo}>
              <h4>Học chuyên đề Hình Học không gian</h4>
              <p>Tính thể tích khối đa diện</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomScheduleTab;
