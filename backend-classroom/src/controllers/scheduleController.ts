import { Request, Response, NextFunction } from 'express';
import { ScheduleModel } from '../models/Schedule';
import { ClassModel } from '../models/Class';

// Lấy danh sách lịch giảng dạy của giáo viên hiện tại
export const getTeacherSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;

        // Lấy toàn bộ lịch dạy của giáo viên này, đồng thời populate thông tin lớp học
        const schedules = await ScheduleModel.find({ teacherId })
            .populate('classId', 'name subject code')
            .sort({ dayOfWeek: 1, startTime: 1 });

        res.status(200).json({
            message: 'Lấy lịch dạy thành công',
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

// Tạo lịch giảng dạy mới
export const createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;
        const { classId, subject, chapter, dayOfWeek, startTime, endTime, progress } = req.body || {};

        if (!classId || !subject || !dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (classId, subject, dayOfWeek, startTime, endTime)' });
        }

        // Kiểm tra xem giáo viên có sở hữu lớp học này không
        const classroom = await ClassModel.findOne({ _id: classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền lên lịch dạy cho lớp học này' });
        }

        const schedule = await ScheduleModel.create({
            classId,
            teacherId,
            subject,
            chapter: chapter || '',
            dayOfWeek: Number(dayOfWeek),
            startTime,
            endTime,
            progress: Number(progress) || 0
        });

        res.status(201).json({
            message: 'Tạo lịch dạy thành công',
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Xóa lịch giảng dạy
export const deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;

        if (!id) {
            return res.status(400).json({ message: 'Thiếu ID lịch dạy' });
        }

        const schedule = await ScheduleModel.findOneAndDelete({ _id: id as any, teacherId });
        if (!schedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch dạy hoặc bạn không có quyền xóa' });
        }

        res.status(200).json({
            message: 'Xóa lịch dạy thành công',
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};
