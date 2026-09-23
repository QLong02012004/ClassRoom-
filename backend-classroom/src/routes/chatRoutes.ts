/**
 * ============================================================================
 * TÊN FILE: chatRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/chatRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoint API Trợ lý AI Gemini và Quản lý Lịch sử trò chuyện.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `POST /ask`: Gửi câu hỏi cho AI và tự động lưu phiên chat.
 *   - `GET /sessions`: Lấy danh sách lịch sử hội thoại của học sinh.
 *   - `GET /sessions/:id`: Xem chi tiết tin nhắn một phiên chat.
 *   - `DELETE /sessions/:id`: Xóa một phiên chat.
 *   - `DELETE /sessions`: Xóa toàn bộ lịch sử chat.
 * ============================================================================
 */

import { Router } from 'express';
import {
  askAssistant,
  getChatSessions,
  getChatSessionDetail,
  deleteChatSession,
  clearAllChatSessions
} from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Gửi câu hỏi cho trợ lý AI
router.post('/ask', protect, askAssistant);

// Quản lý lịch sử cuộc trò chuyện
router.get('/sessions', protect, getChatSessions);
router.get('/sessions/:id', protect, getChatSessionDetail);
router.delete('/sessions/:id', protect, deleteChatSession);
router.delete('/sessions', protect, clearAllChatSessions);

export default router;
