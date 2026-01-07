class Dispute {
  final String id;
  final String orderId;
  final String reporterId;
  final String? assignedAdminId;
  final String status;
  final String reason;
  final String description;
  final List<String> evidence;
  final String? resolution;
  final DateTime? resolvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  Dispute({
    required this.id,
    required this.orderId,
    required this.reporterId,
    this.assignedAdminId,
    required this.status,
    required this.reason,
    required this.description,
    this.evidence = const [],
    this.resolution,
    this.resolvedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Dispute.fromJson(Map<String, dynamic> json) {
    return Dispute(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? json['order_id'] ?? '',
      reporterId: json['reporterId'] ?? json['reporter_id'] ?? '',
      assignedAdminId: json['assignedAdminId'] ?? json['assigned_admin_id'],
      status: json['status'] ?? 'open',
      reason: json['reason'] ?? '',
      description: json['description'] ?? '',
      evidence: (json['evidence'] as List<dynamic>?)?.cast<String>() ?? [],
      resolution: json['resolution'],
      resolvedAt: json['resolvedAt'] != null ? DateTime.parse(json['resolvedAt']) : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_review':
        return 'In Review';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }

  String get reasonLabel {
    switch (reason) {
      case 'not_received':
        return 'Not Received';
      case 'wrong_item':
        return 'Wrong Item';
      case 'damaged':
        return 'Damaged';
      case 'quality':
        return 'Quality Issue';
      case 'incomplete':
        return 'Incomplete Order';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  }

  String get formattedDate {
    return '${createdAt.day}.${createdAt.month}.${createdAt.year}';
  }
}
