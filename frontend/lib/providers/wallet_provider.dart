import 'package:flutter/foundation.dart';

import '../models/wallet.dart';
import '../services/api_service.dart';

class WalletProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  Wallet? _wallet;
  List<WalletTransaction> _transactions = [];
  bool _isLoading = false;
  String? _error;

  Wallet? get wallet => _wallet;
  List<WalletTransaction> get transactions => _transactions;
  double get balance => _wallet?.balance ?? 0;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchWallet() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/wallet');
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data['wallet'] ?? response.data;
        _wallet = Wallet.fromJson(data);
      } else {
        _error = 'Failed to fetch wallet';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchTransactions({int page = 1, int limit = 20}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/wallet/transactions?page=$page&limit=$limit');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data['transactions'] ?? response.data ?? [];
        if (page == 1) {
          _transactions = data.map((json) => WalletTransaction.fromJson(json)).toList();
        } else {
          _transactions.addAll(data.map((json) => WalletTransaction.fromJson(json)));
        }
      } else {
        _error = 'Failed to fetch transactions';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> topUp(double amount, String paymentMethod) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/wallet/topup', data: {
        'amount': amount,
        'paymentMethod': paymentMethod,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchWallet();
        await fetchTransactions();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'] ?? 'Failed to top up wallet';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> withdraw(double amount, String withdrawMethod, Map<String, dynamic>? details) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/wallet/withdraw', data: {
        'amount': amount,
        'withdrawMethod': withdrawMethod,
        'details': details,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchWallet();
        await fetchTransactions();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'] ?? 'Failed to withdraw from wallet';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearWallet() {
    _wallet = null;
    _transactions = [];
    notifyListeners();
  }
}
