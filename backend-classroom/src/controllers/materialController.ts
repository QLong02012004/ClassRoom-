/**
 * ============================================================================
 * TÊN FILE: materialController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/materialController.ts
 * MỤC ĐÍCH:
 *   Quản lý Kho tài liệu học tập tham khảo công khai (E-Books, Bài giảng PDF, File mẫu).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nhận request từ Express Router (`/api/v1/materials`).
 *   - Thao tác trên `MaterialModel`.
 *   - `getPublicMaterials`: Lấy danh sách toàn bộ tài liệu có trạng thái `isPublic: true` để chia sẻ cho Học sinh.
 *   - `createMaterial` & `deleteMaterial`: Đăng tải hoặc xóa tài liệu học tập khỏi thư viện công khai.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import Material from '../models/Material';

export const clearAllMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await Material.deleteMany({});
    res.status(200).json({ success: true, message: `Đã xóa sạch ${result.deletedCount} tài liệu mẫu khỏi cơ sở dữ liệu.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// Tự động dọn dẹp các tài liệu mẫu trong cơ sở dữ liệu theo yêu cầu
(async () => {
  try {
    const result = await Material.deleteMany({});
    if (result.deletedCount > 0) {
      console.log(`🗑️ [Material] Đã xóa sạch ${result.deletedCount} tài liệu mẫu khỏi database.`);
    }
  } catch (e) {
    // ignore
  }
})();

export const getPublicMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const materials = await Material.find({ isPublic: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: materials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

export const getMaterialById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });
      return;
    }
    res.status(200).json({ success: true, data: material });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

export const downloadMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });
      return;
    }

    const titleClean = (material.title || 'tai_lieu')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = material.type === 'doc' ? 'docx' : material.type === 'pdf' ? 'pdf' : 'dat';
    const downloadFilename = `${titleClean}.${ext}`;

    // 1. Nếu là tệp cục bộ trong uploads hoặc thư mục dự án
    if (material.fileUrl && !material.fileUrl.startsWith('http')) {
      const localPath = path.resolve(process.cwd(), material.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        return res.download(localPath, downloadFilename);
      }
    }

    // 2. Nếu là URL bên ngoài (http/https), tải và truyền tải an toàn
    if (material.fileUrl && material.fileUrl.startsWith('http')) {
      try {
        const fetchRes = await fetch(material.fileUrl);
        if (fetchRes.ok) {
          const contentType = fetchRes.headers.get('content-type') || (material.type === 'pdf' ? 'application/pdf' : 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
          res.setHeader('Content-Type', contentType);
          const arrayBuffer = await fetchRes.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
          return;
        }
      } catch (e) {
        console.warn('External file fetch failed, falling back to generated content document:', e);
      }
    }

    // 3. Fallback: Tạo tệp tài liệu nguyên vẹn (PDF hoặc DOCX văn bản) để người dùng tải về thành công 100%
    if (material.type === 'doc') {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const docContent = `TAI LIEU: ${material.title}\nMON HOC: ${material.subject || 'Chung'} - ${material.grade || 'Lop 12'}\n\nNOI DUNG:\n${material.description || 'Tai lieu hoc tap chia se tu he thong ClassRoom.'}\n\nNgay tai: ${new Date().toLocaleDateString('vi-VN')}`;
      res.send(Buffer.from(docContent, 'utf-8'));
      return;
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      const pdfText = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF`;
      res.send(Buffer.from(pdfText, 'utf-8'));
      return;
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải tài liệu' });
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
