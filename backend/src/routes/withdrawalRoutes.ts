import { Router } from 'express';
import { 
  getWithdrawals, 
  requestWithdrawal, 
  getWithdrawalById,
  getBalance,
} from '../controllers/withdrawalController';
import { authenticate } from '../middleware/auth';

const router = Router();

// User endpoints
router.get('/balance', authenticate, getBalance);
router.get('/', authenticate, getWithdrawals);
router.post('/', authenticate, requestWithdrawal);
router.get('/:id', authenticate, getWithdrawalById);

export default router;
