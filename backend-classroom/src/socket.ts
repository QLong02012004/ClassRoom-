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

export const notifyTeacherClassroomsUpdate = (teacherId: string) => {
  if (io) {
    console.log(`📡 [Socket.io] Phát tín hiệu teacher_classrooms_update cho teacher: ${teacherId}`);
    io.emit('teacher_classrooms_update', teacherId);
  }
};

export const notifyNotificationUpdate = (recipientId?: string) => {
  if (io) {
    console.log(`📡 [Socket.io] Phát tín hiệu notification_update...`);
    io.emit('notification_update', recipientId);
  }
};

export const notifyStudentClassroomsUpdate = (studentId?: string) => {
  if (io) {
    console.log(`📡 [Socket.io] Phát tín hiệu student_classrooms_update...`);
    io.emit('student_classrooms_update', studentId);
  }
};

export const notifySettingsUpdate = () => {
  if (io) {
    console.log('📡 [Socket.io] Phát tín hiệu settings_update...');
    io.emit('settings_update');
  }
};

export const notifyClassroomFeedUpdate = (classId?: string) => {
  if (io) {
    console.log(`📡 [Socket.io] Phát tín hiệu classroom_feed_update cho classId: ${classId || 'all'}`);
    io.emit('classroom_feed_update', classId);
  }
};

export const notifySubmissionUpdate = (data?: { assignmentId?: string; classId?: string }) => {
  if (io) {
    console.log(`📡 [Socket.io] Phát tín hiệu submission_update...`, data);
    io.emit('submission_update', data);
  }
};
