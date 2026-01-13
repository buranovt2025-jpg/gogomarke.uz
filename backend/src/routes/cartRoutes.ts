import { Router } from 'express';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartCount,
} from '../controllers/cartController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCart);
router.post('/items', authenticate, addCartItem);
router.put('/items/:itemId', authenticate, updateCartItem);
router.delete('/items/:itemId', authenticate, removeCartItem);
router.delete('/', authenticate, clearCart);
router.get('/count', authenticate, getCartCount);

export default router;
