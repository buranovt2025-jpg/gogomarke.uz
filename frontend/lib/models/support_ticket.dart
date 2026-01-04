class SupportTicket {
  final String id;
  final String userId;
  final String subject;
  final String description;
  final String category; // 'order', 'payment', 'delivery', 'product', 'account', 'other'
  final String status; // 'open', 'in_progress', 'resolved', 'closed'
  final String priority; // 'low', 'medium', 'high', 'urgent'
  final String? orderId;
  final List<TicketMessage> messages;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? resolvedAt;

  SupportTicket({
    required this.id,
    required this.userId,
    required this.subject,
    required this.description,
    required this.category,
    this.status = 'open',
    this.priority = 'medium',
    this.orderId,
    this.messages = const [],
    DateTime? createdAt,
    this.updatedAt,
    this.resolvedAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      subject: json['subject'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'other',
      status: json['status'] ?? 'open',
      priority: json['priority'] ?? 'medium',
      orderId: json['order_id']?.toString() ?? json['orderId']?.toString(),
      messages: json['messages'] != null
          ? (json['messages'] as List).map((m) => TicketMessage.fromJson(m)).toList()
          : [],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
      resolvedAt: json['resolved_at'] != null ? DateTime.parse(json['resolved_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'subject': subject,
      'description': description,
      'category': category,
      'status': status,
      'priority': priority,
      'order_id': orderId,
      'messages': messages.map((m) => m.toJson()).toList(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'resolved_at': resolvedAt?.toIso8601String(),
    };
  }

  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }

  String get categoryLabel {
    switch (category) {
      case 'order':
        return 'Order Issue';
      case 'payment':
        return 'Payment';
      case 'delivery':
        return 'Delivery';
      case 'product':
        return 'Product';
      case 'account':
        return 'Account';
      default:
        return 'Other';
    }
  }

  String get formattedDate {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  bool get isOpen => status == 'open' || status == 'in_progress';
}

class TicketMessage {
  final String id;
  final String ticketId;
  final String senderId;
  final String senderType; // 'user', 'admin', 'system'
  final String content;
  final List<String> attachments;
  final DateTime createdAt;

  TicketMessage({
    required this.id,
    required this.ticketId,
    required this.senderId,
    required this.senderType,
    required this.content,
    this.attachments = const [],
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    return TicketMessage(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      ticketId: json['ticket_id']?.toString() ?? json['ticketId']?.toString() ?? '',
      senderId: json['sender_id']?.toString() ?? json['senderId']?.toString() ?? '',
      senderType: json['sender_type'] ?? json['senderType'] ?? 'user',
      content: json['content'] ?? '',
      attachments: json['attachments'] != null 
          ? List<String>.from(json['attachments']) 
          : [],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticket_id': ticketId,
      'sender_id': senderId,
      'sender_type': senderType,
      'content': content,
      'attachments': attachments,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isFromUser => senderType == 'user';
  bool get isFromAdmin => senderType == 'admin';
  bool get isSystem => senderType == 'system';

  String get formattedTime {
    return '${createdAt.hour.toString().padLeft(2, "0")}:${createdAt.minute.toString().padLeft(2, "0")}';
  }
}
