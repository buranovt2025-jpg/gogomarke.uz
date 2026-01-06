import 'package:flutter/foundation.dart';

import '../models/story.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class StoryProvider with ChangeNotifier {
  List<SellerStories> _sellerStories = [];
  bool _isLoading = false;
  String? _error;

  final ApiService _apiService = ApiService();

  List<SellerStories> get sellerStories => _sellerStories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchStories({bool refresh = false}) async {
    if (_isLoading && !refresh) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/stories');

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'] as List;
        _sellerStories = [];

        for (final group in data) {
          final sellerId = group['sellerId'] as String?;
          final sellerData = group['seller'] as Map<String, dynamic>?;
          final storiesData = group['stories'] as List?;

          if (sellerId != null && storiesData != null && storiesData.isNotEmpty) {
            final stories = storiesData.map((s) {
              final storyMap = s as Map<String, dynamic>;
              return Story(
                id: storyMap['id'] as String,
                sellerId: sellerId,
                videoUrl: storyMap['mediaType'] == 'video' ? storyMap['mediaUrl'] as String? : null,
                imageUrl: storyMap['mediaType'] == 'image' ? storyMap['mediaUrl'] as String? : null,
                thumbnailUrl: storyMap['thumbnailUrl'] as String?,
                title: storyMap['caption'] as String?,
                duration: 5,
                isLive: false,
                isViewed: false,
                seller: sellerData != null ? User.fromJson(sellerData) : null,
                createdAt: storyMap['createdAt'] != null
                    ? DateTime.parse(storyMap['createdAt'] as String)
                    : null,
                expiresAt: storyMap['expiresAt'] != null
                    ? DateTime.parse(storyMap['expiresAt'] as String)
                    : null,
              );
            }).toList();

            _sellerStories.add(SellerStories(
              sellerId: sellerId,
              seller: sellerData != null ? User.fromJson(sellerData) : null,
              stories: stories,
              isLive: false,
              hasUnviewed: true,
            ));
          }
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      debugPrint('Error fetching stories: $e');
    }
  }

  void clear() {
    _sellerStories = [];
    _error = null;
    notifyListeners();
  }
}
