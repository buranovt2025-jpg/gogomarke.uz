import { Response } from 'express';
import Dispute from '../models/Dispute';
import Order from '../models/Order';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { DisputeStatus, UserRole, OrderStatus, TransactionType, PaymentStatus } from '../types';
import { AuthRequest } from '../middleware/auth';

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
    const { status, resolution, favorBuyer } = req.body;

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only admins can update dispute status',
      });
      return;
    }

    const dispute = await Dispute.findByPk(id, {
      include: [{ model: Order, as: 'order' }],
    });
    if (!dispute) {
      res.status(404).json({
        success: false,
        error: 'Dispute not found',
      });
      return;
    }

    const updateData: Record<string, unknown> = { status };

    if (!dispute.assignedAdminId) {
      updateData.assignedAdminId = user.id;
    }

    if (status === DisputeStatus.RESOLVED || status === DisputeStatus.CLOSED) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();

      // BUG-004: Create financial transactions for dispute resolution
      const order = await Order.findByPk(dispute.orderId);
      if (order) {
        const amount = Number(order.totalAmount) || 0;

        if (favorBuyer === true) {
          // DISPUTE_REFUND: Refund to buyer
          await Transaction.create({
            orderId: order.id,
            userId: order.buyerId,
            type: TransactionType.DISPUTE_REFUND,
            amount: amount,
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Dispute resolved in favor of buyer. Order #${order.orderNumber}`,
            metadata: {
              disputeId: dispute.id,
              resolvedBy: user.id,
              resolution: resolution,
            },
          });

          // Update buyer's balance
          const buyer = await User.findByPk(order.buyerId);
          if (buyer) {
            buyer.availableBalance = Number(buyer.availableBalance || 0) + amount;
            await buyer.save();
          }

          // Update order status
          await order.update({ status: OrderStatus.CANCELLED });
        } else if (favorBuyer === false) {
          // DISPUTE_PAYOUT: Payout to seller
          await Transaction.create({
            orderId: order.id,
            userId: order.sellerId,
            type: TransactionType.DISPUTE_PAYOUT,
            amount: amount,
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Dispute resolved in favor of seller. Order #${order.orderNumber}`,
            metadata: {
              disputeId: dispute.id,
              resolvedBy: user.id,
              resolution: resolution,
            },
          });

          // Update seller's balance
          const seller = await User.findByPk(order.sellerId);
          if (seller) {
            seller.availableBalance = Number(seller.availableBalance || 0) + amount;
            seller.totalEarnings = Number(seller.totalEarnings || 0) + amount;
            await seller.save();
          }

          // Update order status to delivered (seller wins)
          await order.update({ status: OrderStatus.DELIVERED });
        }
      }
    }

    await dispute.update(updateData);

    res.json({
      success: true,
      data: dispute,
      message: status === DisputeStatus.RESOLVED 
        ? `Dispute resolved ${favorBuyer === true ? 'in favor of buyer (DISPUTE_REFUND created)' : favorBuyer === false ? 'in favor of seller (DISPUTE_PAYOUT created)' : ''}`
        : 'Dispute status updated',
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
