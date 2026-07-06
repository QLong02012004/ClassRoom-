import { Request, Response } from 'express';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const uploadDocx = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp file .docx' });
      return;
    }

    // Extract raw text from the DOCX buffer using mammoth
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    res.status(200).json({
      success: true,
      text: text,
      messages: result.messages // Any warnings/errors from mammoth
    });
  } catch (error) {
    console.error('Error parsing docx file:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đọc file .docx', error });
  }
};

export const uploadDocxAI = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp file .docx' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      res.status(500).json({ success: false, message: 'Server chưa được cấu hình GEMINI_API_KEY.' });
      return;
    }

    // 1. Extract raw text from the DOCX buffer using mammoth
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const rawText = result.value;

    if (!rawText.trim()) {
      res.status(400).json({ success: false, message: 'File Word không có nội dung văn bản.' });
      return;
    }

    // 2. Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Bạn là một chuyên gia giáo dục. Hãy đọc nội dung bài giảng hoặc tài liệu sau đây và tự động tạo ra một bộ câu hỏi trắc nghiệm.
Nếu nội dung đã có sẵn các câu hỏi trắc nghiệm, hãy trích xuất chúng. Nếu nội dung chỉ là lý thuyết, hãy tự suy luận và tạo ra khoảng 5-10 câu hỏi trắc nghiệm bám sát nội dung.

YÊU CẦU ĐẦU RA (OUTPUT FORMAT):
Chỉ trả về MỘT mảng JSON hợp lệ, không chứa bất kỳ văn bản giải thích nào khác (không bọc trong markdown \`\`\`json). 
Cấu trúc mỗi object trong mảng phải chính xác như sau:
[
  {
    "questionText": "Nội dung câu hỏi ở đây?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctOptionIndex": 0,
    "points": 1
  }
]
Chú ý:
- "options" phải luôn là mảng gồm đúng 4 chuỗi (không kèm chữ A., B., C., D. ở đầu).
- "correctOptionIndex" là số nguyên từ 0 đến 3 tương ứng với vị trí đáp án đúng trong mảng options.
- "points" luôn là 1.

TÀI LIỆU ĐẦU VÀO:
${rawText}
    `;

    const aiResponse = await model.generateContent(prompt);
    let aiText = aiResponse.response.text();

    // Clean up potential markdown formatting from AI response
    aiText = aiText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(aiText);
    } catch (parseError) {
      console.error('Lỗi khi parse JSON từ AI:', aiText);
      res.status(500).json({ success: false, message: 'AI trả về dữ liệu không đúng định dạng JSON.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: questions,
      message: 'AI đã tạo câu hỏi thành công!'
    });
  } catch (error: any) {
    console.error('Error generating AI questions:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gọi AI sinh câu hỏi', error: error.message });
  }
};

