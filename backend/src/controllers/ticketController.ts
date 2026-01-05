import { Response } from 'express';
import Ticket, { TicketStatus, TicketPriority, TicketCategory } from '../models/Ticket';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { orderId, category, subject, description } = req.body;

        if (!category || !subject || !description) {
          res.status(400).json({ 
            success: false, 
            message: 'Category, subject, and description are required' 
          });
          return;
        }

        if (!Object.values(TicketCategory).includes(category)) {
          res.status(400).json({ 
            success: false, 
            message: 'Invalid category' 
          });
          return;
        }

    const ticket = await Ticket.create({
      userId: user.id,
      orderId: orderId || null,
      category,
      subject,
      description,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    
    if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    }
    
    if (status) {
      where.status = status;
    }

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      tickets,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tickets' });
  }
};

export const getTicketById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'phone'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'phone'],
        },
      ],
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (user.role !== UserRole.ADMIN && ticket.userId !== user.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { status, priority, assignedTo, adminNotes, resolution } = req.body;

    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Only admins can update tickets' });
      return;
    }

    if (status && Object.values(TicketStatus).includes(status)) {
      ticket.status = status;
    }
    if (priority && Object.values(TicketPriority).includes(priority)) {
      ticket.priority = priority;
    }
    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo;
    }
    if (adminNotes !== undefined) {
      ticket.adminNotes = adminNotes;
    }
    if (resolution !== undefined) {
      ticket.resolution = resolution;
    }

    await ticket.save();

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

export const getAdminTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { page = 1, limit = 10, status, priority, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (category) {
      where.category = category;
    }

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'phone', 'role'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'phone'],
        },
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      tickets,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tickets' });
  }
};
