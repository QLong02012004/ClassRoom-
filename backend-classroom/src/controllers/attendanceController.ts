import { Request, Response, NextFunction } from 'express';
import { AttendanceModel } from '../models/Attendance';
import { GoogleSheetsService } from '../services/googleSheetsService';

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

        // Tự động kích hoạt đồng bộ sang Google Sheet bất đồng bộ (Fire & Forget)
        if (attendance && attendance._id) {
            GoogleSheetsService.syncAttendanceToSheet(attendance._id.toString()).catch(err => {
                console.error('[GoogleSheetSync Background Lỗi]:', err);
            });
        }

        res.status(200).json({
            message: 'Lưu điểm danh thành công',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// Lấy lịch sử 30 buổi điểm danh gần nhất của lớp
export const getAttendanceHistory = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId } = req.params;

        if (!classId) {
            return res.status(400).json({ message: 'Thiếu classId' });
        }

        const history = await AttendanceModel.find({ classId })
            .sort({ date: -1 })
            .limit(30);

        res.status(200).json({
            message: 'Lấy lịch sử điểm danh thành công',
            data: history
        });
    } catch (error) {
        next(error);
    }
};
