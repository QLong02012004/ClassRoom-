/**
 * ============================================================================
 * TÊN FILE: chatController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/chatController.ts
 * MỤC ĐÍCH:
 *   Tích hợp Trợ lý Trí tuệ Nhân tạo AI (Google Gemini 2.5 Flash API) hỗ trợ giải đáp
 *   thắc mắc học tập, giải bài tập và hướng dẫn sử dụng hệ thống cho Học sinh / Giáo viên.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nhận câu hỏi từ Client (`/api/v1/chat/ask`).
 *   - Tiếp nhận `classContext` (Lớp học, Môn học, Khối lớp) từ frontend.
 *   - Kiểm tra `GEMINI_API_KEY` từ biến môi trường (`process.env`).
 *   - Gửi Prompt chuẩn hóa tới SDK `@google/generative-ai` gắn ngữ cảnh môn học & lớp học.
 *   - Trả lời về cho Client dưới dạng văn bản Markdown ngắn gọn, dễ đọc.
 * ============================================================================
 */

import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, classContext, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung tin nhắn hoặc file đính kèm.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      res.status(500).json({ success: false, message: 'Server chưa được cấu hình GEMINI_API_KEY.' });
      return;
    }

    // Process Multimodal Attachments (Images, PDFs, Text files)
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

    // Dynamic Context String
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

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptText = `
Bạn là "Trợ lý học tập ClassRoom", một AI CHỈ phục vụ cho mục đích giáo dục và học tập trong hệ thống ClassRoom.

${contextPrompt}

NGUYÊN TẮC HOẠT ĐỘNG (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI CÁC CÂU HỎI LIÊN QUAN ĐẾN:
   - Kiến thức các môn học (Toán, Lý, Hóa, Văn, Anh, Sinh, Sử, Địa...).
   - Giải bài tập, giải thích khái niệm học thuật, tóm tắt bài học.
   - Hướng dẫn sử dụng hệ thống ClassRoom, thông báo lớp học.
   - Đọc, phân tích và giải bài tập từ hình ảnh/tài liệu đính kèm do học sinh tải lên.
2. TỪ CHỐI TẤT CẢ CÁC CHỦ ĐỀ KHÁC: Tin tức, chính trị, giải trí (game, phim ảnh), đời sống, lập trình phần mềm (trừ môn Tin học phổ thông), hướng dẫn làm việc phi đạo đức/phi pháp, hoặc các câu hỏi không mang tính chất học tập.
3. KHI TỪ CHỐI, HÃY DÙNG CÂU NÀY: "Xin lỗi, tôi là Trợ lý học tập ClassRoom. Tôi chỉ được thiết lập để hỗ trợ các kiến thức môn học và dữ liệu trong hệ thống giáo dục này. Vui lòng đặt câu hỏi khác liên quan đến việc học nhé!"
4. Nếu học sinh gửi kèm hình ảnh/tài liệu bài tập, hãy đọc trực tiếp và phân tích chính xác từng câu/bài theo yêu cầu của học sinh.
5. Nếu câu hỏi hợp lệ, hãy trả lời ngắn gọn, súc tích, dễ hiểu và sát với chương trình lớp học của học sinh.

Câu hỏi/Yêu cầu của học sinh:
${message || '(Học sinh đã tải lên file/hình ảnh đính kèm bài tập)'}
    `;

    const contentPayload = inlineParts.length > 0 ? [promptText, ...inlineParts] : promptText;
    const aiResponse = await model.generateContent(contentPayload);
    const aiText = aiResponse.response.text();

    res.status(200).json({
      success: true,
      data: {
        reply: aiText
      },
      message: 'Lấy câu trả lời thành công'
    });
  } catch (error: any) {
    console.error('Error in chat controller:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gọi Trợ lý AI', error: error.message });
  }
};

