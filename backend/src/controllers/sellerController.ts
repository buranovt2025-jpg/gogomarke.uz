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

export const getSellerProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { page = 1, limit = 20, isActive } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { sellerId: user.id };
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller products' });
  }
};

export const getSellerBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    // Fake balance response
    const balance = {
      available: 1500000,  // UZS
      pending: 350000,
      total: 1850000,
      currency: 'UZS'
    };

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error('Get seller balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller balance' });
  }
};

export const getSellerTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    // Fake transactions
    const transactions = [
      { 
        id: 'txn1', 
        type: 'sale', 
        amount: 150000, 
        orderId: 'order-uuid-1', 
        createdAt: new Date(Date.now() - 86400000) 
      },
      { 
        id: 'txn2', 
        type: 'withdrawal', 
        amount: -500000, 
        status: 'completed', 
        createdAt: new Date(Date.now() - 172800000) 
      },
      { 
        id: 'txn3', 
        type: 'sale', 
        amount: 250000, 
        orderId: 'order-uuid-2', 
        createdAt: new Date(Date.now() - 259200000) 
      },
    ];

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get seller transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller transactions' });
  }
};

export const confirmOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.sellerId !== user.id) {
      res.status(403).json({ success: false, error: 'Not your order' });
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({ success: false, error: 'Order cannot be confirmed' });
      return;
    }

    order.status = OrderStatus.CONFIRMED;
    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm order' });
  }
};

export const markOrderReady = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.sellerId !== user.id) {
      res.status(403).json({ success: false, error: 'Not your order' });
      return;
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      res.status(400).json({ success: false, error: 'Order must be confirmed first' });
      return;
    }

    // Generate QR code for pickup
    const sellerQrCode = `SELLER-${order.id}-${Date.now()}`;
    order.sellerQrCode = sellerQrCode;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order is ready for courier pickup',
    });
  } catch (error) {
    console.error('Mark order ready error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark order ready' });
  }
};

export const rejectOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.sellerId !== user.id) {
      res.status(403).json({ success: false, error: 'Not your order' });
      return;
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      res.status(400).json({ success: false, error: 'Order cannot be rejected' });
      return;
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'Rejected by seller';
    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject order' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount' });
      return;
    }

    // Fake withdrawal response
    const withdrawal = {
      id: `wd-${Date.now()}`,
      userId: user.id,
      amount: Number(amount),
      status: 'pending',
      createdAt: new Date(),
    };

    res.json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal request submitted',
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to request withdrawal' });
  }
};

export const getSellerWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    // Fake withdrawals history
    const withdrawals = [
      {
        id: 'wd-1',
        userId: user.id,
        amount: 500000,
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000),
        completedAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'wd-2',
        userId: user.id,
        amount: 300000,
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000),
      },
    ];

    res.json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    console.error('Get seller withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller withdrawals' });
  }
};

// Get seller reports by period
export const getSellerReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { period = 'day' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'day':
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
    }

    // Get orders for the period
    const orders = await Order.findAll({
      where: {
        sellerId: user.id,
        createdAt: { [Op.gte]: startDate },
      },
      order: [['createdAt', 'DESC']],
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;

    const totalRevenue = orders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + Number(o.sellerAmount || 0), 0);

    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: new Date(),
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          pendingOrders,
          totalRevenue,
          avgOrderValue,
          conversionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0,
        },
        orders: orders.slice(0, 10), // Last 10 orders
      },
    });
  } catch (error) {
    console.error('Get seller reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller reports' });
  }
};

// Export seller reports as CSV
export const exportSellerReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.SELLER) {
      res.status(403).json({ success: false, error: 'Seller access required.' });
      return;
    }

    const { startDate, endDate } = req.query;
    
    const whereClause: Record<string, unknown> = { sellerId: user.id };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Product, as: 'product', attributes: ['title'] },
        { model: User, as: 'buyer', attributes: ['firstName', 'lastName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Generate CSV
    const csvHeader = 'Order ID,Date,Product,Buyer,Amount,Status\n';
    const csvRows = orders.map(order => {
      const orderData = order.toJSON() as typeof order & { product?: { title: string }; buyer?: { firstName: string; lastName: string } };
      return `${order.orderNumber},${order.createdAt.toISOString()},${orderData.product?.title || 'N/A'},${orderData.buyer?.firstName || ''} ${orderData.buyer?.lastName || ''},${order.sellerAmount},${order.status}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=seller-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export seller reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to export seller reports' });
  }
};
