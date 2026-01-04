import { Router } from 'express';
import { getSellerStats, getSellerOrders, getSellerAnalytics } from '../controllers/sellerController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/stats', authenticate, authorize(UserRole.SELLER), getSellerStats);
router.get('/orders', authenticate, authorize(UserRole.SELLER), getSellerOrders);
router.get('/analytics', authenticate, authorize(UserRole.SELLER), getSellerAnalytics);

export default router;
