import { Response } from 'express';
import { Op } from 'sequelize';
import { Order, User, Chat } from '../models';
import Message from '../models/Message';
import { AuthRequest } from '../middleware/auth';
import notificationService from '../services/notificationService';

// Get all chats for the current user
export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { user1Id: user.id },
          { user2Id: user.id },
        ],
      },
      include: [
        { 
          model: User, 
          as: 'user1', 
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] 
        },
        { 
          model: User, 
          as: 'user2', 
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] 
        },
      ],
      order: [['lastMessageAt', 'DESC']],
    });

    // Get last message for each chat
    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({
          where: { chatId: chat.id },
          order: [['createdAt', 'DESC']],
        });

        const unreadCount = await Message.count({
          where: { 
            chatId: chat.id, 
            receiverId: user.id, 
            isRead: false 
          },
        });

        const otherUser = chat.user1Id === user.id ? chat.user2 : chat.user1;

        return {
          id: chat.id,
          otherUser,
          lastMessage,
          unreadCount,
          lastMessageAt: chat.lastMessageAt,
          createdAt: chat.createdAt,
        };
      })
    );

    res.json({ success: true, data: chatsWithLastMessage });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get chats' });
  }
};

// Create a new chat
export const createChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { userId } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!userId) {
      res.status(400).json({ success: false, error: 'User ID is required.' });
      return;
    }

    if (userId === user.id) {
      res.status(400).json({ success: false, error: 'Cannot create chat with yourself.' });
      return;
    }

    const otherUser = await User.findByPk(userId);
    if (!otherUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    // Check if chat already exists (in either direction)
    let chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { user1Id: user.id, user2Id: userId },
          { user1Id: userId, user2Id: user.id },
        ],
      },
    });

    if (!chat) {
      // Create new chat (always put smaller UUID first for consistency)
      const [firstUserId, secondUserId] = [user.id, userId].sort();
      chat = await Chat.create({
        user1Id: firstUserId,
        user2Id: secondUserId,
      });
    }

    // Load the chat with user details
    const chatWithUsers = await Chat.findByPk(chat.id, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
        { model: User, as: 'user2', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
      ],
    });

    res.status(201).json({ success: true, data: chatWithUsers });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to create chat' });
  }
};

// Get a specific chat
export const getChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const chat = await Chat.findByPk(id, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
        { model: User, as: 'user2', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
      ],
    });

    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found.' });
      return;
    }

    // Check if user is part of this chat
    if (chat.user1Id !== user.id && chat.user2Id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to get chat' });
  }
};

// Get messages for a chat
export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const chat = await Chat.findByPk(id);
    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found.' });
      return;
    }

    // Check if user is part of this chat
    if (chat.user1Id !== user.id && chat.user2Id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { chatId: id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      { where: { chatId: id, receiverId: user.id, isRead: false } }
    );

    res.json({ 
      success: true, 
      data: messages.reverse(), // Return in ascending order
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
};

// Send a message in a chat
export const sendChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { content } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required.' });
      return;
    }

    const chat = await Chat.findByPk(id);
    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found.' });
      return;
    }

    // Check if user is part of this chat
    if (chat.user1Id !== user.id && chat.user2Id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Determine receiver
    const receiverId = chat.user1Id === user.id ? chat.user2Id : chat.user1Id;

    const message = await Message.create({
      chatId: id,
      senderId: user.id,
      receiverId,
      content,
    });

    // Update chat's lastMessageAt
    chat.lastMessageAt = new Date();
    await chat.save();

    // Load message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'] },
      ],
    });

    // Send push notification
    const senderName = `${user.firstName} ${user.lastName}`;
    await notificationService.notifyNewMessage(receiverId, senderName, 'Direct Message');

    res.status(201).json({ success: true, data: messageWithSender });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Delete a chat
export const deleteChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const chat = await Chat.findByPk(id);
    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found.' });
      return;
    }

    // Check if user is part of this chat
    if (chat.user1Id !== user.id && chat.user2Id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Delete all messages in this chat
    await Message.destroy({ where: { chatId: id } });

    // Delete the chat
    await chat.destroy();

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
};

// Keep the old order-based chat functions for backward compatibility
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
