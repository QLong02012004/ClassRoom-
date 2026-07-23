import { Router } from 'express';
import { askAssistant } from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint for asking the AI assistant
router.post('/ask', protect, askAssistant);

export default router;
