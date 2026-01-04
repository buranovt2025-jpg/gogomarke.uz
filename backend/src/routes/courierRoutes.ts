import { Router } from 'express';
import { getCourierStats } from '../controllers/courierController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/stats', authenticate, authorize(UserRole.COURIER), getCourierStats);

export default router;
