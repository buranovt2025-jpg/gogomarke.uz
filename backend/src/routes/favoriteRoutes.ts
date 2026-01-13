import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
} from '../controllers/favoriteController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/favorites - Get user's favorites
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getFavorites
);

// GET /api/favorites/check/:productId - Check if product is in favorites
router.get('/check/:productId',
  authenticate,
  [param('productId').isUUID()],
  checkFavorite
);

// POST /api/favorites/:productId - Add to favorites
router.post('/:productId',
  authenticate,
  [param('productId').isUUID()],
  addToFavorites
);

// DELETE /api/favorites/:productId - Remove from favorites
router.delete('/:productId',
  authenticate,
  [param('productId').isUUID()],
  removeFromFavorites
);

export default router;
