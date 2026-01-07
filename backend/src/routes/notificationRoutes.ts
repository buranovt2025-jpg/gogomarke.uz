import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications (with pagination)
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark all notifications as read
router.post('/mark-all-read', markAllAsRead);

// Clear all notifications
router.delete('/clear-all', clearAllNotifications);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Delete single notification
router.delete('/:id', deleteNotification);

export default router;
