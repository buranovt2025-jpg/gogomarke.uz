import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  final bool isRead;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.data,
    required this.createdAt,
    this.isRead = false,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'SYSTEM',
      title: json['title'] as String,
      body: json['body'] as String,
      data: json['data'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      isRead: json['isRead'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'body': body,
      'data': data,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
    };
  }

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      type: type,
      title: title,
      body: body,
      data: data,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
    );
  }
}

class NotificationProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();
  
  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  int _unreadCount = 0;

  List<AppNotification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _unreadCount;

  NotificationProvider() {
    _setupSocketListener();
  }

  void _setupSocketListener() {
    _socketService.on('new_notification', (data) {
      if (data is Map<String, dynamic>) {
        final notification = AppNotification.fromJson(data);
        _notifications.insert(0, notification);
        _unreadCount++;
        notifyListeners();
      }
    });
  }

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/notifications', queryParams: {'limit': '50'});
      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> data = response['data'] as List<dynamic>;
        _notifications = data
            .map((json) => AppNotification.fromJson(json as Map<String, dynamic>))
            .toList();
        _calculateUnreadCount();
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchUnreadCount() async {
    try {
      final response = await _apiService.get('/notifications/unread-count');
      if (response['success'] == true && response['data'] != null) {
        _unreadCount = response['data']['count'] as int;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching unread count: $e');
    }
  }

  void addLocalNotification(AppNotification notification) {
    _notifications.insert(0, notification);
    _unreadCount++;
    notifyListeners();
  }

  Future<void> markAsRead(String notificationId) async {
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      _unreadCount = _unreadCount > 0 ? _unreadCount - 1 : 0;
      notifyListeners();

      if (!notificationId.startsWith('local_')) {
        try {
          await _apiService.patch('/notifications/$notificationId/read');
        } catch (e) {
          debugPrint('Error marking notification as read: $e');
          fetchNotifications();
        }
      }
    }
  }

  Future<void> markAllAsRead() async {
    _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
    _unreadCount = 0;
    notifyListeners();

    try {
      await _apiService.post('/notifications/mark-all-read', {});
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
      fetchNotifications();
    }
  }

  Future<void> removeNotification(String notificationId) async {
    _notifications.removeWhere((n) => n.id == notificationId);
    _calculateUnreadCount();
    notifyListeners();

    if (!notificationId.startsWith('local_')) {
      try {
        await _apiService.delete('/notifications/$notificationId');
      } catch (e) {
        debugPrint('Error deleting notification: $e');
        fetchNotifications();
      }
    }
  }

  void _calculateUnreadCount() {
    _unreadCount = _notifications.where((n) => !n.isRead).length;
  }

  Future<void> clearAll() async {
    _notifications = [];
    _unreadCount = 0;
    notifyListeners();

    try {
      await _apiService.delete('/notifications/clear-all');
    } catch (e) {
      debugPrint('Error clearing all notifications: $e');
    }
  }
}
