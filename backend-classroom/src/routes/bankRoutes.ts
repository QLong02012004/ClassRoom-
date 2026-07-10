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
