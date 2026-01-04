import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';

import '../models/address.dart';
import '../services/api_service.dart';

class AddressProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Address> _addresses = [];
  Address? _selectedAddress;
  Position? _currentPosition;
  bool _isLoading = false;
  String? _error;

  List<Address> get addresses => _addresses;
  Address? get selectedAddress => _selectedAddress;
  Address? get defaultAddress => _addresses.firstWhere(
    (a) => a.isDefault,
    orElse: () => _addresses.isNotEmpty ? _addresses.first : Address(
      id: '',
      userId: '',
      title: 'No address',
      fullAddress: 'Add an address',
    ),
  );
  Position? get currentPosition => _currentPosition;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasAddresses => _addresses.isNotEmpty;

  Future<void> fetchAddresses() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/addresses');
      if (response != null && response['addresses'] != null) {
        _addresses = (response['addresses'] as List)
            .map((json) => Address.fromJson(json))
            .toList();
        
        if (_selectedAddress == null && _addresses.isNotEmpty) {
          _selectedAddress = defaultAddress;
        }
      }
      _error = null;
    } catch (e) {
      _error = 'Failed to load addresses';
      await _loadFromCache();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('cached_addresses');
      if (cached != null) {
        final List<dynamic> decoded = json.decode(cached);
        _addresses = decoded.map((json) => Address.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error loading addresses from cache: $e');
    }
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = json.encode(_addresses.map((a) => a.toJson()).toList());
      await prefs.setString('cached_addresses', encoded);
    } catch (e) {
      debugPrint('Error saving addresses to cache: $e');
    }
  }

  Future<bool> addAddress(Address address) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/addresses', address.toJson());
      if (response != null && response['address'] != null) {
        final newAddress = Address.fromJson(response['address']);
        _addresses.add(newAddress);
        if (newAddress.isDefault || _addresses.length == 1) {
          _selectedAddress = newAddress;
        }
        await _saveToCache();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Failed to add address';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateAddress(Address address) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.put('/addresses/${address.id}', address.toJson());
      if (response != null) {
        final index = _addresses.indexWhere((a) => a.id == address.id);
        if (index != -1) {
          _addresses[index] = address;
          if (_selectedAddress?.id == address.id) {
            _selectedAddress = address;
          }
        }
        await _saveToCache();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Failed to update address';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> deleteAddress(String addressId) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.delete('/addresses/$addressId');
      _addresses.removeWhere((a) => a.id == addressId);
      if (_selectedAddress?.id == addressId) {
        _selectedAddress = _addresses.isNotEmpty ? defaultAddress : null;
      }
      await _saveToCache();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete address';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> setDefaultAddress(String addressId) async {
    try {
      await _apiService.put('/addresses/$addressId/default', {});
      for (int i = 0; i < _addresses.length; i++) {
        _addresses[i] = _addresses[i].copyWith(
          isDefault: _addresses[i].id == addressId,
        );
      }
      await _saveToCache();
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to set default address';
      notifyListeners();
      return false;
    }
  }

  void selectAddress(Address address) {
    _selectedAddress = address;
    notifyListeners();
  }

  Future<bool> getCurrentLocation() async {
    _isLoading = true;
    notifyListeners();

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _error = 'Location services are disabled';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _error = 'Location permission denied';
          _isLoading = false;
          notifyListeners();
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _error = 'Location permissions are permanently denied';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to get current location';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
