import { Router } from 'express';
import { 
  getCourierStats,
  getAvailableOrders,
  getActiveOrders,
  getOrderHistory,
  acceptOrder,
  pickupOrder,
  deliverOrder,
  cancelDelivery,
  getCourierBalance,
  getCourierEarnings
} from '../controllers/courierController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Stats
router.get('/stats', authenticate, authorize(UserRole.COURIER), getCourierStats);

// Orders
router.get('/orders/available', authenticate, authorize(UserRole.COURIER), getAvailableOrders);
router.get('/orders/active', authenticate, authorize(UserRole.COURIER), getActiveOrders);
router.get('/orders/history', authenticate, authorize(UserRole.COURIER), getOrderHistory);

// Order actions
router.post('/orders/:id/accept', authenticate, authorize(UserRole.COURIER), acceptOrder);
router.post('/orders/:id/pickup', authenticate, authorize(UserRole.COURIER), pickupOrder);
router.post('/orders/:id/deliver', authenticate, authorize(UserRole.COURIER), deliverOrder);
router.post('/orders/:id/cancel', authenticate, authorize(UserRole.COURIER), cancelDelivery);

// Balance and earnings
router.get('/balance', authenticate, authorize(UserRole.COURIER), getCourierBalance);
router.get('/earnings', authenticate, authorize(UserRole.COURIER), getCourierEarnings);

export default router;
