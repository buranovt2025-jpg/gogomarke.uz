import { Response } from 'express';
import Dispute from '../models/Dispute';
import Order from '../models/Order';
import User from '../models/User';
import { DisputeStatus, UserRole, OrderStatus, PaymentStatus } from '../types';
import { AuthRequest } from '../middleware/auth';
import notificationService from '../services/notificationService';

export const createDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const { orderId, reason, description, evidence } = req.body;

    if (!orderId || !reason || !description) {
      res.status(400).json({
        success: false,
        error: 'Order ID, reason, and description are required',
      });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only create disputes for your own orders',
      });
      return;
    }

    const existingDispute = await Dispute.findOne({
      where: { orderId },
    });

    if (existingDispute) {
      res.status(400).json({
        success: false,
        error: 'A dispute already exists for this order',
      });
      return;
    }

    const dispute = await Dispute.create({
      orderId,
      reporterId: user.id,
      reason,
      description,
      evidence: evidence || [],
      status: DisputeStatus.OPEN,
    });

    await order.update({ status: OrderStatus.DISPUTED });

    // CRITICAL: Block seller's funds if order was delivered
    // This prevents seller from withdrawing funds until dispute is resolved
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      const seller = await User.findByPk(order.sellerId);
      if (seller) {
        const sellerAmount = Number(order.sellerAmount) || 0;
        const currentAvailable = Number(seller.availableBalance) || 0;
        
        // Move funds from available to pending (blocked)
        if (currentAvailable >= sellerAmount) {
          seller.availableBalance = currentAvailable - sellerAmount;
          seller.pendingBalance = (Number(seller.pendingBalance) || 0) + sellerAmount;
          await seller.save();
        }
      }
    }

    // Notify seller about the dispute
    await notificationService.notifyDispute(
      order.sellerId, 
      order.orderNumber, 
      'Открыта претензия по вашему заказу'
    );

    // Notify admin about new dispute
    const admins = await User.findAll({ where: { role: UserRole.ADMIN } });
    for (const admin of admins) {
      await notificationService.notifyDispute(
        admin.id,
        order.orderNumber,
        `Новая претензия от ${user.firstName} ${user.lastName}`
      );
    }

    res.status(201).json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dispute',
    });
  }
};

export const getDisputes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const { status, page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

        if (user.role !== UserRole.ADMIN) {
          where.reporterId = user.id;
        }

        const { count, rows: disputes } = await Dispute.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
            { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone'] },
          ],
        },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'assignedAdmin', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: disputes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get disputes',
    });
  }
};

export const getDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const { id } = req.params;

    const dispute = await Dispute.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
            { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone'] },
          ],
        },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'assignedAdmin', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!dispute) {
      res.status(404).json({
        success: false,
        error: 'Dispute not found',
      });
      return;
    }

    if (user.role !== UserRole.ADMIN && dispute.reporterId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dispute',
    });
  }
};

export const updateDisputeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const { id } = req.params;
    const { status, resolution, winner } = req.body; // winner: 'buyer' | 'seller'

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only admins can update dispute status',
      });
      return;
    }

    const dispute = await Dispute.findByPk(id, {
      include: [{ model: Order, as: 'order' }]
    });
    if (!dispute) {
      res.status(404).json({
        success: false,
        error: 'Dispute not found',
      });
      return;
    }

    const order = dispute.order;
    const updateData: Record<string, unknown> = { status };

    if (!dispute.assignedAdminId) {
      updateData.assignedAdminId = user.id;
    }

    if (status === DisputeStatus.RESOLVED || status === DisputeStatus.CLOSED) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();

      // Handle fund distribution based on winner
      if (winner && order) {
        const seller = await User.findByPk(order.sellerId);
        const buyer = await User.findByPk(order.buyerId);
        const sellerAmount = Number(order.sellerAmount) || 0;

        if (winner === 'seller' && seller) {
          // Return blocked funds to seller's available balance
          seller.pendingBalance = Math.max(0, (Number(seller.pendingBalance) || 0) - sellerAmount);
          seller.availableBalance = (Number(seller.availableBalance) || 0) + sellerAmount;
          await seller.save();
          
          // Update order status back to delivered
          await order.update({ status: OrderStatus.DELIVERED });
          
          // Notify parties
          await notificationService.notifyDisputeResolved(
            order.buyerId, 
            order.sellerId, 
            order.orderNumber, 
            'seller_wins'
          );
        } else if (winner === 'buyer' && buyer && seller) {
          // Refund buyer - deduct from seller's pending balance
          seller.pendingBalance = Math.max(0, (Number(seller.pendingBalance) || 0) - sellerAmount);
          seller.totalEarnings = Math.max(0, (Number(seller.totalEarnings) || 0) - sellerAmount);
          await seller.save();
          
          // Mark order as refunded
          await order.update({ 
            status: OrderStatus.CANCELLED, 
            paymentStatus: PaymentStatus.REFUNDED,
            cancelReason: `Dispute resolved in favor of buyer: ${resolution}`
          });
          
          // Notify parties
          await notificationService.notifyDisputeResolved(
            order.buyerId, 
            order.sellerId, 
            order.orderNumber, 
            'buyer_wins'
          );
        }
      }
    }

    await dispute.update(updateData);

    res.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Update dispute status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dispute status',
    });
  }
};

export const getDisputesByOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const dispute = await Dispute.findOne({
      where: { orderId },
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'assignedAdmin', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Get dispute by order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dispute',
    });
  }
};
