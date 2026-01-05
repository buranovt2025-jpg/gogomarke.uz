import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import {
  createDispute,
  getDisputes,
  getDispute,
  updateDisputeStatus,
  getDisputesByOrder,
} from '../controllers/disputeController';

const router = Router();

router.post('/', authenticate, createDispute);
router.get('/', authenticate, getDisputes);
router.get('/order/:orderId', authenticate, getDisputesByOrder);
router.get('/:id', authenticate, getDispute);
router.patch('/:id/status', authenticate, authorize(UserRole.ADMIN), updateDisputeStatus);

export default router;
