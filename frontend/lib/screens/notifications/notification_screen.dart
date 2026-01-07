import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/notification_provider.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Уведомления'),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, child) {
              if (notificationProvider.notifications.isEmpty) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => notificationProvider.markAllAsRead(),
                child: const Text('Прочитать все'),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notificationProvider, child) {
          if (notificationProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

                    if (notificationProvider.notifications.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.notifications_none, size: 80, color: AppColors.grey400),
                            const SizedBox(height: 16),
                            const Text('Уведомлений пока нет', style: TextStyle(fontSize: 18, color: AppColors.grey600)),
                            const SizedBox(height: 8),
                            const Text('Здесь будут уведомления о заказах и событиях', style: TextStyle(color: AppColors.grey500)),
                          ],
                        ),
                      );
                    }

          return ListView.builder(
            itemCount: notificationProvider.notifications.length,
            itemBuilder: (context, index) {
              final notification = notificationProvider.notifications[index];
              return Dismissible(
                key: Key(notification.id),
                direction: DismissDirection.endToStart,
                background: Container(
                  color: AppColors.error,
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 16),
                  child: const Icon(Icons.delete, color: AppColors.white),
                ),
                onDismissed: (_) => notificationProvider.removeNotification(notification.id),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: notification.isRead ? AppColors.grey200 : AppColors.primary.withOpacity(0.1),
                    child: Icon(
                      _getNotificationIcon(notification.type),
                      color: notification.isRead ? AppColors.grey500 : AppColors.primary,
                    ),
                  ),
                  title: Text(
                    notification.title,
                    style: TextStyle(
                      fontWeight: notification.isRead ? FontWeight.normal : FontWeight.w600,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.body,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatTime(notification.createdAt),
                        style: const TextStyle(fontSize: 12, color: AppColors.grey500),
                      ),
                    ],
                  ),
                  isThreeLine: true,
                  onTap: () {
                    notificationProvider.markAsRead(notification.id);
                    _handleNotificationTap(context, notification);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'order':
        return Icons.shopping_bag;
      case 'message':
        return Icons.chat_bubble;
      case 'promo':
        return Icons.local_offer;
      case 'follow':
        return Icons.person_add;
      default:
        return Icons.notifications;
    }
  }

  void _handleNotificationTap(BuildContext context, dynamic notification) {
    final data = notification.data;
    if (data == null) return;

    final type = notification.type;
    switch (type) {
      case 'order':
        if (data['orderId'] != null) {
          Navigator.pushNamed(context, '/order/${data["orderId"]}');
        }
        break;
      case 'message':
        if (data['chatId'] != null) {
          Navigator.pushNamed(context, '/chat/${data["chatId"]}');
        }
        break;
      case 'product':
        if (data['productId'] != null) {
          Navigator.pushNamed(context, '/product/${data["productId"]}');
        }
        break;
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes} min ago';
    } else if (diff.inDays < 1) {
      return '${diff.inHours} hours ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
