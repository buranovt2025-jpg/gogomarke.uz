import 'package:flutter/foundation.dart';

import '../models/product.dart';
import '../models/order.dart';
import '../models/video.dart';
import '../services/api_service.dart';

class SellerStats {
  final double totalSales;
  final int totalOrders;
  final int totalProducts;
  final int totalVideos;
  final int pendingOrders;
  final double todaySales;
  final int todayOrders;
  final double rating;
  final int followers;

  SellerStats({
    this.totalSales = 0,
    this.totalOrders = 0,
    this.totalProducts = 0,
    this.totalVideos = 0,
    this.pendingOrders = 0,
    this.todaySales = 0,
    this.todayOrders = 0,
    this.rating = 0,
    this.followers = 0,
  });

  factory SellerStats.fromJson(Map<String, dynamic> json) {
    return SellerStats(
      totalSales: (json['totalSales'] ?? json['total_sales'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? json['total_orders'] ?? 0,
      totalProducts: json['totalProducts'] ?? json['total_products'] ?? 0,
      totalVideos: json['totalVideos'] ?? json['total_videos'] ?? 0,
      pendingOrders: json['pendingOrders'] ?? json['pending_orders'] ?? 0,
      todaySales: (json['todaySales'] ?? json['today_sales'] ?? 0).toDouble(),
      todayOrders: json['todayOrders'] ?? json['today_orders'] ?? 0,
      rating: (json['rating'] ?? 0).toDouble(),
      followers: json['followers'] ?? 0,
    );
  }
}

class SellerProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

    SellerStats _stats = SellerStats();
    List<Product> _products = [];
    List<Order> _recentOrders = [];
    List<Video> _videos = [];
    bool _isLoading = false;
    String? _error;

    SellerStats get stats => _stats;
    List<Product> get products => _products;
    List<Order> get recentOrders => _recentOrders;
    List<Video> get videos => _videos;
    bool get isLoading => _isLoading;
    String? get error => _error;

  Future<void> fetchSellerStats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/seller/stats');
      if (response['success'] != false) {
        final data = response['data'] ?? response;
        _stats = SellerStats.fromJson(data);
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchSellerProducts() async {
    try {
      final response = await _apiService.get('/products/seller');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? response['products'] ?? [];
        _products = data.map((json) => Product.fromJson(json)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching seller products: $e');
    }
  }

  Future<void> fetchRecentOrders() async {
    try {
      final response = await _apiService.get('/seller/orders?limit=5');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? response['orders'] ?? [];
        _recentOrders = data.map((json) => Order.fromJson(json)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching recent orders: $e');
    }
  }

  Future<bool> createProduct(Map<String, dynamic> productData) async {
    try {
      final response = await _apiService.post('/products', productData);
      if (response['success'] != false) {
        await fetchSellerProducts();
        await fetchSellerStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to create product';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateProduct(String productId, Map<String, dynamic> productData) async {
    try {
      final response = await _apiService.put('/products/$productId', productData);
      if (response['success'] != false) {
        await fetchSellerProducts();
        return true;
      }
      _error = response['error'] ?? 'Failed to update product';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteProduct(String productId) async {
    try {
      final response = await _apiService.delete('/products/$productId');
      if (response['success'] != false) {
        _products.removeWhere((p) => p.id == productId);
        await fetchSellerStats();
        notifyListeners();
        return true;
      }
      _error = response['error'] ?? 'Failed to delete product';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateOrderStatus(String orderId, String status) async {
    try {
      final response = await _apiService.put('/orders/$orderId/status', {'status': status});
      if (response['success'] != false) {
        await fetchRecentOrders();
        await fetchSellerStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to update order status';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchSellerVideos() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/videos/seller');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? response['videos'] ?? [];
        _videos = data.map((json) => Video.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching seller videos: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createVideo(Map<String, dynamic> videoData) async {
    try {
      final response = await _apiService.post('/videos', videoData);
      if (response['success'] != false) {
        await fetchSellerVideos();
        await fetchSellerStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to create video';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateVideo(String videoId, Map<String, dynamic> videoData) async {
    try {
      final response = await _apiService.put('/videos/$videoId', videoData);
      if (response['success'] != false) {
        await fetchSellerVideos();
        return true;
      }
      _error = response['error'] ?? 'Failed to update video';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteVideo(String videoId) async {
    try {
      final response = await _apiService.delete('/videos/$videoId');
      if (response['success'] != false) {
        _videos.removeWhere((v) => v.id == videoId);
        await fetchSellerStats();
        notifyListeners();
        return true;
      }
      _error = response['error'] ?? 'Failed to delete video';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearData() {
    _stats = SellerStats();
    _products = [];
    _recentOrders = [];
    _videos = [];
    _error = null;
    notifyListeners();
  }
}
