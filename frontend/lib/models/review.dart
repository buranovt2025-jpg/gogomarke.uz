import 'user.dart';

class Review {
  final String id;
  final String productId;
  final String userId;
  final String? orderId;
  final int rating;
  final String comment;
  final List<String> images;
  final User? user;
  final DateTime createdAt;
  final bool isVerifiedPurchase;

  Review({
    required this.id,
    required this.productId,
    required this.userId,
    this.orderId,
    required this.rating,
    required this.comment,
    this.images = const [],
    this.user,
    required this.createdAt,
    this.isVerifiedPurchase = false,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String,
      productId: json['productId'] as String,
      userId: json['userId'] as String,
      orderId: json['orderId'] as String?,
      rating: json['rating'] as int,
      comment: json['comment'] as String? ?? '',
      images: (json['images'] as List<dynamic>?)?.cast<String>() ?? [],
      user: json['user'] != null
          ? User.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      isVerifiedPurchase: json['isVerifiedPurchase'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'userId': userId,
      'orderId': orderId,
      'rating': rating,
      'comment': comment,
      'images': images,
      'createdAt': createdAt.toIso8601String(),
      'isVerifiedPurchase': isVerifiedPurchase,
    };
  }

  String get formattedDate {
    final now = DateTime.now();
    final diff = now.difference(createdAt);
    
    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        return '${diff.inMinutes} min ago';
      }
      return '${diff.inHours} hours ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else if (diff.inDays < 30) {
      return '${diff.inDays ~/ 7} weeks ago';
    } else {
      return '${diff.inDays ~/ 30} months ago';
    }
  }
}
