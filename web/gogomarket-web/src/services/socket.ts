import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = API_URL.replace('/api/v1', '');

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Re-emit events to registered listeners
    this.socket.onAny((event, data) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((callback) => callback(data));
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Join an order chat room
  joinOrder(orderId: string): void {
    this.socket?.emit('join_order', orderId);
  }

  // Leave an order chat room
  leaveOrder(orderId: string): void {
    this.socket?.emit('leave_order', orderId);
  }

  // Send a message
  sendMessage(orderId: string, receiverId: string, content: string): void {
    this.socket?.emit('send_message', { orderId, receiverId, content });
  }

  // Send typing indicator
  sendTyping(orderId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { orderId, isTyping });
  }

  // Mark messages as read
  markRead(orderId: string): void {
    this.socket?.emit('mark_read', { orderId });
  }

  // Subscribe to an event
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Unsubscribe from an event
  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  // Emit an event
  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
export default socketService;
