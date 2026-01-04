import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../services/api_service.dart';

class VideoInteractionProvider with ChangeNotifier {
  final Set<String> _likedVideoIds = {};
  final Map<String, int> _videoLikeCounts = {};
  bool _isLoading = false;
  static const String _likesKey = 'liked_videos';
  
  final ApiService _apiService = ApiService();

  Set<String> get likedVideoIds => _likedVideoIds;
  bool get isLoading => _isLoading;

  VideoInteractionProvider() {
    _loadLikedVideos();
  }

  Future<void> _loadLikedVideos() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final likesJson = prefs.getString(_likesKey);

      if (likesJson != null && likesJson.isNotEmpty) {
        final List<dynamic> ids = jsonDecode(likesJson) as List<dynamic>;
        _likedVideoIds.addAll(ids.cast<String>());
      }
    } catch (e) {
      debugPrint('Error loading liked videos: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _saveLikedVideos() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_likesKey, jsonEncode(_likedVideoIds.toList()));
    } catch (e) {
      debugPrint('Error saving liked videos: $e');
    }
  }

  bool isLiked(String videoId) {
    return _likedVideoIds.contains(videoId);
  }

  int getLikeCount(String videoId, int originalCount) {
    if (_videoLikeCounts.containsKey(videoId)) {
      return _videoLikeCounts[videoId]!;
    }
    return originalCount;
  }

  Future<void> toggleLike(String videoId, int currentLikeCount) async {
    final wasLiked = _likedVideoIds.contains(videoId);
    
    if (wasLiked) {
      _likedVideoIds.remove(videoId);
      _videoLikeCounts[videoId] = currentLikeCount - 1;
    } else {
      _likedVideoIds.add(videoId);
      _videoLikeCounts[videoId] = currentLikeCount + 1;
    }
    
    notifyListeners();
    await _saveLikedVideos();

    try {
      if (wasLiked) {
        await _apiService.delete('/videos/$videoId/like');
      } else {
        await _apiService.post('/videos/$videoId/like', {});
      }
    } catch (e) {
      debugPrint('Error syncing like to server: $e');
    }
  }

  Future<void> likeVideo(String videoId, int currentLikeCount) async {
    if (_likedVideoIds.contains(videoId)) return;
    
    _likedVideoIds.add(videoId);
    _videoLikeCounts[videoId] = currentLikeCount + 1;
    notifyListeners();
    
    await _saveLikedVideos();

    try {
      await _apiService.post('/videos/$videoId/like', {});
    } catch (e) {
      debugPrint('Error liking video on server: $e');
    }
  }

  Future<void> unlikeVideo(String videoId, int currentLikeCount) async {
    if (!_likedVideoIds.contains(videoId)) return;
    
    _likedVideoIds.remove(videoId);
    _videoLikeCounts[videoId] = currentLikeCount - 1;
    notifyListeners();
    
    await _saveLikedVideos();

    try {
      await _apiService.delete('/videos/$videoId/like');
    } catch (e) {
      debugPrint('Error unliking video on server: $e');
    }
  }

  void clear() {
    _likedVideoIds.clear();
    _videoLikeCounts.clear();
    _saveLikedVideos();
    notifyListeners();
  }
}
