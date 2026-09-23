/**
 * ============================================================================
 * TÊN FILE: ChatSession.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/ChatSession.ts
 * MỤC ĐÍCH:
 *   Model Mongoose lưu trữ các phiên hội thoại (Chat Sessions) giữa học sinh và Trợ lý AI.
 *
 * THUỘC TÍNH:
 *   - userId: ID của học sinh sở hữu cuộc trò chuyện.
 *   - title: Tiêu đề cuộc trò chuyện (tự động tạo từ câu hỏi đầu tiên).
 *   - subject: Môn học gắn liền với cuộc trò chuyện (Toán, Lý, Hóa,...).
 *   - className: Tên lớp học ngữ cảnh (nếu có).
 *   - chapter: Tên bài học/chương đang học.
 *   - messages: Mảng lịch sử các tin nhắn (role: 'user' | 'ai', nội dung, tệp đính kèm).
 *   - timestamps: createdAt, updatedAt.
 * ============================================================================
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IChatAttachment {
  name: string;
  size?: string;
  type?: string;
  previewUrl?: string;
}

export interface IChatMessageItem {
  role: 'user' | 'ai';
  content: string;
  attachments?: IChatAttachment[];
  createdAt: Date;
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject?: string;
  className?: string;
  chapter?: string;
  messages: IChatMessageItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatAttachmentSchema = new Schema<IChatAttachment>(
  {
    name: { type: String, required: true },
    size: { type: String },
    type: { type: String },
    previewUrl: { type: String }
  },
  { _id: false }
);

const ChatMessageItemSchema = new Schema<IChatMessageItem>(
  {
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    attachments: [ChatAttachmentSchema],
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'Cuộc trò chuyện mới' },
    subject: { type: String, default: 'Tổng hợp' },
    className: { type: String },
    chapter: { type: String },
    messages: [ChatMessageItemSchema]
  },
  {
    timestamps: true
  }
);

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

export const ChatSessionModel = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
