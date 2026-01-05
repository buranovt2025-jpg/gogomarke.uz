import { Response } from 'express';
import Return, { ReturnStatus, ReturnReason } from '../models/Return';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { UserRole, OrderStatus } from '../types';

export const createReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { orderId, reason, description, images } = req.body;

    if (!orderId || !reason || !description) {
      res.status(400).json({ success: false, error: 'Order ID, reason, and description are required' });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.buyerId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only request returns for your own orders' });
      return;
    }

    if (order.status !== OrderStatus.DELIVERED) {
      res.status(400).json({ success: false, error: 'Returns can only be requested for delivered orders' });
      return;
    }

    const existingReturn = await Return.findOne({ where: { orderId } });
    if (existingReturn) {
      res.status(400).json({ success: false, error: 'A return request already exists for this order' });
      return;
    }

    const returnRequest = await Return.create({
      orderId,
      buyerId: user.id,
      sellerId: order.sellerId,
      reason,
      description,
      images: images || [],
    });

    res.status(201).json({ success: true, data: returnRequest });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ success: false, error: 'Failed to create return request' });
  }
};

export const getReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};

    if (user.role === UserRole.BUYER) {
      where.buyerId = user.id;
    } else if (user.role === UserRole.SELLER) {
      where.sellerId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const { rows: returns, count } = await Return.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ success: false, error: 'Failed to get returns' });
  }
};

export const getReturnById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const returnRequest = await Return.findByPk(id);

    if (!returnRequest) {
      res.status(404).json({ success: false, error: 'Return request not found' });
      return;
    }

    if (
      user.role !== UserRole.ADMIN &&
      returnRequest.buyerId !== user.id &&
      returnRequest.sellerId !== user.id
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({ success: true, data: returnRequest });
  } catch (error) {
    console.error('Get return by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to get return request' });
  }
};

export const updateReturnStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { status, sellerResponse, adminNotes, refundAmount } = req.body;

    const returnRequest = await Return.findByPk(id);
    if (!returnRequest) {
      res.status(404).json({ success: false, error: 'Return request not found' });
      return;
    }

    if (user.role === UserRole.SELLER) {
      if (returnRequest.sellerId !== user.id) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      if (status && ![ReturnStatus.APPROVED, ReturnStatus.REJECTED].includes(status)) {
        res.status(400).json({ success: false, error: 'Sellers can only approve or reject returns' });
        return;
      }

      if (sellerResponse) {
        returnRequest.sellerResponse = sellerResponse;
      }
    } else if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Only sellers and admins can update return status' });
      return;
    }

    if (status) {
      returnRequest.status = status;
    }

    if (adminNotes && user.role === UserRole.ADMIN) {
      returnRequest.adminNotes = adminNotes;
    }

    if (refundAmount !== undefined) {
      returnRequest.refundAmount = refundAmount;
    }

    await returnRequest.save();

    res.json({ success: true, data: returnRequest });
  } catch (error) {
    console.error('Update return status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update return status' });
  }
};

export const getAdminReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const { rows: returns, count } = await Return.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get admin returns error:', error);
    res.status(500).json({ success: false, error: 'Failed to get returns' });
  }
};
