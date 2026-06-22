import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

// Tạo instance axios với cấu hình mặc định
const instance = axios.create({
  baseURL: '', // Để trống để dùng Proxy của Vite (tránh lỗi CORS)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cho phép gửi cookie (cần cho refresh token HTTP-only)
});

// Biến ngăn nhiều request cùng lúc đều gọi refresh token (race condition)
let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Xử lý hàng đợi request sau khi refresh thành công/thất bại
const processQueue = (error: Error | null, token: string | null = null) => {
  failedRequestsQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedRequestsQueue = [];
};

// Interceptor Request: Tự động đính kèm access token vào mọi request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('USER_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Xử lý dữ liệu trả về và tự động refresh khi hết hạn
instance.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp data của response để code gọn hơn
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Chỉ xử lý lỗi 401 và không phải đang retry tránh vòng lặp vô tận
    // Không retry nếu đang gọi chính endpoint refresh-token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Đã có request đang refresh → xếp vào hàng đợi
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (!originalRequest.headers) originalRequest.headers = {};
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return instance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh-token — cookie refresh_token tự gửi kèm (withCredentials)
        const res = await axios.post(
          '/api/v1/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.data?.accessToken;
        if (!newAccessToken) throw new Error('Không nhận được access token mới');

        // Lưu access token mới
        localStorage.setItem('USER_TOKEN', newAccessToken);

        // Cập nhật header cho request gốc và hàng đợi
        instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        // Retry lại request gốc với token mới
        if (!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh token hết hạn hoặc không hợp lệ → đăng xuất
        processQueue(refreshError as Error, null);
        localStorage.removeItem('USER_TOKEN');
        // Dispatch event để AuthContext biết cần logout
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Lấy message lỗi từ backend (nếu có) hoặc dùng lỗi mặc định
    const errorMessage =
      (error.response?.data as any)?.message || 'Đã xảy ra lỗi kết nối đến máy chủ';
    return Promise.reject(new Error(errorMessage));
  }
);

export default instance;
