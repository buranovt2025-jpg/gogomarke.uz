import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class PlatformStats {
  final int totalUsers;
  final int totalBuyers;
  final int totalSellers;
  final int totalCouriers;
  final int totalProducts;
  final int totalOrders;
  final int pendingOrders;
  final int completedOrders;
  final int totalVideos;
  final double totalRevenue;

  PlatformStats({
    this.totalUsers = 0,
    this.totalBuyers = 0,
    this.totalSellers = 0,
    this.totalCouriers = 0,
    this.totalProducts = 0,
    this.totalOrders = 0,
    this.pendingOrders = 0,
    this.completedOrders = 0,
    this.totalVideos = 0,
    this.totalRevenue = 0,
  });

  factory PlatformStats.fromJson(Map<String, dynamic> json) {
    final users = json['users'] ?? {};
    final orders = json['orders'] ?? {};
    final products = json['products'] ?? {};
    final videos = json['videos'] ?? {};
    final revenue = json['revenue'] ?? {};
    return PlatformStats(
      totalUsers: users['total'] ?? 0,
      totalBuyers: users['buyers'] ?? 0,
      totalSellers: users['sellers'] ?? 0,
      totalCouriers: users['couriers'] ?? 0,
      totalProducts: products['total'] ?? 0,
      totalOrders: orders['total'] ?? 0,
      pendingOrders: orders['pending'] ?? 0,
      completedOrders: orders['completed'] ?? 0,
      totalVideos: videos['total'] ?? 0,
      totalRevenue: (revenue['total'] ?? 0).toDouble(),
    );
  }
}

class AdminProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  PlatformStats _stats = PlatformStats();
  List<User> _users = [];
  List<Order> _orders = [];
  bool _isLoading = false;
  String? _error;
  int _totalUsers = 0;
  int _totalOrders = 0;

  PlatformStats get stats => _stats;
  List<User> get users => _users;
  List<Order> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalUsers => _totalUsers;
  int get totalOrders => _totalOrders;

  Future<void> fetchStats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/admin/stats');
      if (response['success'] != false) {
        final data = response['data'] ?? response;
        _stats = PlatformStats.fromJson(data);
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchUsers({int page = 1, int limit = 20, String? role, String? search}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String url = '/admin/users?page=$page&limit=$limit';
      if (role != null) url += '&role=$role';
      if (search != null && search.isNotEmpty) url += '&search=$search';

      final response = await _apiService.get(url);
      if (response['success'] != false) {
        final data = response['data'] ?? response;
        final List<dynamic> usersData = data['users'] ?? [];
        final pagination = data['pagination'] ?? {};
        
        if (page == 1) {
          _users = usersData.map((json) => User.fromJson(json)).toList();
        } else {
          _users.addAll(usersData.map((json) => User.fromJson(json)));
        }
        _totalUsers = pagination['total'] ?? _users.length;
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOrders({int page = 1, int limit = 20, String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String url = '/admin/orders?page=$page&limit=$limit';
      if (status != null) url += '&status=$status';

      final response = await _apiService.get(url);
      if (response['success'] != false) {
        final data = response['data'] ?? response;
        final List<dynamic> ordersData = data['orders'] ?? [];
        final pagination = data['pagination'] ?? {};
        
        if (page == 1) {
          _orders = ordersData.map((json) => Order.fromJson(json)).toList();
        } else {
          _orders.addAll(ordersData.map((json) => Order.fromJson(json)));
        }
        _totalOrders = pagination['total'] ?? _orders.length;
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> updateUser(String userId, {bool? isActive, String? role}) async {
    try {
      final response = await _apiService.put('/admin/users/$userId', {
        if (isActive != null) 'isActive': isActive,
        if (role != null) 'role': role,
      });
      if (response['success'] != false) {
        await fetchUsers();
        return true;
      }
      _error = response['error'] ?? 'Failed to update user';
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
    _stats = PlatformStats();
    _users = [];
    _orders = [];
    _error = null;
    notifyListeners();
  }
}
