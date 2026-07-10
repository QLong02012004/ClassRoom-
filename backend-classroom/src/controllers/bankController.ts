import { Request, Response } from 'express';
import { BankItemModel } from '../models/BankItem';

export const createBankItem = async (req: Request, res: Response) => {
    try {
        const itemData = req.body;
        // In a real app we'd get teacherId from auth token (e.g., req.user._id)
        // For now, assuming teacherId is passed or we get it from req.user
        const teacherId = (req as any).user?._id || req.body.teacherId;

        const newItem = new BankItemModel({
            ...itemData,
            teacherId
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo item ngân hàng', error });
    }
};

export const getMyBankItems = async (req: Request, res: Response) => {
    try {
        const teacherId = (req as any).user?._id || req.query.teacherId;
        const items = await BankItemModel.find({ teacherId }).sort({ createdAt: -1 });
        res.status(200).json({
            message: 'Lấy danh sách thành công',
            data: items
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tải danh sách', error });
    }
};

export const getBankItemById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await BankItemModel.findById(id);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tải chi tiết', error });
    }
};

export const updateBankItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        updateData.updatedAt = new Date();
        const updated = await BankItemModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật', error });
    }
};

export const deleteBankItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await BankItemModel.findByIdAndDelete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa', error });
    }
};
