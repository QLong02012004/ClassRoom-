import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp nội dung tin nhắn.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      res.status(500).json({ success: false, message: 'Server chưa được cấu hình GEMINI_API_KEY.' });
      return;
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Bạn là "Trợ lý học tập ClassRoom", một AI CHỈ phục vụ cho mục đích giáo dục và học tập trong hệ thống ClassRoom.

NGUYÊN TẮC HOẠT ĐỘNG (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI CÁC CÂU HỎI LIÊN QUAN ĐẾN:
   - Kiến thức các môn học (Toán, Lý, Hóa, Văn, Anh, Sinh, Sử, Địa...).
   - Giải bài tập, giải thích khái niệm học thuật, tóm tắt bài học.
   - Hướng dẫn sử dụng hệ thống ClassRoom, thông báo lớp học.
2. TỪ CHỐI TẤT CẢ CÁC CHỦ ĐỀ KHÁC: Tin tức, chính trị, giải trí (game, phim ảnh), đời sống, lập trình phần mềm (trừ môn Tin học phổ thông), hướng dẫn làm việc phi đạo đức/phi pháp, hoặc các câu hỏi không mang tính chất học tập.
3. KHI TỪ CHỐI, HÃY DÙNG CÂU NÀY: "Xin lỗi, tôi là Trợ lý học tập ClassRoom. Tôi chỉ được thiết lập để hỗ trợ các kiến thức môn học và dữ liệu trong hệ thống giáo dục này. Vui lòng đặt câu hỏi khác liên quan đến việc học nhé!"
4. Nếu câu hỏi hợp lệ, hãy trả lời ngắn gọn, súc tích, dễ hiểu.

Câu hỏi của học sinh:
${message}
    `;

    const aiResponse = await model.generateContent(prompt);
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
