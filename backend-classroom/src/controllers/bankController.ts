/**
 * ============================================================================
 * TÊN FILE: bankController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/bankController.ts
 * MỤC ĐÍCH:
 *   Quản lý Ngân hàng Tài nguyên Học tập (Bank Items) gồm Ngân hàng câu hỏi trắc nghiệm,
 *   đề thi mẫu và bài tập dùng chung toàn trung tâm hoặc cá nhân Giáo viên.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nhận request từ Express Router (`/api/v1/bank/*`).
 *   - Thao tác trên `BankItemModel`.
 *   - Phân quyền chia sẻ tài nguyên:
 *     + Admin tạo: `CENTER_SHARED` (Dùng chung cho toàn bộ Giáo viên theo môn học).
 *     + Giáo viên tạo: `PRIVATE` (Chỉ dùng riêng cho lớp của giáo viên đó).
 *
 * THÀNH PHẦN & API CHÍNH:
 *   - `createBankItem`: Tạo đề thi/bài tập mới lưu vào ngân hàng.
 *   - `getMyBankItems`: Lấy danh sách đề thi ngân hàng theo phân quyền role và môn học chuyên môn.
 *   - `getBankItemById`: Xem thông tin chi tiết 1 bài tập/đề thi trong ngân hàng.
 *   - `updateBankItem` & `deleteBankItem`: Chỉnh sửa nội dung câu hỏi hoặc xóa khỏi ngân hàng.
 * ============================================================================
 */

import { Request, Response } from 'express';
import { BankItemModel } from '../models/BankItem';

import { BankItemSharingStatus } from '../models/BankItem';

export const createBankItem = async (req: Request, res: Response) => {
    try {
        const itemData = req.body;
        const user = (req as any).user;
        const teacherId = user?._id || req.body.teacherId;

        // Admin tạo ra tài liệu dùng chung toàn trung tâm (CENTER_SHARED)
        // Giáo viên tạo ra tài liệu cá nhân (PRIVATE)
        const sharingStatus = user?.role === 'admin' 
            ? BankItemSharingStatus.CENTER_SHARED 
            : BankItemSharingStatus.PRIVATE;

        // Nếu là giáo viên, môn học chuyên môn được gán tự động từ thông tin tài khoản của họ
        const subject = user?.role === 'teacher' ? user.subject : (itemData.subject || '');

        const newItem = new BankItemModel({
            ...itemData,
            teacherId,
            sharingStatus,
            subject
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo item ngân hàng', error });
    }
};

export const getMyBankItems = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        
        let query: any = {};
        
        // Nếu là giáo viên, lọc theo môn học chuyên môn và quyền hạn:
        // Chỉ được xem tài liệu CENTER_SHARED của Admin hoặc tài liệu PRIVATE của chính họ
        if (user && user.role === 'teacher') {
            query.subject = user.subject || '';
            query.$or = [
                { sharingStatus: BankItemSharingStatus.CENTER_SHARED },
                { teacherId: user._id }
            ];
        } else if (user && user.role === 'admin') {
            // Admin xem được tất cả tài liệu của chính họ
            query.teacherId = user._id;
        } else if (user && user.role === 'student') {
            // Học sinh xem được tất cả tài liệu/đề thi chung do Admin tạo
            query.sharingStatus = BankItemSharingStatus.CENTER_SHARED;
        } else {
            // Fallback nếu không có session user
            query.teacherId = req.query.teacherId;
        }

        const items = await BankItemModel.find(query).sort({ createdAt: -1 });
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
