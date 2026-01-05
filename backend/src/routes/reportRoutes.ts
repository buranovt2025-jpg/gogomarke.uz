import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReport,
  getReports,
  getAdminReports,
  updateReport,
  getReportStats,
} from '../controllers/reportController';

const router = Router();

router.post('/', authenticate, createReport);
router.get('/', authenticate, getReports);
router.get('/admin', authenticate, getAdminReports);
router.get('/admin/stats', authenticate, getReportStats);
router.patch('/:id', authenticate, updateReport);

export default router;
