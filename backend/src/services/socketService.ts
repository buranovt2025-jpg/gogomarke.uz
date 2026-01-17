import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import Message from '../models/Message';
import { User, Order, Chat } from '../models';
import { Op } from 'sequelize';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  id: string;
  role: string;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  initialize(server: HttpServer): void {
    const corsOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['*'];
    
    this.io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
            callback(null, origin);
          } else {
            callback(null, corsOrigins[0]);
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token as string, config.jwtSecret) as JwtPayload;
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);
      
      if (socket.userId) {
        // Add socket to user's socket list
        const userSocketIds = this.userSockets.get(socket.userId) || [];
        userSocketIds.push(socket.id);
        this.userSockets.set(socket.userId, userSocketIds);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);
      }

      // Handle joining chat room
      socket.on('join_chat', async (chatId: string) => {
        try {
          const chat = await Chat.findByPk(chatId);
          if (!chat) return;

          // Check if user is part of this chat
          if (
            chat.user1Id === socket.userId ||
            chat.user2Id === socket.userId
          ) {
            socket.join(`chat:${chatId}`);
            console.log(`User ${socket.userId} joined chat room: ${chatId}`);
          }
        } catch (error) {
          console.error('Error joining chat room:', error);
        }
      });

      // Handle leaving chat room
      socket.on('leave_chat', (chatId: string) => {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${socket.userId} left chat room: ${chatId}`);
      });

      // Handle sending message in chat
      socket.on('send_message', async (data: { chatId: string; content: string }) => {
        try {
          const { chatId, content } = data;
          
          if (!socket.userId || !content) return;

          const chat = await Chat.findByPk(chatId);
          if (!chat) return;

          // Check if sender is part of this chat
          if (
            chat.user1Id !== socket.userId &&
            chat.user2Id !== socket.userId
          ) {
            return;
          }

          // Determine receiver
          const receiverId = chat.user1Id === socket.userId ? chat.user2Id : chat.user1Id;

          // Create message in database
          const message = await Message.create({
            chatId,
            senderId: socket.userId,
            receiverId,
            content,
          });

          // Update chat's lastMessageAt
          chat.lastMessageAt = new Date();
          await chat.save();

          // Get sender info
          const sender = await User.findByPk(socket.userId, {
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'],
          });

          const messageData = {
            ...message.toJSON(),
            sender: sender?.toJSON(),
          };

          // Emit to chat room
          this.io?.to(`chat:${chatId}`).emit('new_message', messageData);

          // Also emit to receiver's personal room (for notifications)
          this.io?.to(`user:${receiverId}`).emit('message_notification', {
            chatId,
            message: messageData,
          });

        } catch (error) {
          console.error('Error sending message via socket:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicator
      socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
        socket.to(`chat:${data.chatId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: data.isTyping,
        });
      });

      // Handle message read
      socket.on('message_read', async (data: { chatId: string }) => {
        try {
          if (!socket.userId) return;

          await Message.update(
            { isRead: true },
            { where: { chatId: data.chatId, receiverId: socket.userId, isRead: false } }
          );

          socket.to(`chat:${data.chatId}`).emit('messages_read', {
            chatId: data.chatId,
            readBy: socket.userId,
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Legacy: Handle joining order chat room
      socket.on('join_order', async (orderId: string) => {
        try {
          const order = await Order.findByPk(orderId);
          if (!order) return;

          // Check if user is part of this order
          if (
            order.buyerId === socket.userId ||
            order.sellerId === socket.userId ||
            order.courierId === socket.userId
          ) {
            socket.join(`order:${orderId}`);
            console.log(`User ${socket.userId} joined order room: ${orderId}`);
          }
        } catch (error) {
          console.error('Error joining order room:', error);
        }
      });

      // Legacy: Handle leaving order chat room
      socket.on('leave_order', (orderId: string) => {
        socket.leave(`order:${orderId}`);
        console.log(`User ${socket.userId} left order room: ${orderId}`);
      });

      // Legacy: Handle sending message in order
      socket.on('send_order_message', async (data: { orderId: string; receiverId: string; content: string }) => {
        try {
          const { orderId, receiverId, content } = data;
          
          if (!socket.userId || !content || !receiverId) return;

          const order = await Order.findByPk(orderId);
          if (!order) return;

          // Check if sender is part of this order
          if (
            order.buyerId !== socket.userId &&
            order.sellerId !== socket.userId &&
            order.courierId !== socket.userId
          ) {
            return;
          }

          // Check if receiver is part of this order
          if (
            order.buyerId !== receiverId &&
            order.sellerId !== receiverId &&
            order.courierId !== receiverId
          ) {
            return;
          }

          // Create message in database
          const message = await Message.create({
            orderId,
            senderId: socket.userId,
            receiverId,
            content,
          });

          // Get sender info
          const sender = await User.findByPk(socket.userId, {
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'role'],
          });

          const messageData = {
            ...message.toJSON(),
            sender: sender?.toJSON(),
          };

          // Emit to order room
          this.io?.to(`order:${orderId}`).emit('new_message', messageData);

          // Also emit to receiver's personal room (for notifications)
          this.io?.to(`user:${receiverId}`).emit('message_notification', {
            orderId,
            message: messageData,
          });

        } catch (error) {
          console.error('Error sending message via socket:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Legacy: Handle typing indicator for orders
      socket.on('typing_order', (data: { orderId: string; isTyping: boolean }) => {
        socket.to(`order:${data.orderId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: data.isTyping,
        });
      });

      // Legacy: Handle message read for orders
      socket.on('mark_read_order', async (data: { orderId: string }) => {
        try {
          if (!socket.userId) return;

          await Message.update(
            { isRead: true },
            { where: { orderId: data.orderId, receiverId: socket.userId, isRead: false } }
          );

          socket.to(`order:${data.orderId}`).emit('messages_read', {
            orderId: data.orderId,
            readBy: socket.userId,
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        
        if (socket.userId) {
          const userSocketIds = this.userSockets.get(socket.userId) || [];
          const updatedSocketIds = userSocketIds.filter(id => id !== socket.id);
          
          if (updatedSocketIds.length > 0) {
            this.userSockets.set(socket.userId, updatedSocketIds);
          } else {
            this.userSockets.delete(socket.userId);
          }
        }
      });
    });

    console.log('Socket.io initialized');
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  // Send notification to chat room
  sendToChat(chatId: string, event: string, data: unknown): void {
    this.io?.to(`chat:${chatId}`).emit(event, data);
  }

  // Send notification to order room
  sendToOrder(orderId: string, event: string, data: unknown): void {
    this.io?.to(`order:${orderId}`).emit(event, data);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getIO(): Server | null {
    return this.io;
  }
}

export default new SocketService();
