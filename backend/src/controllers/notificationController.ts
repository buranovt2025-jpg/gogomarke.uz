import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

// Get all notifications for current user
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const whereClause: Record<string, unknown> = { userId: user.id };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const count = await Notification.count({
      where: { userId: user.id, isRead: false },
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const notification = await Notification.findOne({
      where: { id, userId: user.id },
    });

    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    await Notification.update(
      { isRead: true },
      { where: { userId: user.id, isRead: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const notification = await Notification.findOne({
      where: { id, userId: user.id },
    });

    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }

    await notification.destroy();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    await Notification.destroy({
      where: { userId: user.id },
    });

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
};
