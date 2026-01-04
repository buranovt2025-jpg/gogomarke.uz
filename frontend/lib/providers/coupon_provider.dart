import 'package:flutter/foundation.dart';

import '../models/coupon.dart';
import '../services/api_service.dart';

class CouponProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  Coupon? _appliedCoupon;
  bool _isLoading = false;
  String? _error;

  Coupon? get appliedCoupon => _appliedCoupon;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasCoupon => _appliedCoupon != null;

  Future<bool> applyCoupon(String code, double orderAmount) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/coupons/validate', {
        'code': code,
        'order_amount': orderAmount,
      });

      if (response != null && response['coupon'] != null) {
        _appliedCoupon = Coupon.fromJson(response['coupon']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response?['message'] ?? 'Invalid coupon code';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to validate coupon';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void removeCoupon() {
    _appliedCoupon = null;
    _error = null;
    notifyListeners();
  }

  double calculateDiscount(double orderAmount) {
    if (_appliedCoupon == null) return 0;
    return _appliedCoupon!.calculateDiscount(orderAmount);
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
