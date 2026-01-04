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
          final response = await _apiService.get('/payments/wallet');
          if (response['success'] != false) {
            final data = response['data'] ?? response['wallet'] ?? response;
            _wallet = Wallet.fromJson(data);
          } else {
            _error = 'Failed to fetch wallet';
          }
        }catch (e) {
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
          final response = await _apiService.get('/withdrawals?page=$page&limit=$limit');
          if (response['success'] != false) {
            final List<dynamic> data = response['data'] ?? response['transactions'] ?? [];
            if (page == 1) {
              _transactions = data.map((json) => WalletTransaction.fromJson(json)).toList();
            } else {
              _transactions.addAll(data.map((json) => WalletTransaction.fromJson(json)));
            }
          } else {
            _error = 'Failed to fetch transactions';
          }
        }catch (e) {
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
          final response = await _apiService.post('/payments/topup', {
            'amount': amount,
            'paymentMethod': paymentMethod,
          });

          if (response['success'] != false) {
            await fetchWallet();
            await fetchTransactions();
            _isLoading = false;
            notifyListeners();
            return true;
          } else {
            _error = response['message'] ?? 'Failed to top up wallet';
          }
        }catch (e) {
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
                    final response = await _apiService.post('/withdrawals', {
                      'amount': amount,
                      'method': withdrawMethod,
                      'accountDetails': details,
                    });

          if (response['success'] != false) {
            await fetchWallet();
            await fetchTransactions();
            _isLoading = false;
            notifyListeners();
            return true;
          } else {
            _error = response['message'] ?? 'Failed to withdraw from wallet';
          }
        }catch (e) {
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
