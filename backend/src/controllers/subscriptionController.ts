import { Response } from 'express';
import { Subscription, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const getSubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where: { followerId: user.id },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: subscriptions.map((s) => (s as unknown as { seller: unknown }).seller),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subscriptions' });
  }
};

export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: followers } = await Subscription.findAndCountAll({
      where: { sellerId: user.id },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: followers.map((f) => (f as unknown as { follower: unknown }).follower),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, error: 'Failed to get followers' });
  }
};

export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ success: false, error: 'User ID is required.' });
      return;
    }

    if (userId === user.id) {
      res.status(400).json({ success: false, error: 'Cannot subscribe to yourself.' });
      return;
    }

    const seller = await User.findByPk(userId);
    if (!seller || seller.role !== UserRole.SELLER) {
      res.status(404).json({ success: false, error: 'Seller not found.' });
      return;
    }

    const existingSubscription = await Subscription.findOne({
      where: { followerId: user.id, sellerId: userId },
    });

    if (existingSubscription) {
      res.status(400).json({ success: false, error: 'Already subscribed to this seller.' });
      return;
    }

    const subscription = await Subscription.create({
      followerId: user.id,
      sellerId: userId,
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscribed successfully.',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
};

export const unsubscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { userId } = req.params;

    const subscription = await Subscription.findOne({
      where: { followerId: user.id, sellerId: userId },
    });

    if (!subscription) {
      res.status(404).json({ success: false, error: 'Subscription not found.' });
      return;
    }

    await subscription.destroy();

    res.json({
      success: true,
      message: 'Unsubscribed successfully.',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
};

export const checkSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { userId } = req.params;

    const subscription = await Subscription.findOne({
      where: { followerId: user.id, sellerId: userId },
    });

    res.json({
      success: true,
      data: { isSubscribed: !!subscription },
    });
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to check subscription' });
  }
};
