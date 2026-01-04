class Address {
  final String id;
  final String userId;
  final String title;
  final String fullAddress;
  final String? apartment;
  final String? entrance;
  final String? floor;
  final String? intercom;
  final String? comment;
  final double? latitude;
  final double? longitude;
  final String? city;
  final String? district;
  final bool isDefault;
  final DateTime createdAt;

  Address({
    required this.id,
    required this.userId,
    required this.title,
    required this.fullAddress,
    this.apartment,
    this.entrance,
    this.floor,
    this.intercom,
    this.comment,
    this.latitude,
    this.longitude,
    this.city,
    this.district,
    this.isDefault = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      title: json['title'] ?? 'Home',
      fullAddress: json['full_address'] ?? json['fullAddress'] ?? json['address'] ?? '',
      apartment: json['apartment'],
      entrance: json['entrance'],
      floor: json['floor'],
      intercom: json['intercom'],
      comment: json['comment'],
      latitude: json['latitude'] != null ? (json['latitude']).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude']).toDouble() : null,
      city: json['city'],
      district: json['district'],
      isDefault: json['is_default'] ?? json['isDefault'] ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'full_address': fullAddress,
      'apartment': apartment,
      'entrance': entrance,
      'floor': floor,
      'intercom': intercom,
      'comment': comment,
      'latitude': latitude,
      'longitude': longitude,
      'city': city,
      'district': district,
      'is_default': isDefault,
      'created_at': createdAt.toIso8601String(),
    };
  }

  Address copyWith({
    String? id,
    String? userId,
    String? title,
    String? fullAddress,
    String? apartment,
    String? entrance,
    String? floor,
    String? intercom,
    String? comment,
    double? latitude,
    double? longitude,
    String? city,
    String? district,
    bool? isDefault,
    DateTime? createdAt,
  }) {
    return Address(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      fullAddress: fullAddress ?? this.fullAddress,
      apartment: apartment ?? this.apartment,
      entrance: entrance ?? this.entrance,
      floor: floor ?? this.floor,
      intercom: intercom ?? this.intercom,
      comment: comment ?? this.comment,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      city: city ?? this.city,
      district: district ?? this.district,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  String get shortAddress {
    final parts = <String>[];
    parts.add(fullAddress);
    if (apartment != null && apartment!.isNotEmpty) {
      parts.add('apt. $apartment');
    }
    return parts.join(', ');
  }

  String get deliveryDetails {
    final parts = <String>[];
    if (entrance != null && entrance!.isNotEmpty) parts.add('Entrance: $entrance');
    if (floor != null && floor!.isNotEmpty) parts.add('Floor: $floor');
    if (intercom != null && intercom!.isNotEmpty) parts.add('Intercom: $intercom');
    if (comment != null && comment!.isNotEmpty) parts.add('Note: $comment');
    return parts.join(' | ');
  }
}
