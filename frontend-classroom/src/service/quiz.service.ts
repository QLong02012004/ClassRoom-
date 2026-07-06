import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IQuizQuestion {
  _id?: string;
  questionText: string;
  imageUrl?: string;
  options: string[];
  optionImages?: string[];
  correctOptionIndex: number;
  points?: number;
}

export interface IQuizResult {
  _id?: string;
  quizId: string;
  studentId: string | { _id: string; name: string; email: string; avatar?: string };
  answers: number[];
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface IQuiz {
  _id: string;
  classId: string;
  title: string;
  durationMinutes: number;
  questions: IQuizQuestion[];
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  createdAt: string;
  result?: {
    score: number;
    submittedAt: string;
    totalQuestions: number;
  } | null;
}

export const quizService = {
  // Lấy danh sách đề trắc nghiệm của lớp
  getQuizzes: async (classId: string): Promise<IBackendRes<IQuiz[]>> => {
    return await api.get(`/api/v1/quizzes`, { params: { classId } });
  },

  // Lấy chi tiết đề trắc nghiệm
  getQuizDetail: async (id: string): Promise<IBackendRes<{ quiz: IQuiz; result: IQuizResult | null }>> => {
    return await api.get(`/api/v1/quizzes/${id}`);
  },

  // Học sinh nộp bài thi
  submitQuiz: async (id: string, answers: number[]): Promise<IBackendRes<IQuizResult>> => {
    return await api.post(`/api/v1/quizzes/${id}/submit`, { answers });
  },

  // Học sinh lấy kết quả bài thi cá nhân
  getMyQuizResult: async (id: string): Promise<IBackendRes<IQuizResult>> => {
    return await api.get(`/api/v1/quizzes/${id}/my-result`);
  },

  // Giáo viên lấy toàn bộ kết quả bài thi của lớp
  getQuizResults: async (id: string): Promise<IBackendRes<IQuizResult[]>> => {
    return await api.get(`/api/v1/quizzes/${id}/results`);
  },

  // Giáo viên tạo đề trắc nghiệm mới
  createQuiz: async (data: {
    classId: string;
    title: string;
    durationMinutes: number;
    questions: { questionText: string; imageUrl?: string; options: string[]; optionImages?: string[]; correctOptionIndex: number; points?: number }[];
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
  }): Promise<IBackendRes<IQuiz>> => {
    return await api.post(`/api/v1/quizzes`, data);
  },

  // Giáo viên chỉnh sửa đề trắc nghiệm
  updateQuiz: async (id: string, data: {
    title: string;
    durationMinutes: number;
    questions: { questionText: string; imageUrl?: string; options: string[]; optionImages?: string[]; correctOptionIndex: number; points?: number }[];
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    forceReset?: boolean;
  }): Promise<IBackendRes<IQuiz>> => {
    return await api.put(`/api/v1/quizzes/${id}`, data);
  },

  // Giáo viên cập nhật trạng thái đề thi (ẩn/hiện)
  updateQuizStatus: async (id: string, status: 'open' | 'closed' | 'draft'): Promise<IBackendRes<IQuiz>> => {
    return await api.patch(`/api/v1/quizzes/${id}/status`, { status });
  },

  // Giáo viên xóa đề thi trắc nghiệm
  deleteQuiz: async (id: string): Promise<IBackendRes<null>> => {
    return await api.delete(`/api/v1/quizzes/${id}`);
  },
};
