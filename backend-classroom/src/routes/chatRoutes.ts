/**
 * ============================================================================
 * TÊN FILE: chatRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/chatRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Endpoint API Trợ lý Trí tuệ Nhân tạo Gemini AI (`POST /api/v1/chat/ask`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Tiếp nhận câu hỏi học tập từ client, bảo mật bằng Middleware `protect` và định tuyến sang `chatController.askAssistant`.
 * ============================================================================
 */

import { Router } from 'express';
import { askAssistant } from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint for asking the AI assistant
router.post('/ask', protect, askAssistant);

export default router;
