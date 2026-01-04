import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/view_history.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class ViewHistoryProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<ViewHistoryItem> _history = [];
  List<Product> _recommendations = [];
  bool _isLoading = false;
  String? _error;

  List<ViewHistoryItem> get history => _history;
  List<Product> get recommendations => _recommendations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchHistory() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/view-history');
      if (response != null && response['history'] != null) {
        _history = (response['history'] as List)
            .map((json) => ViewHistoryItem.fromJson(json))
            .toList();
        await _saveToCache();
      }
      _error = null;
    } catch (e) {
      _error = 'Failed to load view history';
      await _loadFromCache();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchRecommendations() async {
    try {
      final response = await _apiService.get('/recommendations');
      if (response != null && response['products'] != null) {
        _recommendations = (response['products'] as List)
            .map((json) => Product.fromJson(json))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching recommendations: $e');
    }
  }

  Future<void> addToHistory(String productId, {String? videoId, int duration = 0}) async {
    try {
      await _apiService.post('/view-history', {
        'product_id': productId,
        'video_id': videoId,
        'view_duration': duration,
      });
      
      final item = ViewHistoryItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: '',
        productId: productId,
        videoId: videoId,
        viewDuration: duration,
      );
      
      _history.removeWhere((h) => h.productId == productId);
      _history.insert(0, item);
      
      if (_history.length > 100) {
        _history = _history.sublist(0, 100);
      }
      
      await _saveToCache();
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding to history: $e');
    }
  }

  Future<void> removeFromHistory(String itemId) async {
    try {
      await _apiService.delete('/view-history/$itemId');
      _history.removeWhere((h) => h.id == itemId);
      await _saveToCache();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to remove from history';
      notifyListeners();
    }
  }

  Future<void> clearHistory() async {
    try {
      await _apiService.delete('/view-history');
      _history.clear();
      await _saveToCache();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to clear history';
      notifyListeners();
    }
  }

  Future<void> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('view_history');
      if (cached != null) {
        final List<dynamic> decoded = json.decode(cached);
        _history = decoded.map((json) => ViewHistoryItem.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error loading history from cache: $e');
    }
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = json.encode(_history.map((h) => h.toJson()).toList());
      await prefs.setString('view_history', encoded);
    } catch (e) {
      debugPrint('Error saving history to cache: $e');
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
