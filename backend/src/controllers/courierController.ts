import { Response } from 'express';
import { Order, User } from '../models';
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
