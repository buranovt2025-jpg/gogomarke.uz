import { Response } from 'express';
import { Order, User, Product } from '../models';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus, UserRole } from '../types';
import { Op } from 'sequelize';

export const getCourierStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const totalDeliveries = await Order.count({
      where: { courierId: user.id, status: OrderStatus.DELIVERED },
    });

    const pendingDeliveries = await Order.count({
      where: {
        courierId: user.id,
        status: { [Op.in]: [OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT] },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await Order.count({
      where: {
        courierId: user.id,
        status: OrderStatus.DELIVERED,
        deliveredAt: { [Op.gte]: today },
      },
    });

    const todayEarningsResult = await Order.sum('courierFee', {
      where: {
        courierId: user.id,
        status: OrderStatus.DELIVERED,
        deliveredAt: { [Op.gte]: today },
      },
    });
    const todayEarnings = todayEarningsResult || 0;

    const userData = await User.findByPk(user.id);

    res.json({
      success: true,
      data: {
        totalDeliveries,
        pendingDeliveries,
        completedToday,
        todayEarnings: Number(todayEarnings),
        totalEarnings: Number(userData?.totalEarnings) || 0,
        availableBalance: Number(userData?.availableBalance) || 0,
        pendingBalance: Number(userData?.pendingBalance) || 0,
        rating: 4.8,
      },
    });
  } catch (error) {
    console.error('Get courier stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get courier stats' });
  }
};

export const getAvailableOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Find orders that are confirmed and ready for pickup (no courier assigned yet)
    const where: Record<string, unknown> = {
      status: OrderStatus.CONFIRMED,
      courierId: null,
      sellerQrCode: { [Op.not]: null }, // Order is ready for pickup
    };

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images', 'price'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get available orders' });
  }
};

export const getActiveOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: {
        courierId: user.id,
        status: { [Op.in]: [OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT] },
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images', 'price'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get active orders' });
  }
};

export const getOrderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: {
        courierId: user.id,
        status: { [Op.in]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images', 'price'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['deliveredAt', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get order history' });
  }
};

export const acceptOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.courierId && order.courierId !== user.id) {
      res.status(400).json({ success: false, error: 'Order already assigned to another courier' });
      return;
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      res.status(400).json({ success: false, error: 'Order is not available for pickup' });
      return;
    }

    order.courierId = user.id;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order accepted successfully',
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept order' });
  }
};

export const pickupOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { id } = req.params;
    const { qrCode } = req.body;

    if (!qrCode) {
      res.status(400).json({ success: false, error: 'QR code is required' });
      return;
    }

    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.courierId !== user.id) {
      res.status(403).json({ success: false, error: 'Not your order' });
      return;
    }

    // Verify QR code from seller
    if (order.sellerQrCode !== qrCode) {
      res.status(400).json({ success: false, error: 'Invalid QR code' });
      return;
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      res.status(400).json({ success: false, error: 'Order cannot be picked up' });
      return;
    }

    order.status = OrderStatus.PICKED_UP;
    order.pickedUpAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order picked up successfully',
    });
  } catch (error) {
    console.error('Pickup order error:', error);
    res.status(500).json({ success: false, error: 'Failed to pickup order' });
  }
};

export const deliverOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { id } = req.params;
    const { qrCode } = req.body;

    if (!qrCode) {
      res.status(400).json({ success: false, error: 'QR code is required' });
      return;
    }

    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.courierId !== user.id) {
      res.status(403).json({ success: false, error: 'Not your order' });
      return;
    }

    // Verify QR code from buyer (could be delivery code or buyer QR)
    if (order.courierQrCode !== qrCode && order.deliveryCode !== qrCode) {
      res.status(400).json({ success: false, error: 'Invalid QR code or delivery code' });
      return;
    }

    if (order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.IN_TRANSIT) {
      res.status(400).json({ success: false, error: 'Order must be picked up first' });
      return;
    }

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order delivered successfully',
    });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ success: false, error: 'Failed to deliver order' });
  }
};

export const cancelDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.courierId !== user.id) {
      res.status(403).json({ success: false, error: 'Not your order' });
      return;
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      res.status(400).json({ success: false, error: 'Order cannot be cancelled' });
      return;
    }

    // If order was picked up, just unassign courier
    // If order was only accepted, set back to confirmed
    if (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.IN_TRANSIT) {
      order.status = OrderStatus.CONFIRMED;
      order.courierId = null as any;
      order.pickedUpAt = null as any;
      order.cancelReason = reason || 'Cancelled by courier';
    } else {
      order.courierId = null as any;
    }
    
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Delivery cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel delivery error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel delivery' });
  }
};

export const getCourierBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    // Fake balance response
    const balance = {
      available: 850000,  // UZS
      pending: 150000,
      total: 1000000,
      currency: 'UZS'
    };

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error('Get courier balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get courier balance' });
  }
};

export const getCourierEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.COURIER) {
      res.status(403).json({ success: false, error: 'Courier access required.' });
      return;
    }

    // Fake earnings history
    const earnings = [
      {
        id: 'earn-1',
        orderId: 'order-uuid-1',
        amount: 15000,
        type: 'delivery',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'earn-2',
        orderId: 'order-uuid-2',
        amount: 20000,
        type: 'delivery',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000),
      },
      {
        id: 'earn-3',
        orderId: 'order-uuid-3',
        amount: 15000,
        type: 'delivery',
        status: 'pending',
        createdAt: new Date(Date.now() - 43200000),
      },
    ];

    res.json({
      success: true,
      data: earnings,
    });
  } catch (error) {
    console.error('Get courier earnings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get courier earnings' });
  }
};
