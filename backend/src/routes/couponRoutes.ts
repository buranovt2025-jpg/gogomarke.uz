import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCoupon,
  getCoupons,
  validateCoupon,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController';

const router = Router();

router.post('/', authenticate, createCoupon);
router.get('/', authenticate, getCoupons);
router.post('/validate', validateCoupon);
router.post('/apply', authenticate, applyCoupon);
router.patch('/:id', authenticate, updateCoupon);
router.delete('/:id', authenticate, deleteCoupon);

export default router;
