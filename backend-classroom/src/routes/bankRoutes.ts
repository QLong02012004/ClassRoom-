/**
 * ============================================================================
 * TÊN FILE: bankRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/bankRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Ngân hàng Đề thi & Bài tập (`/api/v1/bank/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Tạo bài tập mẫu (`POST /`), lấy kho bài tập (`GET /`), xem chi tiết (`GET /:id`), cập nhật (`PUT /:id`), xóa (`DELETE /:id`).
 * ============================================================================
 */

import express from 'express';
import { createBankItem, getMyBankItems, getBankItemById, updateBankItem, deleteBankItem } from '../controllers/bankController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect); // Requires authentication for all routes

router.post('/', createBankItem);
router.get('/', getMyBankItems);
router.get('/:id', getBankItemById);
router.put('/:id', updateBankItem);
router.delete('/:id', deleteBankItem);

export default router;
