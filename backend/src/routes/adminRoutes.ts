import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import * as adminController from '../controllers/adminController';
import * as withdrawalController from '../controllers/withdrawalController';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/verify', adminController.verifyUser);

// Order management
router.get('/orders', adminController.getOrders);

// Transaction management
router.get('/transactions', adminController.getTransactions);

// Statistics
router.get('/stats', adminController.getStats);

// Notifications
router.post('/notifications/broadcast', adminController.broadcastNotification);

// Withdrawal management (Admin endpoints)
router.get('/withdrawals', withdrawalController.adminGetWithdrawals);
router.post('/withdrawals/:id/approve', withdrawalController.adminApproveWithdrawal);
router.post('/withdrawals/:id/reject', withdrawalController.adminRejectWithdrawal);

export default router;
