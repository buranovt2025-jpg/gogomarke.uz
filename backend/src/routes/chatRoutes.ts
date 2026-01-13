import { Router } from 'express';
import { 
  getChats, 
  createChat, 
  getChat, 
  getChatMessages, 
  sendChatMessage, 
  deleteChat,
  getMessages, 
  sendMessage, 
  getUnreadCount 
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

// New chat endpoints (user-to-user)
router.get('/', authenticate, getChats);
router.post('/', authenticate, createChat);
router.get('/:id', authenticate, getChat);
router.get('/:id/messages', authenticate, getChatMessages);
router.post('/:id/messages', authenticate, sendChatMessage);
router.delete('/:id', authenticate, deleteChat);

// Legacy order-based chat endpoints (keep for backward compatibility)
router.get('/unread', authenticate, getUnreadCount);
router.get('/order/:orderId', authenticate, getMessages);
router.post('/order/:orderId', authenticate, sendMessage);

export default router;
