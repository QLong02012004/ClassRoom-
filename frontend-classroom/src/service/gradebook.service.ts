import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IAssignment {
  _id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  category: string;
  createdAt: string;
}

export interface IGrade {
  _id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  feedback?: string;
  gradedAt: string;
}

export interface IGradebookStudent {
  _id: string;
  name: string;
  email: string;
}

export interface IGradebookData {
  students: IGradebookStudent[];
  assignments: IAssignment[];
  grades: IGrade[];
}

export interface ISubmissionAttachment {
  name: string;
  url: string;
  size: string;
}

export interface ISubmissionComment {
  userId: string;
  name: string;
  isTeacher: boolean;
  text: string;
  createdAt: string;
}

export interface ISubmission {
  _id?: string;
  assignmentId: string;
  studentId: string | { _id: string; name: string; email: string; avatar?: string };
  submissionText?: string;
  attachments: ISubmissionAttachment[];
  comments?: ISubmissionComment[];
  status: 'pending' | 'submitted' | 'late' | 'graded';
  submittedAt: string;
  grade?: number | null;
  feedback?: string | null;
}

export const gradebookService = {
  // Lấy dữ liệu bảng điểm của lớp
  getClassroomGrades: async (classId: string): Promise<IBackendRes<IGradebookData>> => {
    return await api.get(`/api/v1/grades`, { params: { classId } });
  },

  // Lưu điểm số của một bài tập
  saveGrades: async (data: {
    assignmentId: string;
    grades: { studentId: string; score: number; feedback?: string }[];
  }): Promise<IBackendRes<void>> => {
    return await api.post(`/api/v1/grades`, data);
  },

  // Tạo bài tập mới
  createAssignment: async (data: {
    classId: string;
    title: string;
    description?: string;
    dueDate: string;
    maxScore?: number;
    category?: string;
  }): Promise<IBackendRes<IAssignment>> => {
    return await api.post(`/api/v1/classes/${data.classId}/activities`, data);
  },

  // Lấy danh sách bài tập của lớp
  getAssignments: async (classId: string): Promise<IBackendRes<IAssignment[]>> => {
    return await api.get(`/api/v1/classes/${classId}/activities`);
  },

  // Lấy danh sách điểm số của học sinh trong lớp học cụ thể
  getStudentGrades: async (classId: string): Promise<IBackendRes<{
    classroom: {
      _id: string;
      name: string;
      subject: string;
      teacher: {
        _id: string;
        name: string;
        avatar: string;
      };
    };
    assignments: IAssignment[];
    grades: IGrade[];
  }>> => {
    return await api.get(`/api/v1/grades/student`, { params: { classId } });
  },

  // Lấy danh sách bài tập của học sinh kèm trạng thái nộp bài và điểm số
  getStudentAssignments: async (): Promise<IBackendRes<any[]>> => {
    return await api.get('/api/v1/activities/student');
  },

  // Lấy chi tiết bài tập
  getAssignmentDetail: async (id: string): Promise<IBackendRes<IAssignment>> => {
    return await api.get(`/api/v1/activities/${id}`);
  },

  // Học sinh nộp bài tập
  submitAssignment: async (
    id: string,
    data: { submissionText?: string; attachments?: ISubmissionAttachment[] }
  ): Promise<IBackendRes<ISubmission>> => {
    try {
      return await api.post(`/api/v1/activities/${id}/submit`, data);
    } catch {
      return { data: null } as any;
    }
  },

  // Học sinh lấy bài đã nộp cá nhân
  getMySubmission: async (id: string): Promise<IBackendRes<ISubmission | null>> => {
    try {
      return await api.get(`/api/v1/activities/${id}/my-submission`);
    } catch {
      return { data: null } as any;
    }
  },

  // Học sinh thêm bình luận vào bài nộp
  addComment: async (id: string, text: string): Promise<IBackendRes<ISubmission>> => {
    return await api.post(`/api/v1/activities/${id}/my-submission/comments`, { text });
  },

  // Giáo viên lấy danh sách bài nộp của cả lớp cho bài tập này
  getAssignmentSubmissions: async (id: string): Promise<IBackendRes<ISubmission[]>> => {
    try {
      return await api.get(`/api/v1/activities/${id}/submissions`);
    } catch {
      return { data: [] } as any;
    }
  },
};
