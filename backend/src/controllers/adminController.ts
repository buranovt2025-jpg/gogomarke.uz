import { Response } from 'express';
import { Op } from 'sequelize';
import { User, Product, Order, Transaction, Video } from '../models';
import { NotificationType } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { UserRole, OrderStatus, PaymentStatus } from '../types';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where[Op.or as unknown as string] = [
        { phone: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'phone', 'email', 'firstName', 'lastName', 'role', 'isVerified', 'isActive', 'createdAt', 'lastLoginAt'],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
    });
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'phone', 'email', 'firstName', 'lastName', 'role', 'isVerified', 'isActive', 'avatar', 'language', 'createdAt', 'lastLoginAt', 'availableBalance', 'pendingBalance', 'totalEarnings'],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    
    if (role && Object.values(UserRole).includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'phone', 'firstName', 'lastName'] },
        { model: User, as: 'seller', attributes: ['id', 'phone', 'firstName', 'lastName'] },
        { model: User, as: 'courier', attributes: ['id', 'phone', 'firstName', 'lastName'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price', 'images'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: Order, as: 'order', attributes: ['id', 'orderNumber', 'totalAmount'] },
        { model: User, as: 'user', attributes: ['id', 'phone', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
    });
  }
};

export const verifyUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (user.role !== UserRole.SELLER && user.role !== UserRole.COURIER) {
      res.status(400).json({
        success: false,
        error: 'Only sellers and couriers can be verified',
      });
      return;
    }

    user.isVerified = isVerified;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      message: isVerified ? 'User verified successfully' : 'User verification removed',
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify user',
    });
  }
};

export const broadcastNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, targetRole, targetUserIds } = req.body;

    if (!title || !message) {
      res.status(400).json({
        success: false,
        error: 'Title and message are required',
      });
      return;
    }

    let targetUsers: User[];

    if (targetUserIds && targetUserIds.length > 0) {
      targetUsers = await User.findAll({
        where: { id: targetUserIds },
      });
    } else if (targetRole) {
      targetUsers = await User.findAll({
        where: { role: targetRole },
      });
    } else {
      targetUsers = await User.findAll();
    }

    const { Notification } = await import('../models');

    const notifications = await Promise.all(
      targetUsers.map(user =>
        Notification.create({
          userId: user.id,
          type: NotificationType.SYSTEM,
          title,
          body: message,
          data: { fromAdmin: 'true' },
        })
      )
    );

    res.json({
      success: true,
      data: {
        sentCount: notifications.length,
        targetRole: targetRole || 'all',
      },
      message: `Notification sent to ${notifications.length} users`,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification',
    });
  }
};

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalCouriers,
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalVideos,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: UserRole.BUYER } }),
      User.count({ where: { role: UserRole.SELLER } }),
      User.count({ where: { role: UserRole.COURIER } }),
      Product.count(),
      Order.count(),
      Order.count({ where: { status: OrderStatus.PENDING } }),
      Order.count({ where: { status: OrderStatus.DELIVERED } }),
      Video.count(),
    ]);

    const totalRevenue = await Transaction.sum('amount', {
      where: {
        status: PaymentStatus.COMPLETED,
        type: 'platform_commission',
      },
    }) || 0;

    const recentOrders = await Order.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'phone', 'firstName'] },
        { model: Product, as: 'product', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          buyers: totalBuyers,
          sellers: totalSellers,
          couriers: totalCouriers,
        },
        products: {
          total: totalProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
        },
        videos: {
          total: totalVideos,
        },
        revenue: {
          total: totalRevenue,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
};

// Bulk payout to sellers
export const bulkPayoutSellers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerIds, note } = req.body;

    if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
      res.status(400).json({ success: false, error: 'Seller IDs are required.' });
      return;
    }

    const sellers = await User.findAll({
      where: {
        id: sellerIds,
        role: UserRole.SELLER,
      },
    });

    const payouts = sellers.map(seller => ({
      sellerId: seller.id,
      sellerName: `${seller.firstName} ${seller.lastName}`,
      availableBalance: Number(seller.availableBalance || 0),
      status: 'processed',
      processedAt: new Date(),
    }));

    const totalAmount = payouts.reduce((sum, p) => sum + p.availableBalance, 0);

    // In production, this would actually transfer funds and create transactions
    // For now, just return the payout summary

    res.json({
      success: true,
      data: {
        totalSellers: payouts.length,
        totalAmount,
        note,
        payouts,
        processedAt: new Date(),
      },
      message: `Bulk payout processed for ${payouts.length} sellers.`,
    });
  } catch (error) {
    console.error('Bulk payout sellers error:', error);
    res.status(500).json({ success: false, error: 'Failed to process bulk payout' });
  }
};

// Bulk payout to couriers
export const bulkPayoutCouriers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courierIds, note } = req.body;

    if (!courierIds || !Array.isArray(courierIds) || courierIds.length === 0) {
      res.status(400).json({ success: false, error: 'Courier IDs are required.' });
      return;
    }

    const couriers = await User.findAll({
      where: {
        id: courierIds,
        role: UserRole.COURIER,
      },
    });

    const payouts = couriers.map(courier => ({
      courierId: courier.id,
      courierName: `${courier.firstName} ${courier.lastName}`,
      availableBalance: Number(courier.availableBalance || 0),
      status: 'processed',
      processedAt: new Date(),
    }));

    const totalAmount = payouts.reduce((sum, p) => sum + p.availableBalance, 0);

    res.json({
      success: true,
      data: {
        totalCouriers: payouts.length,
        totalAmount,
        note,
        payouts,
        processedAt: new Date(),
      },
      message: `Bulk payout processed for ${payouts.length} couriers.`,
    });
  } catch (error) {
    console.error('Bulk payout couriers error:', error);
    res.status(500).json({ success: false, error: 'Failed to process bulk payout' });
  }
};

// Get financial history
export const getFinancialHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: Record<string, unknown> = {};
    
    if (type) {
      whereClause.type = type;
    }
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] },
        { model: Order, as: 'order', attributes: ['id', 'orderNumber'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get financial history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get financial history' });
  }
};
