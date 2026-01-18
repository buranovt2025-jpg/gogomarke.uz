import 'package:flutter/foundation.dart';

import '../models/order.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class CourierStats {
  final int totalDeliveries;
  final int pendingDeliveries;
  final int completedToday;
  final double totalEarnings;
  final double todayEarnings;
  final double availableBalance;
  final double pendingBalance;
  final double rating;

  CourierStats({
    this.totalDeliveries = 0,
    this.pendingDeliveries = 0,
    this.completedToday = 0,
    this.totalEarnings = 0,
    this.todayEarnings = 0,
    this.availableBalance = 0,
    this.pendingBalance = 0,
    this.rating = 0,
  });

  factory CourierStats.fromJson(Map<String, dynamic> json) {
    return CourierStats(
      totalDeliveries: json['totalDeliveries'] ?? json['total_deliveries'] ?? 0,
      pendingDeliveries: json['pendingDeliveries'] ?? json['pending_deliveries'] ?? 0,
      completedToday: json['completedToday'] ?? json['completed_today'] ?? 0,
      totalEarnings: (json['totalEarnings'] ?? json['total_earnings'] ?? 0).toDouble(),
      todayEarnings: (json['todayEarnings'] ?? json['today_earnings'] ?? 0).toDouble(),
      availableBalance: (json['availableBalance'] ?? json['available_balance'] ?? 0).toDouble(),
      pendingBalance: (json['pendingBalance'] ?? json['pending_balance'] ?? 0).toDouble(),
      rating: (json['rating'] ?? 0).toDouble(),
    );
  }
}

class CourierProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  CourierStats _stats = CourierStats();
  List<Order> _availableOrders = [];
  List<Order> _myDeliveries = [];
  List<Order> _deliveryHistory = [];
  bool _isLoading = false;
  String? _error;

  CourierStats get stats => _stats;
  List<Order> get availableOrders => _availableOrders;
  List<Order> get myDeliveries => _myDeliveries;
  List<Order> get deliveryHistory => _deliveryHistory;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchCourierStats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/courier/stats');
      if (response['success'] != false) {
        final data = response['data'] ?? response;
        _stats = CourierStats.fromJson(data);
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchAvailableOrders() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/orders/available');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? response['orders'] ?? [];
        _availableOrders = data.map((json) => Order.fromJson(json)).toList();
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchMyDeliveries() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/orders?status=picked_up,in_transit');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? response['orders'] ?? [];
        _myDeliveries = data.map((json) => Order.fromJson(json)).toList();
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchDeliveryHistory({int page = 1, int limit = 20}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/orders?status=delivered&page=$page&limit=$limit');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? response['orders'] ?? [];
        if (page == 1) {
          _deliveryHistory = data.map((json) => Order.fromJson(json)).toList();
        } else {
          _deliveryHistory.addAll(data.map((json) => Order.fromJson(json)));
        }
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> acceptOrder(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/accept', {});
      if (response['success'] != false) {
        await fetchAvailableOrders();
        await fetchMyDeliveries();
        await fetchCourierStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to accept order';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> scanPickupQr(String orderId, String qrData, {String? pickupPhotoUrl}) async {
    try {
      final Map<String, dynamic> body = {
        'qrData': qrData,
      };
      if (pickupPhotoUrl != null) {
        body['pickupPhotoUrl'] = pickupPhotoUrl;
      }
      final response = await _apiService.post('/orders/$orderId/pickup', body);
      if (response['success'] != false) {
        await fetchMyDeliveries();
        await fetchCourierStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to scan pickup QR';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Upload a photo and scan pickup QR in one operation
  Future<bool> scanPickupQrWithPhoto(String orderId, String qrData, String photoPath) async {
    try {
      // First upload the photo
      final uploadResponse = await _apiService.post('/upload/image', {
        'folder': 'pickup-photos',
      });
      
      // If upload has a different mechanism, handle it here
      // For now, assume the photo URL is passed directly
      return await scanPickupQr(orderId, qrData, pickupPhotoUrl: photoPath);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> confirmDelivery(String orderId, {String? qrData, String? deliveryCode}) async {
    try {
      final response = await _apiService.post('/orders/$orderId/deliver', {
        if (qrData != null) 'qrData': qrData,
        if (deliveryCode != null) 'deliveryCode': deliveryCode,
      });
      if (response['success'] != false) {
        await fetchMyDeliveries();
        await fetchDeliveryHistory();
        await fetchCourierStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to confirm delivery';
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestWithdrawal(double amount, String method) async {
    try {
      final response = await _apiService.post('/withdrawals', {
        'amount': amount,
        'method': method,
      });
      if (response['success'] != false) {
        await fetchCourierStats();
        return true;
      }
      _error = response['error'] ?? 'Failed to request withdrawal';
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
    _stats = CourierStats();
    _availableOrders = [];
    _myDeliveries = [];
    _deliveryHistory = [];
    _error = null;
    notifyListeners();
  }
}
