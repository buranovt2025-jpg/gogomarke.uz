import 'package:flutter/foundation.dart';

import '../models/chat.dart';
import '../services/api_service.dart';

class ChatProvider with ChangeNotifier {
  List<Chat> _chats = [];
  List<ChatMessage> _messages = [];
  Chat? _currentChat;
  bool _isLoading = false;
  String? _error;
  int _totalUnread = 0;
  
  final ApiService _apiService = ApiService();

  List<Chat> get chats => _chats;
  List<ChatMessage> get messages => _messages;
  Chat? get currentChat => _currentChat;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalUnread => _totalUnread;

  Future<void> fetchChats({bool refresh = false}) async {
    if (refresh) {
      _chats = [];
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/chats');

      if (response['success'] == true && response['data'] != null) {
        _chats = (response['data'] as List)
            .map((json) => Chat.fromJson(json as Map<String, dynamic>))
            .toList();
        _calculateTotalUnread();
      } else if (response['error'] != null) {
        _error = response['error'] as String;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMessages(String orderId, {bool refresh = false}) async {
    if (refresh) {
      _messages = [];
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/chats/order/$orderId');

      if (response['success'] == true && response['data'] != null) {
        _messages = (response['data'] as List)
            .map((json) => ChatMessage.fromJson(json as Map<String, dynamic>))
            .toList();
      } else if (response['error'] != null) {
        _error = response['error'] as String;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Chat?> getOrCreateChat(String orderId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/chats/order/$orderId');

      if (response['success'] == true && response['data'] != null) {
        final chat = Chat(
          id: orderId,
          buyerId: '',
          sellerId: '',
          unreadCount: 0,
          updatedAt: DateTime.now(),
        );
        _currentChat = chat;
        
        final existingIndex = _chats.indexWhere((c) => c.id == chat.id);
        if (existingIndex == -1) {
          _chats.insert(0, chat);
        }
        
        _isLoading = false;
        notifyListeners();
        return chat;
      }

      _error = response['error'] as String?;
      _isLoading = false;
      notifyListeners();
      return null;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> sendMessage(String orderId, String content, {String? imageUrl, String? receiverId}) async {
    try {
      final response = await _apiService.post('/chats/order/$orderId', {
        'content': content,
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (receiverId != null) 'receiverId': receiverId,
      });

      if (response['success'] == true && response['data'] != null) {
        final message = ChatMessage.fromJson(response['data'] as Map<String, dynamic>);
        _messages.add(message);
        _error = null;
        notifyListeners();
        return true;
      }
      _error = response['error'] as String? ?? 'Failed to send message';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      debugPrint('Error sending message: $e');
      return false;
    }
  }

  Future<void> markAsRead(String orderId) async {
    try {
      final chatIndex = _chats.indexWhere((c) => c.id == orderId);
      if (chatIndex != -1) {
        _calculateTotalUnread();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error marking chat as read: $e');
    }
  }

  void _calculateTotalUnread() {
    _totalUnread = _chats.fold(0, (sum, chat) => sum + chat.unreadCount);
  }

  void setCurrentChat(Chat chat) {
    _currentChat = chat;
    notifyListeners();
  }

  void clearCurrentChat() {
    _currentChat = null;
    _messages = [];
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
