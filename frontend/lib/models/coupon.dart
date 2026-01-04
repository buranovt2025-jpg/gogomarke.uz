class Coupon {
  final String id;
  final String code;
  final String? description;
  final String discountType; // 'percentage' or 'fixed'
  final double discountValue;
  final double? minOrderAmount;
  final double? maxDiscount;
  final DateTime? validFrom;
  final DateTime? validUntil;
  final int? usageLimit;
  final int usageCount;
  final bool isActive;

  Coupon({
    required this.id,
    required this.code,
    this.description,
    required this.discountType,
    required this.discountValue,
    this.minOrderAmount,
    this.maxDiscount,
    this.validFrom,
    this.validUntil,
    this.usageLimit,
    this.usageCount = 0,
    this.isActive = true,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) {
    return Coupon(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      discountType: json['discount_type'] ?? json['discountType'] ?? 'percentage',
      discountValue: (json['discount_value'] ?? json['discountValue'] ?? 0).toDouble(),
      minOrderAmount: json['min_order_amount'] != null ? (json['min_order_amount']).toDouble() : null,
      maxDiscount: json['max_discount'] != null ? (json['max_discount']).toDouble() : null,
      validFrom: json['valid_from'] != null ? DateTime.parse(json['valid_from']) : null,
      validUntil: json['valid_until'] != null ? DateTime.parse(json['valid_until']) : null,
      usageLimit: json['usage_limit'],
      usageCount: json['usage_count'] ?? 0,
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'description': description,
      'discount_type': discountType,
      'discount_value': discountValue,
      'min_order_amount': minOrderAmount,
      'max_discount': maxDiscount,
      'valid_from': validFrom?.toIso8601String(),
      'valid_until': validUntil?.toIso8601String(),
      'usage_limit': usageLimit,
      'usage_count': usageCount,
      'is_active': isActive,
    };
  }

  bool get isValid {
    if (!isActive) return false;
    final now = DateTime.now();
    if (validFrom != null && now.isBefore(validFrom!)) return false;
    if (validUntil != null && now.isAfter(validUntil!)) return false;
    if (usageLimit != null && usageCount >= usageLimit!) return false;
    return true;
  }

  double calculateDiscount(double orderAmount) {
    if (!isValid) return 0;
    if (minOrderAmount != null && orderAmount < minOrderAmount!) return 0;

    double discount;
    if (discountType == 'percentage') {
      discount = orderAmount * (discountValue / 100);
    } else {
      discount = discountValue;
    }

    if (maxDiscount != null && discount > maxDiscount!) {
      discount = maxDiscount!;
    }

    return discount;
  }

  String get formattedDiscount {
    if (discountType == 'percentage') {
      return '${discountValue.toInt()}%';
    } else {
      return '${discountValue.toStringAsFixed(0)} UZS';
    }
  }
}
