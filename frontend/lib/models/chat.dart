import 'user.dart';

class ChatMessage {
  final String id;
  final String chatId;
  final String senderId;
  final String content;
  final String? imageUrl;
  final DateTime createdAt;
  final bool isRead;

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.content,
    this.imageUrl,
    required this.createdAt,
    this.isRead = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      chatId: json['chatId'] as String,
      senderId: json['senderId'] as String,
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      isRead: json['isRead'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chatId': chatId,
      'senderId': senderId,
      'content': content,
      'imageUrl': imageUrl,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
    };
  }
}

class Chat {
  final String id;
  final String buyerId;
  final String sellerId;
  final User? buyer;
  final User? seller;
  final ChatMessage? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  Chat({
    required this.id,
    required this.buyerId,
    required this.sellerId,
    this.buyer,
    this.seller,
    this.lastMessage,
    this.unreadCount = 0,
    required this.updatedAt,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['id'] as String,
      buyerId: json['buyerId'] as String,
      sellerId: json['sellerId'] as String,
      buyer: json['buyer'] != null
          ? User.fromJson(json['buyer'] as Map<String, dynamic>)
          : null,
      seller: json['seller'] != null
          ? User.fromJson(json['seller'] as Map<String, dynamic>)
          : null,
      lastMessage: json['lastMessage'] != null
          ? ChatMessage.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'unreadCount': unreadCount,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
