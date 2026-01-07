import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socket';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addLocalNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getNotifications({ limit: 50 }) as { success: boolean; data: Notification[] };
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.getUnreadNotificationCount() as { success: boolean; data: { count: number } };
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      fetchNotifications();
      
      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico',
          });
        }
      };
      
      socketService.on('new_notification', handleNewNotification);
      
      return () => {
        socketService.off('new_notification', handleNewNotification);
      };
    }
  }, [fetchNotifications]);

  const addLocalNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
      });
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (!id.startsWith('local_')) {
        await api.markNotificationAsRead(id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      await api.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearNotification = useCallback(async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      if (!id.startsWith('local_')) {
        await api.deleteNotification(id);
      }
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      fetchNotifications();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  const clearAll = useCallback(async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      
      await api.clearAllNotifications();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        addLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
