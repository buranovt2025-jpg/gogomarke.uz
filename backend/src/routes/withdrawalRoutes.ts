import { Router } from 'express';
import { getWithdrawals, requestWithdrawal, getWithdrawalById } from '../controllers/withdrawalController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getWithdrawals);
router.post('/', authenticate, requestWithdrawal);
router.get('/:id', authenticate, getWithdrawalById);

export default router;
