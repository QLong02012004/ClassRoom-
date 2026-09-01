import React from "react";
import { CustomConfirmDialog } from "@/components/ui/Dialogs/CustomConfirmDialog";
import { ResourceDetailModal } from "@/components/ui/Dialogs/ResourceDetailModal/ResourceDetailModal";
import QuizPreviewModal from "@/components/ui/Dialogs/QuizPreviewModal/QuizPreviewModal";
import EditActivityModal from "./EditActivityModal";
import AssignFromBankModal from "./AssignFromBankModal";

interface ClassroomDialogsManagerProps {
  stream: any;
  quizBuilder: any;
  assignmentGrading: any;
  bankAssign: any;
  bankFilterType?: "all" | "quiz" | "essay";
  setBankFilterType?: (val: "all" | "quiz" | "essay") => void;
  setSelectedQuiz?: (quiz: any) => void;
  loadQuizResults?: (quizId: string) => void;
}

export const ClassroomDialogsManager: React.FC<ClassroomDialogsManagerProps> = (props) => {
  const {
    stream,
    quizBuilder,
    assignmentGrading,
    bankAssign,
    bankFilterType,
    setBankFilterType,
  } = props;

  const setSelectedQuiz = props.setSelectedQuiz ?? quizBuilder?.setSelectedQuiz;
  const loadQuizResults = props.loadQuizResults ?? quizBuilder?.loadQuizResults;
  return (
    <>
      {/* MODAL GIAO BÀI TỪ NGÂN HÀNG ĐỀ THI */}
      <AssignFromBankModal
        bankAssign={bankAssign}
        {...(bankFilterType ? { bankFilterType } : {})}
        {...(setBankFilterType ? { setBankFilterType } : {})}
      />

      <CustomConfirmDialog
        isOpen={stream.isDeletePostDialogOpen}
        onOpenChange={stream.setIsDeletePostDialogOpen}
        title="Xác nhận xóa thông báo"
        description="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
        onConfirm={stream.confirmDeletePost}
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={stream.isDeletingPost}
        actionType="danger"
      />

      <CustomConfirmDialog
        isOpen={quizBuilder.isDeleteQuizDialogOpen}
        onOpenChange={quizBuilder.setIsDeleteQuizDialogOpen}
        title="Xác nhận xóa đề thi"
        description={
          <>
            Bạn có chắc chắn muốn xóa đề thi <strong>{quizBuilder.quizToDelete?.title}</strong>? Thao tác này không thể hoàn tác.
          </>
        }
        onConfirm={quizBuilder.confirmDeleteQuiz}
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={quizBuilder.isDeletingQuiz}
        actionType="danger"
      />

      <CustomConfirmDialog
        isOpen={assignmentGrading.isDeleteAssignmentDialogOpen}
        onOpenChange={assignmentGrading.setIsDeleteAssignmentDialogOpen}
        title="Xác nhận xóa bài tập"
        description={
          <>
            Bạn có chắc chắn muốn xóa bài tập <strong>{assignmentGrading.assignmentToDelete?.title}</strong>? Thao tác này không thể hoàn tác.
          </>
        }
        onConfirm={assignmentGrading.confirmDeleteAssignment}
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={assignmentGrading.isDeletingAssignment}
        actionType="danger"
      />

      <CustomConfirmDialog
        isOpen={quizBuilder.isResetQuizDialogOpen}
        onOpenChange={quizBuilder.setIsResetQuizDialogOpen}
        title="Cảnh báo: Đã có học sinh làm bài"
        description="Đề thi này đã có học sinh làm bài. Nếu bạn tiếp tục chỉnh sửa, toàn bộ kết quả làm bài hiện tại của học sinh sẽ bị XÓA BỎ. Bạn có chắc chắn muốn tiếp tục?"
        onConfirm={quizBuilder.confirmSaveWithReset}
        confirmText="Xóa & Lưu"
        cancelText="Hủy bỏ"
        isLoading={quizBuilder.isResettingQuiz}
        actionType="danger"
      />

      <ResourceDetailModal
        isOpen={!!bankAssign.selectedResourceDetails}
        onClose={() => bankAssign.setSelectedResourceDetails(null)}
        item={bankAssign.selectedResourceDetails}
        onViewQuizScores={(item) => {
          setSelectedQuiz(item);
          loadQuizResults(item._id);
        }}
      />

      {bankAssign.previewBankItem && (
        <QuizPreviewModal
          isOpen={!!bankAssign.previewBankItem}
          onClose={() => bankAssign.setPreviewBankItem(null)}
          quizTitle={bankAssign.previewBankItem.title}
          quizQuestions={bankAssign.previewBankItem.quizQuestions || []}
        />
      )}

      <EditActivityModal
        editingActivity={bankAssign.editingActivity}
        onClose={() => bankAssign.setEditingActivity(null)}
        onConfirmEdit={bankAssign.handleConfirmEditActivity}
        editTitle={bankAssign.editTitle}
        setEditTitle={bankAssign.setEditTitle}
        editDescription={bankAssign.editDescription}
        setEditDescription={bankAssign.setEditDescription}
        editCategory={bankAssign.editCategory}
        setEditCategory={bankAssign.setEditCategory}
        editCustomCategory={bankAssign.editCustomCategory}
        setEditCustomCategory={bankAssign.setEditCustomCategory}
        editDueDate={bankAssign.editDueDate}
        setEditDueDate={bankAssign.setEditDueDate}
        editMaxScore={bankAssign.editMaxScore}
        setEditMaxScore={bankAssign.setEditMaxScore}
        editAllowMultiple={bankAssign.editAllowMultiple}
        setEditAllowMultiple={bankAssign.setEditAllowMultiple}
        isSavingEditActivity={bankAssign.isSavingEditActivity}
      />
    </>
  );
};

export default ClassroomDialogsManager;
