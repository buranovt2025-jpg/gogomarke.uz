import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  addToHistory,
  getHistory,
  clearHistory,
  removeFromHistory,
} from '../controllers/viewHistoryController';

const router = Router();

router.get('/', authenticate, getHistory);
router.post('/', authenticate, addToHistory);
router.delete('/', authenticate, clearHistory);
router.delete('/:id', authenticate, removeFromHistory);

export default router;
