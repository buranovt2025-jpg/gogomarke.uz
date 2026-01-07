import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import Message from '../models/Message';
import { User, Order } from '../models';

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
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
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

      // Handle joining order chat room
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

      // Handle leaving order chat room
      socket.on('leave_order', (orderId: string) => {
        socket.leave(`order:${orderId}`);
        console.log(`User ${socket.userId} left order room: ${orderId}`);
      });

      // Handle sending message
      socket.on('send_message', async (data: { orderId: string; receiverId: string; content: string }) => {
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

      // Handle typing indicator
      socket.on('typing', (data: { orderId: string; isTyping: boolean }) => {
        socket.to(`order:${data.orderId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: data.isTyping,
        });
      });

      // Handle message read
      socket.on('mark_read', async (data: { orderId: string }) => {
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
