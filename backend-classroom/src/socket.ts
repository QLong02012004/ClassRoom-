import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Client Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};

export const notifyAdminStatsUpdate = () => {
  if (io) {
    console.log('📡 [Socket.io] Phát tín hiệu admin_stats_update...');
    io.emit('admin_stats_update');
  }
};
