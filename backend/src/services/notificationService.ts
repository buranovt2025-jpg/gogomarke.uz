import * as admin from 'firebase-admin';
import * as path from 'path';
import { User } from '../models';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
}

// Notification types
export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PICKED_UP = 'order_picked_up',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  NEW_MESSAGE = 'new_message',
  PAYMENT_RECEIVED = 'payment_received',
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

class NotificationService {
  // Send push notification via FCM
  async sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.fcmToken) {
        console.log(`No FCM token for user ${userId}`);
        return false;
      }

      const message: admin.messaging.Message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        token: user.fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log(`[PUSH] Sent to ${userId}: ${response}`);
      return true;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  // Notify seller about new order
  async notifyNewOrder(sellerId: string, orderNumber: string, productTitle: string): Promise<void> {
    await this.sendPushNotification(sellerId, {
      title: 'Новый заказ!',
      body: `Заказ ${orderNumber}: ${productTitle}`,
      data: { type: NotificationType.NEW_ORDER, orderNumber },
    });
  }

  // Notify buyer about order confirmation
  async notifyOrderConfirmed(buyerId: string, orderNumber: string): Promise<void> {
    await this.sendPushNotification(buyerId, {
      title: 'Заказ подтвержден',
      body: `Ваш заказ ${orderNumber} подтвержден продавцом`,
      data: { type: NotificationType.ORDER_CONFIRMED, orderNumber },
    });
  }

  // Notify buyer about order pickup
  async notifyOrderPickedUp(buyerId: string, orderNumber: string): Promise<void> {
    await this.sendPushNotification(buyerId, {
      title: 'Заказ в пути',
      body: `Курьер забрал ваш заказ ${orderNumber}`,
      data: { type: NotificationType.ORDER_PICKED_UP, orderNumber },
    });
  }

  // Notify buyer and seller about delivery
  async notifyOrderDelivered(buyerId: string, sellerId: string, orderNumber: string): Promise<void> {
    await this.sendPushNotification(buyerId, {
      title: 'Заказ доставлен!',
      body: `Ваш заказ ${orderNumber} успешно доставлен`,
      data: { type: NotificationType.ORDER_DELIVERED, orderNumber },
    });
    
    await this.sendPushNotification(sellerId, {
      title: 'Заказ доставлен!',
      body: `Заказ ${orderNumber} доставлен. Средства зачислены на баланс.`,
      data: { type: NotificationType.ORDER_DELIVERED, orderNumber },
    });
  }

  // Notify about new message
  async notifyNewMessage(receiverId: string, senderName: string, orderNumber: string): Promise<void> {
    await this.sendPushNotification(receiverId, {
      title: 'Новое сообщение',
      body: `${senderName} отправил сообщение по заказу ${orderNumber}`,
      data: { type: NotificationType.NEW_MESSAGE, orderNumber },
    });
  }
}

export default new NotificationService();
