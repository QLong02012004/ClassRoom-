const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Teacher/ClassroomDetail/TeacherClassroomDetail.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  'import { quizService } from "../../../service/quiz.service.ts";',
  'import { activityService } from "../../../service/activity.service.ts";\nimport { bankService } from "../../../service/bank.service.ts";'
);

// 2. loadQuizzes
content = content.replace(
  /const loadQuizzes = async \(\) => {[\s\S]*?finally {[\s\S]*?setLoadingQuizzes\(false\);[\s\S]*?}[\s\S]*?};/,
  `const loadQuizzes = async () => {
    if (!classId) return;
    try {
      setLoadingQuizzes(true);
      const res = await activityService.getClassActivities(classId);
      if (res && res.data) {
        const quizActivities = res.data.filter((a: any) => a.type === 'quiz');
        setQuizzes(quizActivities);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách bài trắc nghiệm!");
    } finally {
      setLoadingQuizzes(false);
    }
  };`
);

// 3. loadQuizResults
content = content.replace(
  /const loadQuizResults = async \(quizId: string\) => {[\s\S]*?await quizService\.getQuizResults\(quizId\);[\s\S]*?};/,
  `const loadQuizResults = async (quizId: string) => {
    try {
      setLoadingResults(true);
      const res = await activityService.getQuizResults(quizId);
      if (res && res.data) {
        setQuizResults(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng điểm!");
    } finally {
      setLoadingResults(false);
    }
  };`
);

// 4. handleSaveQuiz
content = content.replace(
  /const handleSaveQuiz = async \(quizData: \{[\s\S]*?await quizService\.createQuiz\(\{[\s\S]*?setIsSavingQuiz\(false\);\n    }\n  };/,
  `const handleSaveQuiz = async (quizData: { title: string; durationMinutes: number; questions: any[]; shuffleQuestions: boolean; shuffleOptions: boolean; }) => {
    if (!classId) return;
    setIsSavingQuiz(true);
    try {
      if (editingQuizId) {
        const activityToUpdate = quizzes.find(q => q._id === editingQuizId);
        if (activityToUpdate && activityToUpdate.bankItemId) {
          await bankService.updateBankItem(activityToUpdate.bankItemId._id || activityToUpdate.bankItemId, {
            title: quizData.title,
            durationMinutes: quizData.durationMinutes,
            shuffleQuestions: quizData.shuffleQuestions,
            shuffleOptions: quizData.shuffleOptions,
            quizQuestions: quizData.questions
          });
          await activityService.updateActivity(editingQuizId, {
            title: quizData.title,
            durationMinutes: quizData.durationMinutes
          });
        }
        toast.success("Cập nhật đề thi trắc nghiệm thành công!");
      } else {
        const bankRes = await bankService.createBankItem({
          type: 'quiz',
          title: quizData.title,
          durationMinutes: quizData.durationMinutes,
          shuffleQuestions: quizData.shuffleQuestions,
          shuffleOptions: quizData.shuffleOptions,
          quizQuestions: quizData.questions
        });
        await activityService.assignActivity(classId, {
          bankItemId: bankRes.data._id,
          title: quizData.title,
          durationMinutes: quizData.durationMinutes,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        toast.success("Tạo đề thi trắc nghiệm thành công!");
      }
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      loadQuizzes();
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes('đã có học sinh làm bài')) {
        setPendingQuizData(quizData);
        setIsResetQuizDialogOpen(true);
      } else {
        toast.error(errorMessage || (editingQuizId ? "Cập nhật đề thi trắc nghiệm thất bại!" : "Tạo đề thi trắc nghiệm thất bại!"));
      }
      throw err;
    } finally {
      setIsSavingQuiz(false);
    }
  };`
);

// 5. confirmSaveWithReset
content = content.replace(
  /const confirmSaveWithReset = async \(\) => {[\s\S]*?await quizService\.updateQuiz\(editingQuizId, {[\s\S]*?setIsResettingQuiz\(false\);\n    }\n  };/,
  `const confirmSaveWithReset = async () => {
    if (!editingQuizId || !pendingQuizData) return;
    setIsResettingQuiz(true);
    try {
      const activityToUpdate = quizzes.find(q => q._id === editingQuizId);
      if (activityToUpdate && activityToUpdate.bankItemId) {
        await bankService.updateBankItem(activityToUpdate.bankItemId._id || activityToUpdate.bankItemId, {
          title: pendingQuizData.title,
          durationMinutes: pendingQuizData.durationMinutes,
          shuffleQuestions: pendingQuizData.shuffleQuestions,
          shuffleOptions: pendingQuizData.shuffleOptions,
          quizQuestions: pendingQuizData.questions
        });
        await activityService.updateActivity(editingQuizId, {
          title: pendingQuizData.title,
          durationMinutes: pendingQuizData.durationMinutes,
          forceReset: true
        });
      }
      toast.success("Cập nhật đề thi & reset kết quả thành công!");
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      setPendingQuizData(null);
      loadQuizzes();
      setIsResetQuizDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể cập nhật đề thi này!");
    } finally {
      setIsResettingQuiz(false);
    }
  };`
);

// 6. handleToggleQuizStatus
content = content.replace(
  /const handleToggleQuizStatus = async \(quizItem: any\) => {[\s\S]*?await quizService\.updateQuizStatus\(quizItem\._id, newStatus\);[\s\S]*?};/,
  `const handleToggleQuizStatus = async (quizItem: any) => {
    const newStatus = quizItem.status === 'open' ? 'closed' : 'open';
    try {
      const res = await activityService.updateActivity(quizItem._id, { status: newStatus });
      if (res.data) {
        setQuizzes(prevQuizzes => prevQuizzes.map(q =>
          q._id === quizItem._id ? { ...q, status: newStatus } : q
        ));
        toast.success(\`Đã \${newStatus === 'open' ? 'mở' : 'đóng'} đề thi "\${quizItem.title}"\`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái đề thi");
    }
  };`
);

// 7. confirmDeleteQuiz
content = content.replace(
  /const confirmDeleteQuiz = async \(\) => {[\s\S]*?await quizService\.deleteQuiz\(quizToDelete\._id\);[\s\S]*?setIsDeletingQuiz\(false\);\n    }\n  };/,
  `const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await activityService.deleteActivity(quizToDelete._id);
      toast.success("Xóa đề thi thành công!");
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q._id !== quizToDelete._id));
      setIsDeleteQuizDialogOpen(false);
      setQuizToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa đề thi này!");
    } finally {
      setIsDeletingQuiz(false);
    }
  };`
);

// 8. handleOpenEditQuiz
content = content.replace(
  /const handleOpenEditQuiz = \(quizItem: any\) => {[\s\S]*?setEditingQuizId\(quizItem\._id\);\n    setIsCreatingQuiz\(true\);\n  };/,
  `const handleOpenEditQuiz = (quizItem: any) => {
    setQuizTitle(quizItem.title);
    setQuizDuration(quizItem.durationMinutes);
    const bankItem = quizItem.bankItemId || {};
    setShuffleQuestions(bankItem.shuffleQuestions || false);
    setShuffleOptions(bankItem.shuffleOptions || false);
    // Sao chép sâu câu hỏi vào form state
    const formattedQuestions = (bankItem.quizQuestions || []).map((q: any) => ({
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      options: [...q.options],
      optionImages: q.optionImages ? [...q.optionImages] : [],
      correctOptionIndex: q.correctOptionIndex,
      points: q.points || 1
    }));
    setQuizQuestions(formattedQuestions.length ? formattedQuestions : [{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }]);
    setEditingQuizId(quizItem._id);
    setIsCreatingQuiz(true);
  };`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete');
