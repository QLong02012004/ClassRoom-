export interface IBackendRes<T> {
  error?: string | string[];
  message: string;
  statusCode?: number | string;
  data?: T;
  user?: T; // Được thêm vào dựa theo cấu trúc response API bạn cung cấp
}

export interface IModelPaginate<T> {
  meta: {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  results: T[];
}

export interface IModelUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
  status?: string;
}

// Shape của response.data khi gọi /auth/login
export interface ILoginData {
  accessToken: string;
  user: IModelUser;
}
