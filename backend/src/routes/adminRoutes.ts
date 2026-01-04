import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import * as adminController from '../controllers/adminController';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);

router.get('/orders', adminController.getOrders);

router.get('/transactions', adminController.getTransactions);

router.get('/stats', adminController.getStats);

export default router;
