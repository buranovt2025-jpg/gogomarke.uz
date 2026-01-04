import 'product.dart';
import 'order.dart';

class ReturnRequest {
  final String id;
  final String orderId;
  final String userId;
  final String productId;
  final String reason;
  final String description;
  final String status;
  final String? adminResponse;
  final List<String> images;
  final String refundMethod;
  final double refundAmount;
  final Product? product;
  final Order? order;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? resolvedAt;

  ReturnRequest({
    required this.id,
    required this.orderId,
    required this.userId,
    required this.productId,
    required this.reason,
    required this.description,
    required this.status,
    this.adminResponse,
    required this.images,
    required this.refundMethod,
    required this.refundAmount,
    this.product,
    this.order,
    required this.createdAt,
    this.updatedAt,
    this.resolvedAt,
  });

  factory ReturnRequest.fromJson(Map<String, dynamic> json) {
    return ReturnRequest(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? json['order_id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? json['product_id']?.toString() ?? '',
      reason: json['reason'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'pending',
      adminResponse: json['adminResponse'] ?? json['admin_response'],
      images: json['images'] != null 
          ? List<String>.from(json['images']) 
          : [],
      refundMethod: json['refundMethod'] ?? json['refund_method'] ?? 'original',
      refundAmount: (json['refundAmount'] ?? json['refund_amount'] ?? 0).toDouble(),
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
      order: json['order'] != null ? Order.fromJson(json['order']) : null,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : (json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now()),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : (json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null),
      resolvedAt: json['resolvedAt'] != null 
          ? DateTime.parse(json['resolvedAt']) 
          : (json['resolved_at'] != null ? DateTime.parse(json['resolved_at']) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'userId': userId,
      'productId': productId,
      'reason': reason,
      'description': description,
      'status': status,
      'adminResponse': adminResponse,
      'images': images,
      'refundMethod': refundMethod,
      'refundAmount': refundAmount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'resolvedAt': resolvedAt?.toIso8601String(),
    };
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  String get reasonLabel {
    switch (reason) {
      case 'defective':
        return 'Defective Product';
      case 'wrong_item':
        return 'Wrong Item Received';
      case 'not_as_described':
        return 'Not As Described';
      case 'damaged':
        return 'Damaged During Shipping';
      case 'changed_mind':
        return 'Changed My Mind';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  }

  String get refundMethodLabel {
    switch (refundMethod) {
      case 'original':
        return 'Original Payment Method';
      case 'wallet':
        return 'Store Wallet';
      case 'bank':
        return 'Bank Transfer';
      default:
        return refundMethod;
    }
  }

  String get formattedDate {
    return '${createdAt.day.toString().padLeft(2, '0')}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}';
  }

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isCompleted => status == 'completed';
  bool get canCancel => status == 'pending';

  ReturnRequest copyWith({
    String? id,
    String? orderId,
    String? userId,
    String? productId,
    String? reason,
    String? description,
    String? status,
    String? adminResponse,
    List<String>? images,
    String? refundMethod,
    double? refundAmount,
    Product? product,
    Order? order,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? resolvedAt,
  }) {
    return ReturnRequest(
      id: id ?? this.id,
      orderId: orderId ?? this.orderId,
      userId: userId ?? this.userId,
      productId: productId ?? this.productId,
      reason: reason ?? this.reason,
      description: description ?? this.description,
      status: status ?? this.status,
      adminResponse: adminResponse ?? this.adminResponse,
      images: images ?? this.images,
      refundMethod: refundMethod ?? this.refundMethod,
      refundAmount: refundAmount ?? this.refundAmount,
      product: product ?? this.product,
      order: order ?? this.order,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
    );
  }
}
