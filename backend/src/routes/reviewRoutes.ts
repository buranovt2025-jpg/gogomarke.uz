import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReview,
  getProductReviews,
  getSellerReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/my', authenticate, getMyReviews);
router.get('/product/:productId', getProductReviews);
router.get('/seller/:sellerId', getSellerReviews);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
