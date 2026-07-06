import { Router } from 'express';
import multer from 'multer';
import { uploadDocx, uploadDocxAI } from '../controllers/uploadController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route to upload a .docx file and extract text
router.post('/docx', upload.single('file'), uploadDocx);
router.post('/docx-ai', upload.single('file'), uploadDocxAI);

export default router;
