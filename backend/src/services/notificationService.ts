import * as admin from 'firebase-admin';
import * as path from 'path';
import { User, Notification } from '../models';
import { NotificationType } from '../models/Notification';

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

interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
}

class NotificationService {
  // Send push notification via FCM and store in database
  async sendNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      // Store notification in database
      await Notification.create({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      // Send push notification if user has FCM token
      const user = await User.findByPk(userId);
      if (user?.fcmToken) {
        const message: admin.messaging.Message = {
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          token: user.fcmToken,
        };

        try {
          const response = await admin.messaging().send(message);
          console.log(`[PUSH] Sent to ${userId}: ${response}`);
        } catch (pushError) {
          console.error('Push notification error (FCM):', pushError);
        }
      }

      return true;
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  }

  // Legacy method for backward compatibility
  async sendPushNotification(userId: string, payload: { title: string; body: string; data?: Record<string, string> }): Promise<boolean> {
    return this.sendNotification(userId, {
      ...payload,
      type: NotificationType.SYSTEM,
    });
  }

  // Notify seller about new order
  async notifyNewOrder(sellerId: string, orderNumber: string, productTitle: string): Promise<void> {
    await this.sendNotification(sellerId, {
      type: NotificationType.NEW_ORDER,
      title: 'Новый заказ!',
      body: `Заказ ${orderNumber}: ${productTitle}`,
      data: { orderNumber },
    });
  }

  // Notify buyer about order confirmation
  async notifyOrderConfirmed(buyerId: string, orderNumber: string): Promise<void> {
    await this.sendNotification(buyerId, {
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Заказ подтвержден',
      body: `Ваш заказ ${orderNumber} подтвержден продавцом`,
      data: { orderNumber },
    });
  }

  // Notify buyer about order pickup
  async notifyOrderPickedUp(buyerId: string, orderNumber: string): Promise<void> {
    await this.sendNotification(buyerId, {
      type: NotificationType.ORDER_PICKED_UP,
      title: 'Заказ в пути',
      body: `Курьер забрал ваш заказ ${orderNumber}`,
      data: { orderNumber },
    });
  }

  // Notify buyer and seller about delivery
  async notifyOrderDelivered(buyerId: string, sellerId: string, orderNumber: string): Promise<void> {
    await this.sendNotification(buyerId, {
      type: NotificationType.ORDER_DELIVERED,
      title: 'Заказ доставлен!',
      body: `Ваш заказ ${orderNumber} успешно доставлен`,
      data: { orderNumber },
    });
    
    await this.sendNotification(sellerId, {
      type: NotificationType.ORDER_DELIVERED,
      title: 'Заказ доставлен!',
      body: `Заказ ${orderNumber} доставлен. Средства зачислены на баланс.`,
      data: { orderNumber },
    });
  }

  // Notify about new message
  async notifyNewMessage(receiverId: string, senderName: string, orderNumber: string): Promise<void> {
    await this.sendNotification(receiverId, {
      type: NotificationType.NEW_MESSAGE,
      title: 'Новое сообщение',
      body: `${senderName} отправил сообщение по заказу ${orderNumber}`,
      data: { orderNumber },
    });
  }

  // Notify about new follower
  async notifyNewFollower(sellerId: string, followerName: string): Promise<void> {
    await this.sendNotification(sellerId, {
      type: NotificationType.NEW_FOLLOWER,
      title: 'Новый подписчик!',
      body: `${followerName} подписался на ваш магазин`,
    });
  }

  // Notify about new comment
  async notifyNewComment(videoOwnerId: string, commenterName: string, videoTitle: string): Promise<void> {
    await this.sendNotification(videoOwnerId, {
      type: NotificationType.NEW_COMMENT,
      title: 'Новый комментарий',
      body: `${commenterName} прокомментировал "${videoTitle}"`,
    });
  }

  // Notify about new review
  async notifyNewReview(sellerId: string, buyerName: string, rating: number): Promise<void> {
    await this.sendNotification(sellerId, {
      type: NotificationType.NEW_REVIEW,
      title: 'Новый отзыв!',
      body: `${buyerName} оставил отзыв: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
    });
  }
}

export default new NotificationService();
