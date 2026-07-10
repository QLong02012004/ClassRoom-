import { Request, Response } from 'express';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel } from '../models/BankItem';

// Giao một hoạt động mới từ ngân hàng cho lớp
export const assignActivity = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { bankItemId, dueDate, category, title, maxScore, description, durationMinutes, status } = req.body;

        const bankItem = await BankItemModel.findById(bankItemId);
        if (!bankItem) return res.status(404).json({ message: 'Không tìm thấy đề trong ngân hàng' });

        const newActivity = new ClassActivityModel({
            classId,
            bankItemId,
            type: bankItem.type,
            title: title || bankItem.title,
            description: description !== undefined ? description : bankItem.description,
            dueDate,
            category,
            maxScore: maxScore || bankItem.maxScore,
            durationMinutes: durationMinutes || bankItem.durationMinutes,
            status: status || 'open'
        });

        await newActivity.save();
        res.status(201).json(newActivity);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi giao hoạt động', error });
    }
};

// Lấy danh sách hoạt động của 1 lớp
export const getClassActivities = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const activities = await ClassActivityModel.find({ classId }).populate('bankItemId').sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách hoạt động', error });
    }
};

// Xem chi tiết một hoạt động
export const getActivityById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activity = await ClassActivityModel.findById(id).populate('bankItemId');
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi', error });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await ClassActivityModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật', error });
    }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ClassActivityModel.findByIdAndDelete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa', error });
    }
};
