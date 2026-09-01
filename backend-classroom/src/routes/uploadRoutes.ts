/**
 * ============================================================================
 * TÊN FILE: uploadRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/uploadRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Upload tập tin (`/api/v1/upload/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `/file`: Upload file đính kèm lên Supabase Cloud Storage.
 *   - `/docx`: Upload file Word `.docx` trích xuất nội dung văn bản thuần.
 *   - `/docx-ai`: Upload file Word `.docx` cho AI tự động bóc tách bộ câu hỏi trắc nghiệm.
 * ============================================================================
 */

import { Router } from 'express';
import multer from 'multer';
import { uploadDocx, uploadDocxAI, uploadFile } from '../controllers/uploadController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route to upload a general file to Supabase
router.post('/file', upload.single('file'), uploadFile);

// Route to upload a .docx file and extract text
router.post('/docx', upload.single('file'), uploadDocx);
router.post('/docx-ai', upload.single('file'), uploadDocxAI);

export default router;
