import 'package:flutter/foundation.dart';

import '../models/review.dart';
import '../services/api_service.dart';

class ReviewProvider with ChangeNotifier {
  List<Review> _reviews = [];
  bool _isLoading = false;
  String? _error;
  double _averageRating = 0.0;
  int _totalReviews = 0;
  
  final ApiService _apiService = ApiService();

  List<Review> get reviews => _reviews;
  bool get isLoading => _isLoading;
  String? get error => _error;
  double get averageRating => _averageRating;
  int get totalReviews => _totalReviews;

  Future<void> fetchProductReviews(String productId, {bool refresh = false}) async {
    if (refresh) {
      _reviews = [];
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/products/$productId/reviews');

      if (response['success'] == true && response['data'] != null) {
        _reviews = (response['data'] as List)
            .map((json) => Review.fromJson(json as Map<String, dynamic>))
            .toList();
        
        if (response['averageRating'] != null) {
          _averageRating = (response['averageRating'] as num).toDouble();
        }
        if (response['totalReviews'] != null) {
          _totalReviews = response['totalReviews'] as int;
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitReview({
    required String productId,
    required String orderId,
    required int rating,
    required String comment,
    List<String>? images,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/products/$productId/reviews', {
        'orderId': orderId,
        'rating': rating,
        'comment': comment,
        if (images != null) 'images': images,
      });

      if (response['success'] == true && response['data'] != null) {
        final newReview = Review.fromJson(response['data'] as Map<String, dynamic>);
        _reviews.insert(0, newReview);
        _totalReviews++;
        _recalculateAverageRating();
        
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _error = response['error'] as String?;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void _recalculateAverageRating() {
    if (_reviews.isEmpty) {
      _averageRating = 0.0;
      return;
    }
    final sum = _reviews.fold<int>(0, (sum, review) => sum + review.rating);
    _averageRating = sum / _reviews.length;
  }

  void clearReviews() {
    _reviews = [];
    _averageRating = 0.0;
    _totalReviews = 0;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
