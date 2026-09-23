/**
 * ============================================================================
 * TÊN FILE: chatController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/chatController.ts
 * MỤC ĐÍCH:
 *   Tích hợp Trợ lý Trí tuệ Nhân tạo AI (Google Gemini 2.5 Flash API) hỗ trợ giải đáp
 *   thắc mắc học tập, giải bài tập và lưu trữ lịch sử cuộc trò chuyện (Chat Sessions).
 * ============================================================================
 */

import { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthRequest } from './authController';
import { ChatSessionModel } from '../models/ChatSession';

// 1. Gửi câu hỏi cho Trợ lý AI và tự động lưu phiên chat
export const askAssistant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, classContext, attachments, sessionId } = req.body;
    const userId = req.user?._id;

    if (!message && (!attachments || attachments.length === 0)) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung tin nhắn hoặc file đính kèm.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      res.status(500).json({ success: false, message: 'Server chưa được cấu hình GEMINI_API_KEY.' });
      return;
    }

    // Xử lý đính kèm đa phương tiện (Ảnh, PDF, v.v.)
    const inlineParts = Array.isArray(attachments)
      ? attachments
          .map((att: { name: string; type: string; base64: string }) => {
            if (!att.base64) return null;
            const base64Data = att.base64.replace(/^data:(.*);base64,/, '');
            return {
              inlineData: {
                data: base64Data,
                mimeType: att.type || 'image/jpeg'
              }
            };
          })
          .filter((part): part is { inlineData: { data: string; mimeType: string } } => part !== null)
      : [];

    const contextPrompt = classContext
      ? `
THÔNG TIN NGỮ CẢNH HỌC TẬP VÀ CHƯƠNG ĐANG HỌC CỦA HỌC SINH:
- Lớp học đang tham gia: ${classContext.className || 'Không xác định'}
- Môn học: ${classContext.subject || 'Tổng hợp'}
- Khối lớp: ${classContext.grade || 'Trung học'}
- CHƯƠNG / BÀI HỌC ĐANG HỌC: ${classContext.chapter || 'Tất cả các chương'}

(BẮT BUỘC: Hãy ưu tiên và tập trung áp dụng các công thức, phương pháp giải, bài tập và kiến thức thuộc đúng CHƯƠNG / BÀI HỌC NÀY để hướng dẫn cho học sinh).
`
      : '';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptText = `
Bạn là "Trợ lý học tập ClassRoom", một AI CHỈ phục vụ cho mục đích giáo dục và học tập trong hệ thống ClassRoom.

${contextPrompt}

NGUYÊN TẮC HOẠT ĐỘNG (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI CÁC CÂU HỎI LIÊN QUAN ĐẾN:
   - Kiến thức các môn học (Toán, Lý, Hóa, Văn, Anh, Sinh, Sử, Địa, Tin học...).
   - Giải bài tập, giải thích khái niệm học thuật, tóm tắt bài học.
   - Hướng dẫn phương pháp giải theo từng bước rõ ràng.
   - Đọc, phân tích và giải bài tập từ hình ảnh/tài liệu đính kèm do học sinh tải lên.
2. ĐỊNH DẠNG BÀI GIẢI TOÁN HỌC / KHOA HỌC:
   - Nếu hướng dẫn giải bài tập, BẮT BUỘC chia rõ ràng theo từng bước:
     **Bước 1: ...**
     **Bước 2: ...**
     **Bước 3: ...**
     **Đáp số / Kết luận: ...**
   - Sử dụng cú pháp LaTeX chuẩn để biểu diễn công thức toán học:
     - Công thức cùng dòng (inline): kẹp giữa 1 dấu $ (ví dụ $x^2 + 2x + 1 = 0$, $\\sqrt{a}$, $\\frac{a}{b}$).
     - Công thức khối riêng (block): kẹp giữa 2 dấu $$ (ví dụ $$\\Delta = b^2 - 4ac$$).
3. TỪ CHỐI TẤT CẢ CÁC CHỦ ĐỀ KHÔNG LIÊN QUAN ĐẾN HỌC TẬP. Khi từ chối, dùng câu: "Xin lỗi, tôi là Trợ lý học tập ClassRoom. Tôi chỉ được thiết lập để hỗ trợ các kiến thức môn học và dữ liệu trong hệ thống giáo dục này. Vui lòng đặt câu hỏi khác liên quan đến việc học nhé!"
4. Giữ giọng điệu thân thiện, tích cực, khuyến khích học sinh tự tư duy và hiểu bản chất bài học.

Câu hỏi/Yêu cầu của học sinh:
${message || '(Học sinh đã tải lên file/hình ảnh đính kèm bài tập)'}
    `;

    const contentPayload = inlineParts.length > 0 ? [promptText, ...inlineParts] : promptText;
    const aiResponse = await model.generateContent(contentPayload);
    const aiText = aiResponse.response.text();

    // Chuẩn bị đính kèm lưu lịch sử (không lưu base64 quá nặng)
    const savedAttachments = Array.isArray(attachments)
      ? attachments.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type,
          previewUrl: att.previewUrl
        }))
      : [];

    let currentSession: any = null;

    // Lưu vào MongoDB nếu user đã đăng nhập
    if (userId) {
      if (sessionId) {
        currentSession = await ChatSessionModel.findOne({ _id: sessionId, userId });
      }

      const userMsgItem = {
        role: 'user' as const,
        content: message || 'Đính kèm bài tập',
        attachments: savedAttachments,
        createdAt: new Date()
      };

      const aiMsgItem = {
        role: 'ai' as const,
        content: aiText,
        createdAt: new Date()
      };

      if (currentSession) {
        currentSession.messages.push(userMsgItem, aiMsgItem);
        currentSession.updatedAt = new Date();
        await currentSession.save();
      } else {
        // Tạo session mới với tiêu đề ngắn gọn
        let autoTitle = message ? message.trim().slice(0, 45) : 'Hỏi bài tập';
        if (message && message.length > 45) autoTitle += '...';

        currentSession = await ChatSessionModel.create({
          userId,
          title: autoTitle,
          subject: classContext?.subject || 'Tổng hợp',
          className: classContext?.className,
          chapter: classContext?.chapter,
          messages: [userMsgItem, aiMsgItem]
        });
      }
    }

    res.status(200).json({
      success: true,
      reply: aiText,
      data: {
        reply: aiText
      },
      sessionId: currentSession ? currentSession._id : null,
      session: currentSession
        ? {
            _id: currentSession._id,
            title: currentSession.title,
            subject: currentSession.subject,
            className: currentSession.className,
            chapter: currentSession.chapter,
            updatedAt: currentSession.updatedAt,
            createdAt: currentSession.createdAt
          }
        : null,
      message: 'Lấy câu trả lời thành công'
    });
  } catch (error: any) {
    console.error('Error in chat controller:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gọi Trợ lý AI', error: error.message });
  }
};

// 2. Lấy danh sách lịch sử hội thoại của user
export const getChatSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const sessions = await ChatSessionModel.find({ userId })
      .select('_id title subject className chapter updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: sessions,
      message: 'Lấy danh sách cuộc trò chuyện thành công'
    });
  } catch (error: any) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử cuộc trò chuyện', error: error.message });
  }
};

// 3. Lấy chi tiết tin nhắn của 1 phiên trò chuyện
export const getChatSessionDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    if (!id) {
      res.status(400).json({ success: false, message: 'Thiếu id cuộc trò chuyện' });
      return;
    }

    const session = await ChatSessionModel.findOne({ _id: id, userId }).lean();
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện này' });
      return;
    }

    res.status(200).json({
      success: true,
      data: session,
      message: 'Lấy chi tiết cuộc trò chuyện thành công'
    });
  } catch (error: any) {
    console.error('Error fetching chat session detail:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải chi tiết cuộc trò chuyện', error: error.message });
  }
};

// 4. Xóa 1 cuộc trò chuyện
export const deleteChatSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    if (!id) {
      res.status(400).json({ success: false, message: 'Thiếu id cuộc trò chuyện cần xóa' });
      return;
    }

    const deleted = await ChatSessionModel.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện cần xóa' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa cuộc trò chuyện thành công'
    });
  } catch (error: any) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa cuộc trò chuyện', error: error.message });
  }
};

// 5. Xóa toàn bộ lịch sử trò chuyện
export const clearAllChatSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    await ChatSessionModel.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'Đã xóa toàn bộ lịch sử trò chuyện thành công'
    });
  } catch (error: any) {
    console.error('Error clearing all chat sessions:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa toàn bộ lịch sử', error: error.message });
  }
};
