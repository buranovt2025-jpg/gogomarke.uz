import { Router } from 'express';
import {
  getSubscriptions,
  getFollowers,
  subscribe,
  unsubscribe,
  checkSubscription,
} from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSubscriptions);
router.get('/followers', authenticate, getFollowers);
router.post('/', authenticate, subscribe);
router.get('/:sellerId/check', authenticate, checkSubscription);
router.delete('/:sellerId', authenticate, unsubscribe);

export default router;
