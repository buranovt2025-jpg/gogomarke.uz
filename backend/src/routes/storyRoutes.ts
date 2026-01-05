import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createStory,
  getStories,
  getMyStories,
  viewStory,
  deleteStory,
} from '../controllers/storyController';

const router = Router();

router.get('/', getStories);
router.get('/my', authenticate, getMyStories);
router.post('/', authenticate, createStory);
router.post('/:id/view', viewStory);
router.delete('/:id', authenticate, deleteStory);

export default router;
