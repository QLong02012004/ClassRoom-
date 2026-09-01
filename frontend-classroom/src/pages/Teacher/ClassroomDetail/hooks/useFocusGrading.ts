import { useState, useCallback } from "react";

export function useFocusGrading() {
  const [focusGradingSub, setFocusGradingSub] = useState<any | null>(null);
  const [gradingData, setGradingData] = useState<Record<string, { score: number | string; feedback: string }>>({});

  const handleOpenFocusGrading = useCallback((submission: any) => {
    setFocusGradingSub(submission);
    const studentId = typeof submission.studentId === "object" ? submission.studentId._id : submission.studentId;
    setGradingData((prev) => ({
      ...prev,
      [studentId]: {
        score: submission.score !== undefined && submission.score !== null ? submission.score : "",
        feedback: submission.feedback || "",
      },
    }));
  }, []);

  const handleCloseFocusGrading = useCallback(() => {
    setFocusGradingSub(null);
  }, []);

  const handleSelectSubmission = useCallback((sub: any) => {
    setFocusGradingSub(sub);
    const studentId = typeof sub.studentId === "object" ? sub.studentId._id : sub.studentId;
    setGradingData((prev) => {
      if (!prev[studentId]) {
        return {
          ...prev,
          [studentId]: {
            score: sub.score !== undefined && sub.score !== null ? sub.score : "",
            feedback: sub.feedback || "",
          },
        };
      }
      return prev;
    });
  }, []);

  return {
    focusGradingSub,
    setFocusGradingSub,
    gradingData,
    setGradingData,
    handleOpenFocusGrading,
    handleCloseFocusGrading,
    handleSelectSubmission,
  };
}
