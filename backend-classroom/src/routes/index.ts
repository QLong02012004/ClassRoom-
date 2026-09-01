/**
 * ============================================================================
 * TÊN FILE: index.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/index.ts
 * MỤC ĐÍCH:
 *   Router Tổng (Master API Router) hợp nhất toàn bộ các đường dẫn phụ thành tiền tố API `/api/v1`.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Gom các sub-routers: Auth, Users, Dashboard, Classrooms, Attendance, Grades, Schedule, Announcements, Notifications, Bank, Analytics, Chat, Material, Settings, Upload.
 * ============================================================================
 */

import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import dashboardRoutes from './dashboardRoutes';
import classroomRoutes from './classroomRoutes';
import attendanceRoutes from './attendanceRoutes';
import gradeRoutes from './gradeRoutes';
import scheduleRoutes from './scheduleRoutes';
import announcementRoutes from './announcementRoutes';
import notificationRoutes from './notificationRoutes';
import uploadRoutes from './uploadRoutes';
import bankRoutes from './bankRoutes';
import activityRoutes from './activityRoutes';
import analyticsRoutes from './analyticsRoutes';
import chatRoutes from './chatRoutes';
import materialRoutes from './materialRoutes';
import settingsRoutes from './settingsRoutes';

const apiRouter = Router();

// Toàn bộ các route bên trong authRoutes sẽ có tiền tố là /v1/auth
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/classrooms', classroomRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/grades', gradeRoutes);
apiRouter.use('/schedule', scheduleRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/bank', bankRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/materials', materialRoutes);
apiRouter.use('/', activityRoutes);

export default apiRouter;