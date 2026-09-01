import React, { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.tsx";
import FullPageLoader from "../../../components/ui/Loaders/FullPageLoader";
import ClassroomStreamTab from "./components/ClassroomStreamTab";
import ClassroomScheduleTab from "./components/ClassroomScheduleTab";
import ClassroomActivitiesSection from "./components/ClassroomActivitiesSection";
import ClassroomDialogsManager from "./components/ClassroomDialogsManager";
import { useClassroomDetailData } from "./hooks/useClassroomDetailData";
import { useClassroomStream } from "./hooks/useClassroomStream";
import { useFocusGrading } from "./hooks/useFocusGrading";
import { useQuizBuilder } from "./hooks/useQuizBuilder";
import { useBankAssign } from "./hooks/useBankAssign";
import { useAssignmentGrading } from "./hooks/useAssignmentGrading";
import { useClassroomActivities } from "./hooks/useClassroomActivities";
import type { ClassroomActiveTab } from "./types/classroom.types";
import styles from "./TeacherClassroomDetail.module.scss";

export default function TeacherClassroomDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "overview") as ClassroomActiveTab;

  const { user, userRole, username, userAvatar } = useAuth();

  // 1. Data Hooks
  const classroomData = useClassroomDetailData(classId);
  const focusGrading = useFocusGrading();

  const activities = useClassroomActivities({
    classId,
  });

  const assignmentGrading = useAssignmentGrading({
    loadAllActivities: activities.loadAllActivities,
    setGradingData: focusGrading.setGradingData,
    gradingData: focusGrading.gradingData,
  });

  const quizBuilder = useQuizBuilder({
    classId,
    quizzes: activities.quizzes,
    loadQuizzes: activities.loadAllActivities,
  });

  const bankAssign = useBankAssign({
    classId,
    loadQuizzes: activities.loadAllActivities,
    loadAssignments: activities.loadAllActivities,
    setAllActivities: activities.setAllActivities,
    setAssignments: assignmentGrading.setAssignments,
    handleOpenEditQuiz: quizBuilder.handleOpenEditQuiz,
  });

  const stream = useClassroomStream({
    classId,
    setAnnouncements: classroomData.setAnnouncements,
    loadData: classroomData.loadData,
  });

  useEffect(() => {
    if (assignmentGrading.selectedAssignment || quizBuilder.selectedQuiz) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [assignmentGrading.selectedAssignment, quizBuilder.selectedQuiz]);

  useEffect(() => {
    if (activeTab === "activities" || activeTab === "quizzes" || activeTab === "assignments") {
      activities.loadAllActivities();
      quizBuilder.setSelectedQuiz(null);
      assignmentGrading.setSelectedAssignment(null);
      quizBuilder.setIsCreatingQuiz(false);
    }
  }, [
    activeTab,
    classId,
    activities.loadAllActivities,
    quizBuilder.setSelectedQuiz,
    assignmentGrading.setSelectedAssignment,
    quizBuilder.setIsCreatingQuiz,
  ]);

  return (
    <>
      {classroomData.loadingData && (
        <FullPageLoader
          text="Đang tải dữ liệu lớp học..."
          subtext="Vui lòng chờ trong giây lát"
        />
      )}
      <div className={styles.classroomDetailContainer}>
        <div className={styles.mainContent}>
          {/* TAB: SCHEDULE VIEW */}
          {activeTab === "schedule" && (
            <ClassroomScheduleTab classroom={classroomData.classroom} />
          )}

          {/* TAB: OVERVIEW (FEED VIEW - STREAM TAB) */}
          {activeTab === "overview" && (
            <ClassroomStreamTab
              stream={stream}
              classroomData={classroomData}
              classId={classId}
              userRole={userRole}
              user={user}
              userAvatar={userAvatar}
            />
          )}

          {/* TAB: UNIFIED ACTIVITIES SECTION */}
          {(activeTab === "activities" || activeTab === "quizzes" || activeTab === "assignments") && (
            <ClassroomActivitiesSection
              activities={activities}
              bankAssign={bankAssign}
              quizBuilder={quizBuilder}
              assignmentGrading={assignmentGrading}
              focusGrading={focusGrading}
              classroom={classroomData.classroom}
              userRole={userRole}
            />
          )}
        </div>

        {/* ALL DIALOGS & MODALS MANAGER */}
        <ClassroomDialogsManager
          stream={stream}
          quizBuilder={quizBuilder}
          assignmentGrading={assignmentGrading}
          bankAssign={bankAssign}
        />
      </div>
    </>
  );
}
