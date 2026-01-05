import { Router } from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
} from '../controllers/favoriteController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getFavorites);
router.post('/', authenticate, addToFavorites);
router.get('/:productId/check', authenticate, checkFavorite);
router.delete('/:productId', authenticate, removeFromFavorites);

export default router;
