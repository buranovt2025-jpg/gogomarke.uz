import 'package:flutter/foundation.dart';

import '../models/return_request.dart';
import '../services/api_service.dart';

class ReturnProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<ReturnRequest> _returns = [];
  ReturnRequest? _currentReturn;
  bool _isLoading = false;
  String? _error;

  List<ReturnRequest> get returns => _returns;
  List<ReturnRequest> get pendingReturns => _returns.where((r) => r.isPending).toList();
  List<ReturnRequest> get processedReturns => _returns.where((r) => !r.isPending).toList();
  ReturnRequest? get currentReturn => _currentReturn;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchReturns() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

        try {
          final response = await _apiService.get('/returns');
          if (response['success'] != false) {
            final List<dynamic> data = response['data'] ?? response['returns'] ?? [];
            _returns = data.map((json) => ReturnRequest.fromJson(json)).toList();
            _returns.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          } else {
            _error = 'Failed to fetch returns';
          }
        }catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchReturnDetails(String returnId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

        try {
          final response = await _apiService.get('/returns/$returnId');
          if (response['success'] != false) {
            final data = response['data'] ?? response['return'] ?? response;
            _currentReturn = ReturnRequest.fromJson(data);
          } else {
            _error = 'Failed to fetch return details';
          }
        }catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createReturn({
    required String orderId,
    required String productId,
    required String reason,
    required String description,
    List<String>? images,
    String refundMethod = 'original',
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

        try {
          final response = await _apiService.post('/returns', {
            'orderId': orderId,
            'productId': productId,
            'reason': reason,
            'description': description,
            'images': images ?? [],
            'refundMethod': refundMethod,
          });

          if (response['success'] != false) {
            final data = response['data'] ?? response['return'] ?? response;
            final newReturn = ReturnRequest.fromJson(data);
            _returns.insert(0, newReturn);
            _isLoading = false;
            notifyListeners();
            return true;
          } else {
            _error = response['message'] ?? 'Failed to create return request';
          }
        }catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> cancelReturn(String returnId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

        try {
          final response = await _apiService.put('/returns/$returnId/cancel', {});
          if (response['success'] != false) {
            final index = _returns.indexWhere((r) => r.id == returnId);
            if (index != -1) {
              _returns[index] = _returns[index].copyWith(status: 'cancelled');
            }
            if (_currentReturn?.id == returnId) {
              _currentReturn = _currentReturn?.copyWith(status: 'cancelled');
            }
            _isLoading = false;
            notifyListeners();
            return true;
          } else {
            _error = response['message'] ?? 'Failed to cancel return request';
          }
        }catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void setCurrentReturn(ReturnRequest? returnRequest) {
    _currentReturn = returnRequest;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearReturns() {
    _returns = [];
    _currentReturn = null;
    notifyListeners();
  }
}
