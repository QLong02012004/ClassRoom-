import { Request, Response, NextFunction } from 'express';
import { ScheduleModel } from '../models/Schedule';
import { ClassModel } from '../models/Class';

// Các hàm Helper tính thời gian
const timeToMinutes = (timeStr: string) => {
    const [h = 0, m = 0] = (timeStr || "00:00").split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const findOptimalSlots = async (teacherId: string, dayOfWeek: number, excludeId: string | null, durationMins: number) => {
    const query: any = { teacherId, dayOfWeek };
    if (excludeId) query._id = { $ne: excludeId as any };
    const daySchedules = await ScheduleModel.find(query).sort({ startTime: 1 });

    const WORK_START = 7 * 60; // 07:00
    const WORK_END = 22 * 60; // 22:00

    const bookedIntervals = daySchedules.map(s => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime)
    }));

    const mergedIntervals = [];
    if (bookedIntervals.length > 0) {
        let current = bookedIntervals[0]!;
        for (let i = 1; i < bookedIntervals.length; i++) {
            const next = bookedIntervals[i]!;
            if (next.start < current.end) {
                current.end = Math.max(current.end, next.end);
            } else {
                mergedIntervals.push(current);
                current = next;
            }
        }
        mergedIntervals.push(current);
    }

    const gaps = [];
    let lastEnd = WORK_START;
    for (const interval of mergedIntervals) {
        if (interval.start - lastEnd >= durationMins) {
            gaps.push({ start: lastEnd, end: interval.start });
        }
        lastEnd = Math.max(lastEnd, interval.end);
    }
    if (WORK_END - lastEnd >= durationMins) {
        gaps.push({ start: lastEnd, end: WORK_END });
    }

    const suggestions = [];
    for (const gap of gaps) {
        suggestions.push({
            startTime: minutesToTime(gap.start),
            endTime: minutesToTime(gap.start + durationMins)
        });
        if (suggestions.length >= 3) break;

        if (gap.end - (gap.start + durationMins) >= durationMins) {
            suggestions.push({
                startTime: minutesToTime(gap.start + durationMins),
                endTime: minutesToTime(gap.start + durationMins * 2)
            });
        }
        if (suggestions.length >= 3) break;
    }

    return suggestions;
};

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

        // Kiểm tra trùng lịch
        const overlappingSchedule = await ScheduleModel.findOne({
            teacherId,
            dayOfWeek: Number(dayOfWeek),
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        }).populate('classId', 'name');

        if (overlappingSchedule) {
            const className = (overlappingSchedule.classId as any)?.name || 'Khác';
            const reqDuration = timeToMinutes(endTime) - timeToMinutes(startTime);
            const suggestions = await findOptimalSlots(teacherId, Number(dayOfWeek), null, reqDuration);

            return res.status(409).json({
                message: `Lớp ${className} (${overlappingSchedule.subject}) đã được xếp vào ${overlappingSchedule.startTime} - ${overlappingSchedule.endTime}.`,
                suggestions
            });
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

// Cập nhật lịch giảng dạy
export const updateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;
        const { classId, subject, chapter, dayOfWeek, startTime, endTime, progress } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Thiếu ID lịch dạy' });
        }

        const updateData: any = {};
        if (classId !== undefined) updateData.classId = classId;
        if (subject !== undefined) updateData.subject = subject;
        if (chapter !== undefined) updateData.chapter = chapter;
        if (dayOfWeek !== undefined) updateData.dayOfWeek = Number(dayOfWeek);
        if (startTime !== undefined) updateData.startTime = startTime;
        if (endTime !== undefined) updateData.endTime = endTime;
        if (progress !== undefined) updateData.progress = Number(progress);

        // Kiểm tra trùng lịch (loại trừ chính nó)
        if (updateData.dayOfWeek !== undefined || updateData.startTime !== undefined || updateData.endTime !== undefined) {
            // Lấy thông tin lịch hiện tại trước nếu chỉ cập nhật 1 phần
            const currentSchedule = await ScheduleModel.findById(id);
            if (!currentSchedule) {
                return res.status(404).json({ message: 'Không tìm thấy lịch dạy' });
            }

            const checkDayOfWeek = updateData.dayOfWeek !== undefined ? updateData.dayOfWeek : currentSchedule.dayOfWeek;
            const checkStartTime = updateData.startTime !== undefined ? updateData.startTime : currentSchedule.startTime;
            const checkEndTime = updateData.endTime !== undefined ? updateData.endTime : currentSchedule.endTime;

            const overlappingSchedule = await ScheduleModel.findOne({
                _id: { $ne: id as any },
                teacherId,
                dayOfWeek: checkDayOfWeek,
                startTime: { $lt: checkEndTime },
                endTime: { $gt: checkStartTime }
            }).populate('classId', 'name');

            if (overlappingSchedule) {
                const className = (overlappingSchedule.classId as any)?.name || 'Khác';
                const reqDuration = timeToMinutes(checkEndTime) - timeToMinutes(checkStartTime);
                const suggestions = await findOptimalSlots(teacherId as string, checkDayOfWeek, id as string, reqDuration);

                return res.status(409).json({
                    message: `Lớp ${className} (${overlappingSchedule.subject}) đã được xếp vào ${overlappingSchedule.startTime} - ${overlappingSchedule.endTime}.`,
                    suggestions
                });
            }
        }

        const schedule = await ScheduleModel.findOneAndUpdate(
            { _id: id as any, teacherId },
            { $set: updateData },
            { new: true }
        );

        if (!schedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch dạy hoặc bạn không có quyền cập nhật' });
        }

        res.status(200).json({
            message: 'Cập nhật lịch dạy thành công',
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};
