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
router.post('/:userId', authenticate, subscribe);
router.delete('/:userId', authenticate, unsubscribe);
router.get('/:userId/check', authenticate, checkSubscription);

export default router;
