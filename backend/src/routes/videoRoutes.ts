import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import * as videoController from '../controllers/videoController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/videos - Upload and create video
router.post('/',
  authenticate,
  upload.single('video'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('productId').optional().isUUID(),
    body('categoryId').optional().isUUID(),
  ],
  videoController.createVideo
);

// GET /api/videos - List videos with filters
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('categoryId').optional().isUUID(),
    query('sellerId').optional().isUUID(),
    query('search').optional().trim(),
    query('sortBy').optional().isIn(['createdAt', 'views', 'likes']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  videoController.getVideos
);

// GET /api/videos/:id - Get video details
router.get('/:id',
  [param('id').isUUID()],
  videoController.getVideoById
);

// PUT /api/videos/:id - Update video
router.put('/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  videoController.updateVideo
);

// DELETE /api/videos/:id - Delete video
router.delete('/:id',
  authenticate,
  [param('id').isUUID()],
  videoController.deleteVideo
);

// POST /api/videos/:id/view - Increment view count
router.post('/:id/view',
  [param('id').isUUID()],
  videoController.incrementView
);

// POST /api/videos/:id/like - Toggle like
router.post('/:id/like',
  authenticate,
  [param('id').isUUID()],
  videoController.toggleLike
);

export default router;
