import { Router } from 'express';
import { 
  initializePayment,
  paymeWebhook,
  clickWebhook,
  mockPayment, 
  getFinancialOverview, 
  getSellerWallet 
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Payment initialization
router.post('/initialize', authenticate, initializePayment);

// Payment provider webhooks (no auth - verified internally)
router.post('/payme/webhook', paymeWebhook);
router.post('/click/webhook', clickWebhook);

// Mock payment for testing
router.post('/mock-pay', authenticate, mockPayment);

// Financial endpoints
router.get('/financial-overview', authenticate, getFinancialOverview);
router.get('/wallet', authenticate, getSellerWallet);

export default router;
