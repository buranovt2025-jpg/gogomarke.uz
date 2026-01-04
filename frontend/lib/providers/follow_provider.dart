import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/user.dart';
import '../services/api_service.dart';

class FollowProvider with ChangeNotifier {
  final Set<String> _followedSellerIds = {};
  final Map<String, User> _followedSellers = {};
  bool _isLoading = false;
  static const String _followKey = 'followed_sellers';
  
  final ApiService _apiService = ApiService();

  Set<String> get followedSellerIds => _followedSellerIds;
  List<User> get followedSellers => _followedSellers.values.toList();
  bool get isLoading => _isLoading;
  int get followingCount => _followedSellerIds.length;

  FollowProvider() {
    _loadFollowedSellers();
  }

  Future<void> _loadFollowedSellers() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final followedJson = prefs.getString(_followKey);

      if (followedJson != null && followedJson.isNotEmpty) {
        final Map<String, dynamic> data = jsonDecode(followedJson) as Map<String, dynamic>;
        
        final List<dynamic> ids = data['ids'] as List<dynamic>? ?? [];
        _followedSellerIds.addAll(ids.cast<String>());
        
        final List<dynamic> sellers = data['sellers'] as List<dynamic>? ?? [];
        for (final sellerJson in sellers) {
          final seller = User.fromJson(sellerJson as Map<String, dynamic>);
          _followedSellers[seller.id] = seller;
        }
      }
    } catch (e) {
      debugPrint('Error loading followed sellers: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _saveFollowedSellers() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = {
        'ids': _followedSellerIds.toList(),
        'sellers': _followedSellers.values.map((s) => s.toJson()).toList(),
      };
      await prefs.setString(_followKey, jsonEncode(data));
    } catch (e) {
      debugPrint('Error saving followed sellers: $e');
    }
  }

  bool isFollowing(String sellerId) {
    return _followedSellerIds.contains(sellerId);
  }

  Future<void> followSeller(User seller) async {
    if (_followedSellerIds.contains(seller.id)) return;

    _followedSellerIds.add(seller.id);
    _followedSellers[seller.id] = seller;
    notifyListeners();

    try {
      await _apiService.post('/users/${seller.id}/follow', {});
    } catch (e) {
      debugPrint('Error following seller on server: $e');
    }

    await _saveFollowedSellers();
  }

  Future<void> unfollowSeller(String sellerId) async {
    if (!_followedSellerIds.contains(sellerId)) return;

    _followedSellerIds.remove(sellerId);
    _followedSellers.remove(sellerId);
    notifyListeners();

    try {
      await _apiService.delete('/users/$sellerId/follow');
    } catch (e) {
      debugPrint('Error unfollowing seller on server: $e');
    }

    await _saveFollowedSellers();
  }

  Future<void> toggleFollow(User seller) async {
    if (isFollowing(seller.id)) {
      await unfollowSeller(seller.id);
    } else {
      await followSeller(seller);
    }
  }

  void clear() {
    _followedSellerIds.clear();
    _followedSellers.clear();
    _saveFollowedSellers();
    notifyListeners();
  }
}
