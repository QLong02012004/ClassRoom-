import React from "react";
import QuizSubmissionsView from "./grading/QuizSubmissionsView";
import AssignmentGradingView from "./grading/AssignmentGradingView";
import ClassroomActivitiesTab from "./ClassroomActivitiesTab";
import styles from "../TeacherClassroomDetail.module.scss";

interface ClassroomActivitiesSectionProps {
  activities: any;
  bankAssign: any;
  quizBuilder: any;
  assignmentGrading: any;
  focusGrading: any;
  classroom: any;
  userRole: string;
}

export const ClassroomActivitiesSection: React.FC<ClassroomActivitiesSectionProps> = ({
  activities,
  bankAssign,
  quizBuilder,
  assignmentGrading,
  focusGrading,
  classroom,
  userRole,
}) => {
  return (
    <div className={styles.tabContentPanel}>
      {quizBuilder.selectedQuiz ? (
        <QuizSubmissionsView quizBuilder={quizBuilder} />
      ) : assignmentGrading.selectedAssignment ? (
        <AssignmentGradingView
          assignmentGrading={assignmentGrading}
          focusGrading={focusGrading}
        />
      ) : (
        <ClassroomActivitiesTab
          activities={activities}
          bankAssign={bankAssign}
          quizBuilder={quizBuilder}
          assignmentGrading={assignmentGrading}
          classroom={classroom}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default ClassroomActivitiesSection;
