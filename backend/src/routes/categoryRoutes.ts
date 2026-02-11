import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
} from '../controllers/categoryController';

const router = Router();

router.get('/', getCategories);
router.get('/id/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);

export default router;