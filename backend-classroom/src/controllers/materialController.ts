import { Request, Response } from 'express';
import Material from '../models/Material';

export const getPublicMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const materials = await Material.find({ isPublic: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: materials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, grade, description, type, size, fileUrl } = req.body;
    
    // In auth middleware, req.user is set
    const uploaderId = (req as any).user._id;

    const newMaterial = new Material({
      title,
      subject,
      grade,
      description,
      type,
      size,
      fileUrl,
      uploaderId,
      isPublic: true,
    });

    const savedMaterial = await newMaterial.save();
    res.status(201).json({ success: true, data: savedMaterial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo tài liệu' });
  }
};

export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);

    if (!material) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });
      return;
    }

    await Material.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Đã xóa tài liệu' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi xóa tài liệu' });
  }
};
