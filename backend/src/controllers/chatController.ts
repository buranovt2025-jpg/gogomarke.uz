import { Response } from 'express';
import { Order, User } from '../models';
import Message from '../models/Message';
import { AuthRequest } from '../middleware/auth';
import notificationService from '../services/notificationService';

// Get messages for an order
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { orderId } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    // Check if user is part of this order
    if (order.buyerId !== user.id && order.sellerId !== user.id && order.courierId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const messages = await Message.findAll({
      where: { orderId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      { where: { orderId, receiverId: user.id, isRead: false } }
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
};

// Send a message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { orderId } = req.params;
    const { content, receiverId } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!content || !receiverId) {
      res.status(400).json({ success: false, error: 'Content and receiverId are required.' });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    // Check if user is part of this order
    if (order.buyerId !== user.id && order.sellerId !== user.id && order.courierId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Check if receiver is part of this order
    if (order.buyerId !== receiverId && order.sellerId !== receiverId && order.courierId !== receiverId) {
      res.status(400).json({ success: false, error: 'Invalid receiver.' });
      return;
    }

    const message = await Message.create({
      orderId,
      senderId: user.id,
      receiverId,
      content,
    });

    // Send push notification
    const senderName = `${user.firstName} ${user.lastName}`;
    await notificationService.notifyNewMessage(receiverId, senderName, order.orderNumber);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const count = await Message.count({
      where: { receiverId: user.id, isRead: false },
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};
