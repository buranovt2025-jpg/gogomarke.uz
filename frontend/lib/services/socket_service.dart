import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import '../config/api_config.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _token;
  
  final Map<String, List<Function(dynamic)>> _listeners = {};

  bool get isConnected => _isConnected;

  void connect(String token) {
    if (_socket != null && _isConnected) {
      return;
    }

    _token = token;
    final baseUrl = ApiConfig.baseUrl.replaceAll('/api/v1', '');

    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('Socket connected');
      _isConnected = true;
    });

    _socket!.onDisconnect((_) {
      debugPrint('Socket disconnected');
      _isConnected = false;
    });

    _socket!.onConnectError((error) {
      debugPrint('Socket connection error: $error');
      _isConnected = false;
    });

    _socket!.onAny((event, data) {
      final eventListeners = _listeners[event];
      if (eventListeners != null) {
        for (final callback in eventListeners) {
          callback(data);
        }
      }
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    _listeners.clear();
  }

  void joinOrder(String orderId) {
    _socket?.emit('join_order', orderId);
  }

  void leaveOrder(String orderId) {
    _socket?.emit('leave_order', orderId);
  }

  void sendMessage(String orderId, String receiverId, String content) {
    _socket?.emit('send_message', {
      'orderId': orderId,
      'receiverId': receiverId,
      'content': content,
    });
  }

  void sendTyping(String orderId, bool isTyping) {
    _socket?.emit('typing', {
      'orderId': orderId,
      'isTyping': isTyping,
    });
  }

  void markRead(String orderId) {
    _socket?.emit('mark_read', {'orderId': orderId});
  }

  void on(String event, Function(dynamic) callback) {
    _listeners[event] ??= [];
    _listeners[event]!.add(callback);
  }

  void off(String event, [Function(dynamic)? callback]) {
    if (callback != null) {
      _listeners[event]?.remove(callback);
    } else {
      _listeners.remove(event);
    }
  }

  void emit(String event, [dynamic data]) {
    _socket?.emit(event, data);
  }
}

final socketService = SocketService();
