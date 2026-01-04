import { Router } from 'express';
import { mockPayment, getFinancialOverview, getSellerWallet } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/mock-pay', authenticate, mockPayment);
router.get('/financial-overview', authenticate, getFinancialOverview);
router.get('/wallet', authenticate, getSellerWallet);

export default router;
