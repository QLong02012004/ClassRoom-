/**
 * ============================================================================
 * TÊN FILE: Material.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/Material.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Kho Tài liệu Tham khảo Công khai (Materials).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lưu trữ tên tài liệu (`title`), môn học (`subject`), khối lớp (`grade`), mô tả (`description`).
 *   - Phân loại tệp (`type`: 'pdf', 'doc', 'video', 'link'), dung lượng (`size`), đường dẫn tệp (`fileUrl`).
 *   - Định danh người tải lên (`uploaderId`) và cờ công khai (`isPublic`).
 * ============================================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  subject: string;
  grade: string;
  description: string;
  type: string; // 'pdf', 'doc', 'video', 'link'
  size: string; // e.g., '2.4 MB'
  fileUrl: string; // The URL to the uploaded file or external link
  uploaderId: mongoose.Types.ObjectId; // User who uploaded it
  isPublic: boolean; // Accessible to everyone
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: ['pdf', 'doc', 'video', 'link'] },
    size: { type: String, default: 'Link' },
    fileUrl: { type: String, required: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMaterial>('Material', MaterialSchema);
