import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  getAdminTickets,
} from '../controllers/ticketController';

const router = Router();

router.post('/', authenticate, createTicket);
router.get('/', authenticate, getTickets);
router.get('/admin', authenticate, getAdminTickets);
router.get('/:id', authenticate, getTicketById);
router.patch('/:id', authenticate, updateTicket);

export default router;
