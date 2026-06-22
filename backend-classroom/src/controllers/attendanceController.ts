import { Request, Response, NextFunction } from 'express';
import { AttendanceModel } from '../models/Attendance';

// Lấy bản ghi điểm danh theo lớp + ngày
export const getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId, date } = req.query;

        if (!classId || !date) {
            return res.status(400).json({ message: 'Thiếu classId hoặc date' });
        }

        // Tìm bản ghi trong ngày đó (so sánh theo ngày, không giờ)
        const startOfDay = new Date(date as string);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date as string);
        endOfDay.setHours(23, 59, 59, 999);

        const record = await AttendanceModel.findOne({
            classId: classId as string,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        res.status(200).json({
            message: 'Lấy điểm danh thành công',
            data: record || null
        });
    } catch (error) {
        next(error);
    }
};

// Lưu / cập nhật điểm danh (upsert)
export const saveAttendance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId, date, records } = req.body;

        if (!classId || !date || !records) {
            return res.status(400).json({ message: 'Thiếu classId, date hoặc records' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Upsert: tạo mới hoặc cập nhật bản ghi trong ngày đó
        const attendance = await AttendanceModel.findOneAndUpdate(
            {
                classId,
                date: { $gte: startOfDay, $lte: endOfDay }
            },
            {
                classId,
                date: new Date(date),
                records
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: 'Lưu điểm danh thành công',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};
