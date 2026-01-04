import '../models/product.dart';

class ViewHistoryItem {
  final String id;
  final String userId;
  final String productId;
  final String? videoId;
  final Product? product;
  final DateTime viewedAt;
  final int viewDuration; // in seconds

  ViewHistoryItem({
    required this.id,
    required this.userId,
    required this.productId,
    this.videoId,
    this.product,
    DateTime? viewedAt,
    this.viewDuration = 0,
  }) : viewedAt = viewedAt ?? DateTime.now();

  factory ViewHistoryItem.fromJson(Map<String, dynamic> json) {
    return ViewHistoryItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      productId: json['product_id']?.toString() ?? json['productId']?.toString() ?? '',
      videoId: json['video_id']?.toString() ?? json['videoId']?.toString(),
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
      viewedAt: json['viewed_at'] != null 
          ? DateTime.parse(json['viewed_at']) 
          : DateTime.now(),
      viewDuration: json['view_duration'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'product_id': productId,
      'video_id': videoId,
      'viewed_at': viewedAt.toIso8601String(),
      'view_duration': viewDuration,
    };
  }

  String get formattedDate {
    final now = DateTime.now();
    final diff = now.difference(viewedAt);

    if (diff.inDays == 0) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${viewedAt.day}/${viewedAt.month}/${viewedAt.year}';
    }
  }
}
