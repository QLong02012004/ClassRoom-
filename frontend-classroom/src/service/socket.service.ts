/**
 * ============================================================================
 * TÊN FILE: socket.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/socket.service.ts
 * MỤC ĐÍCH:
 *   Quản lý duy nhất 1 kết nối Socket.IO Singleton cho toàn bộ ứng dụng Frontend.
 *
 * TẠI SAO CẦN FILE NÀY:
 *   - Trước đây: Mỗi component/hook tự gọi `io(...)` tạo ra 5-6 kết nối đồng thời,
 *     chiếm hết 6 kết nối HTTP/1.1 tối đa của trình duyệt khiến các API Axios
 *     bị Stalled (nghẽn mạng), gây lag và giật toàn hệ thống.
 *   - Với Singleton: Toàn bộ ứng dụng chia sẻ đúng 1 WebSocket connection duy nhất.
 *     Ưu tiên transport 'websocket' trực tiếp, loại bỏ độ trễ polling.
 * ============================================================================
 */

import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ||
      'http://localhost:5000';

    socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Ưu tiên websocket ngay lập tức
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Shared Socket] Kết nối máy chủ thành công (ID:', socketInstance?.id, ')');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ [Shared Socket] Mất kết nối:', reason);
    });
  }

  return socketInstance;
};
