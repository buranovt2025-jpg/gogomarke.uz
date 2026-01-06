import 'user.dart';

class Story {
  final String id;
  final String sellerId;
  final String? videoUrl;
  final String? imageUrl;
  final String? thumbnailUrl;
  final String? title;
  final int duration;
  final bool isLive;
  final bool isViewed;
  final User? seller;
  final DateTime? createdAt;
  final DateTime? expiresAt;

  Story({
    required this.id,
    required this.sellerId,
    this.videoUrl,
    this.imageUrl,
    this.thumbnailUrl,
    this.title,
    this.duration = 5,
    this.isLive = false,
    this.isViewed = false,
    this.seller,
    this.createdAt,
    this.expiresAt,
  });

  bool get isVideo => videoUrl != null && videoUrl!.isNotEmpty;
  bool get isImage => imageUrl != null && imageUrl!.isNotEmpty;
  
  String? get mediaUrl => isVideo ? videoUrl : imageUrl;

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] as String,
      sellerId: (json['sellerId'] ?? json['ownerId']) as String,
      videoUrl: json['videoUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      title: json['title'] as String?,
      duration: json['duration'] as int? ?? 5,
      isLive: json['isLive'] as bool? ?? false,
      isViewed: json['isViewed'] as bool? ?? false,
      seller: (json['seller'] ?? json['owner']) != null
          ? User.fromJson((json['seller'] ?? json['owner']) as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sellerId': sellerId,
      'videoUrl': videoUrl,
      'imageUrl': imageUrl,
      'thumbnailUrl': thumbnailUrl,
      'title': title,
      'duration': duration,
      'isLive': isLive,
      'isViewed': isViewed,
      'createdAt': createdAt?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }

  Story copyWith({
    String? id,
    String? sellerId,
    String? videoUrl,
    String? imageUrl,
    String? thumbnailUrl,
    String? title,
    int? duration,
    bool? isLive,
    bool? isViewed,
    User? seller,
    DateTime? createdAt,
    DateTime? expiresAt,
  }) {
    return Story(
      id: id ?? this.id,
      sellerId: sellerId ?? this.sellerId,
      videoUrl: videoUrl ?? this.videoUrl,
      imageUrl: imageUrl ?? this.imageUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      title: title ?? this.title,
      duration: duration ?? this.duration,
      isLive: isLive ?? this.isLive,
      isViewed: isViewed ?? this.isViewed,
      seller: seller ?? this.seller,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }
}

class SellerStories {
  final String sellerId;
  final User? seller;
  final List<Story> stories;
  final bool isLive;
  final bool hasUnviewed;

  SellerStories({
    required this.sellerId,
    this.seller,
    required this.stories,
    this.isLive = false,
    this.hasUnviewed = true,
  });

  factory SellerStories.fromStories(List<Story> stories) {
    if (stories.isEmpty) {
      throw ArgumentError('Stories list cannot be empty');
    }
    final firstStory = stories.first;
    return SellerStories(
      sellerId: firstStory.sellerId,
      seller: firstStory.seller,
      stories: stories,
      isLive: stories.any((s) => s.isLive),
      hasUnviewed: stories.any((s) => !s.isViewed),
    );
  }
}
