import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/product.dart';

class WishlistProvider with ChangeNotifier {
  List<Product> _items = [];
  bool _isLoading = false;
  static const String _wishlistKey = 'wishlist_items';

  List<Product> get items => _items;
  bool get isLoading => _isLoading;
  bool get isEmpty => _items.isEmpty;
  int get itemCount => _items.length;

  WishlistProvider() {
    _loadWishlist();
  }

  Future<void> _loadWishlist() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final wishlistJson = prefs.getString(_wishlistKey);

      if (wishlistJson != null && wishlistJson.isNotEmpty) {
        final List<dynamic> jsonList = jsonDecode(wishlistJson) as List<dynamic>;
        _items = jsonList.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      debugPrint('Error loading wishlist: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _saveWishlist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final wishlistJson = jsonEncode(_items.map((item) => item.toJson()).toList());
      await prefs.setString(_wishlistKey, wishlistJson);
    } catch (e) {
      debugPrint('Error saving wishlist: $e');
    }
  }

  void addItem(Product product) {
    if (!isInWishlist(product.id)) {
      _items.add(product);
      _saveWishlist();
      notifyListeners();
    }
  }

  void removeItem(String productId) {
    _items.removeWhere((item) => item.id == productId);
    _saveWishlist();
    notifyListeners();
  }

  void toggleItem(Product product) {
    if (isInWishlist(product.id)) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  }

  bool isInWishlist(String productId) {
    return _items.any((item) => item.id == productId);
  }

  void clear() {
    _items = [];
    _saveWishlist();
    notifyListeners();
  }
}
