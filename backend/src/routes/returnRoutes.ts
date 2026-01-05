import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReturn,
  getReturns,
  getReturnById,
  updateReturnStatus,
  getAdminReturns,
} from '../controllers/returnController';

const router = Router();

router.post('/', authenticate, createReturn);
router.get('/', authenticate, getReturns);
router.get('/admin', authenticate, getAdminReturns);
router.get('/:id', authenticate, getReturnById);
router.patch('/:id', authenticate, updateReturnStatus);

export default router;
