import { Router } from 'express';
import { 
  getSellerStats, 
  getSellerOrders, 
  getSellerAnalytics,
  getSellerProducts,
  getSellerBalance,
  getSellerTransactions,
  confirmOrder,
  markOrderReady,
  rejectOrder,
  requestWithdrawal,
  getSellerWithdrawals
} from '../controllers/sellerController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Stats and analytics
router.get('/stats', authenticate, authorize(UserRole.SELLER), getSellerStats);
router.get('/analytics', authenticate, authorize(UserRole.SELLER), getSellerAnalytics);

// Orders
router.get('/orders', authenticate, authorize(UserRole.SELLER), getSellerOrders);
router.post('/orders/:id/confirm', authenticate, authorize(UserRole.SELLER), confirmOrder);
router.post('/orders/:id/ready', authenticate, authorize(UserRole.SELLER), markOrderReady);
router.post('/orders/:id/reject', authenticate, authorize(UserRole.SELLER), rejectOrder);

// Products
router.get('/products', authenticate, authorize(UserRole.SELLER), getSellerProducts);

// Balance and transactions
router.get('/balance', authenticate, authorize(UserRole.SELLER), getSellerBalance);
router.get('/transactions', authenticate, authorize(UserRole.SELLER), getSellerTransactions);

// Withdrawals
router.post('/withdraw', authenticate, authorize(UserRole.SELLER), requestWithdrawal);
router.get('/withdrawals', authenticate, authorize(UserRole.SELLER), getSellerWithdrawals);

export default router;
