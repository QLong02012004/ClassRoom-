import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import dashboardRoutes from './dashboardRoutes';
import classroomRoutes from './classroomRoutes';
import attendanceRoutes from './attendanceRoutes';
import assignmentRoutes from './assignmentRoutes';
import gradeRoutes from './gradeRoutes';
import scheduleRoutes from './scheduleRoutes';
import announcementRoutes from './announcementRoutes';
import quizRoutes from './quizRoutes';
import notificationRoutes from './notificationRoutes';

const apiRouter = Router();

// Toàn bộ các route bên trong authRoutes sẽ có tiền tố là /v1/auth
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/classrooms', classroomRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/grades', gradeRoutes);
apiRouter.use('/schedule', scheduleRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/quizzes', quizRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;