import { Response } from 'express';
import { Order, Product, Video, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus, UserRole } from '../types';
import { Op } from 'sequelize';

export const getSellerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const totalProducts = await Product.count({ where: { sellerId: user.id } });
    const activeProducts = await Product.count({ where: { sellerId: user.id, isActive: true } });
    const totalVideos = await Video.count({ where: { ownerId: user.id } });
    const activeVideos = await Video.count({ where: { ownerId: user.id, isActive: true } });

    const totalOrders = await Order.count({ where: { sellerId: user.id } });
    const pendingOrders = await Order.count({ 
      where: { sellerId: user.id, status: OrderStatus.PENDING } 
    });
    const confirmedOrders = await Order.count({ 
      where: { sellerId: user.id, status: OrderStatus.CONFIRMED } 
    });
    const deliveredOrders = await Order.count({ 
      where: { sellerId: user.id, status: OrderStatus.DELIVERED } 
    });
    const cancelledOrders = await Order.count({ 
      where: { sellerId: user.id, status: OrderStatus.CANCELLED } 
    });

    const totalSalesResult = await Order.sum('sellerAmount', {
      where: { sellerId: user.id, status: OrderStatus.DELIVERED },
    });
    const totalSales = totalSalesResult || 0;

    const totalViewsResult = await Video.sum('viewCount', {
      where: { ownerId: user.id },
    });
    const totalViews = totalViewsResult || 0;

    const totalLikesResult = await Video.sum('likeCount', {
      where: { ownerId: user.id },
    });
    const totalLikes = totalLikesResult || 0;

    const userData = await User.findByPk(user.id);

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        videos: {
          total: totalVideos,
          active: activeVideos,
          totalViews: Number(totalViews),
          totalLikes: Number(totalLikes),
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        earnings: {
          totalSales: Number(totalSales),
          availableBalance: Number(userData?.availableBalance) || 0,
          pendingBalance: Number(userData?.pendingBalance) || 0,
          totalEarnings: Number(userData?.totalEarnings) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller stats' });
  }
};

export const getSellerOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { sellerId: user.id };
    if (status) {
      where.status = status;
    }

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
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
        {
          model: User,
          as: 'courier',
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
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller orders' });
  }
};

export const getSellerAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { period = '30' } = req.query;
    const days = Number(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await Order.findAll({
      where: {
        sellerId: user.id,
        status: OrderStatus.DELIVERED,
        deliveredAt: { [Op.gte]: startDate },
      },
      attributes: ['id', 'sellerAmount', 'deliveredAt'],
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.sellerAmount), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const salesByDay: Record<string, number> = {};
    orders.forEach(order => {
      if (order.deliveredAt) {
        const day = order.deliveredAt.toISOString().split('T')[0];
        salesByDay[day] = (salesByDay[day] || 0) + Number(order.sellerAmount);
      }
    });

    const topProducts = await Product.findAll({
      where: { sellerId: user.id, isActive: true },
      attributes: ['id', 'title', 'images', 'price', 'stock'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        period: days,
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
        },
        salesByDay,
        topProducts,
      },
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller analytics' });
  }
};
