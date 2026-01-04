import { Router } from 'express';
import { getMessages, sendMessage, getUnreadCount } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/unread', authenticate, getUnreadCount);
router.get('/:orderId', authenticate, getMessages);
router.post('/:orderId', authenticate, sendMessage);

export default router;
