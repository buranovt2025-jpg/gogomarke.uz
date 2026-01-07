import 'package:flutter/foundation.dart';

import '../models/dispute.dart';
import '../services/api_service.dart';

class DisputeProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Dispute> _disputes = [];
  Dispute? _selectedDispute;
  bool _isLoading = false;
  String? _error;

  List<Dispute> get disputes => _disputes;
  Dispute? get selectedDispute => _selectedDispute;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<Dispute> get openDisputes => _disputes.where((d) => d.status == 'open' || d.status == 'in_review').toList();
  List<Dispute> get closedDisputes => _disputes.where((d) => d.status == 'resolved' || d.status == 'closed').toList();

  Future<void> fetchDisputes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/disputes');
      if (response['success'] != false) {
        final List<dynamic> data = response['data'] ?? [];
        _disputes = data.map((json) => Dispute.fromJson(json)).toList();
      } else {
        _error = response['error'] ?? 'Failed to load disputes';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchDisputeById(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/disputes/$id');
      if (response['success'] != false) {
        _selectedDispute = Dispute.fromJson(response['data'] ?? response);
      } else {
        _error = response['error'] ?? 'Failed to load dispute';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createDispute({
    required String orderId,
    required String reason,
    required String description,
    List<String>? evidence,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/disputes', {
        'orderId': orderId,
        'reason': reason,
        'description': description,
        if (evidence != null) 'evidence': evidence,
      });

      if (response['success'] != false) {
        await fetchDisputes();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? 'Failed to create dispute';
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

  void clearData() {
    _disputes = [];
    _selectedDispute = null;
    _error = null;
    notifyListeners();
  }
}
