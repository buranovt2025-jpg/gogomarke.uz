import { Router } from 'express';
import multer from 'multer';
import { uploadVideo, uploadImage, uploadProductImage } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

router.post('/video', authenticate, upload.single('video'), uploadVideo);
router.post('/image', authenticate, upload.single('image'), uploadImage);
router.post('/product-image', authenticate, upload.single('image'), uploadProductImage);

export default router;
