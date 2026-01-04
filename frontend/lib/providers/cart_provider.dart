import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  bool _isLoading = false;
  static const String _cartKey = 'cart_items';

  List<CartItem> get items => _items;
  bool get isLoading => _isLoading;
  bool get isEmpty => _items.isEmpty;
  int get itemCount => _items.length;
  
  int get totalQuantity {
    return _items.fold(0, (sum, item) => sum + item.quantity);
  }

  double get subtotal {
    return _items.fold(0.0, (sum, item) => sum + item.totalPrice);
  }

  double get deliveryFee => _items.isEmpty ? 0 : 15000;

  double get total => subtotal + deliveryFee;

  CartProvider() {
    _loadCart();
  }

  Future<void> _loadCart() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = prefs.getString(_cartKey);
      
      if (cartJson != null && cartJson.isNotEmpty) {
        _items = CartItem.decodeCartItems(cartJson);
      }
    } catch (e) {
      debugPrint('Error loading cart: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = CartItem.encodeCartItems(_items);
      await prefs.setString(_cartKey, cartJson);
    } catch (e) {
      debugPrint('Error saving cart: $e');
    }
  }

  void addItem(Product product, {int quantity = 1, String? size, String? color}) {
    final existingIndex = _items.indexWhere((item) =>
        item.product.id == product.id &&
        item.selectedSize == size &&
        item.selectedColor == color);

    if (existingIndex >= 0) {
      final existingItem = _items[existingIndex];
      _items[existingIndex] = existingItem.copyWith(
        quantity: existingItem.quantity + quantity,
      );
    } else {
      final cartItemId = '${product.id}_${size ?? ''}_${color ?? ''}_${DateTime.now().millisecondsSinceEpoch}';
      _items.add(CartItem(
        id: cartItemId,
        product: product,
        quantity: quantity,
        selectedSize: size,
        selectedColor: color,
      ));
    }

    _saveCart();
    notifyListeners();
  }

  void removeItem(String cartItemId) {
    _items.removeWhere((item) => item.id == cartItemId);
    _saveCart();
    notifyListeners();
  }

  void updateQuantity(String cartItemId, int quantity) {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    final index = _items.indexWhere((item) => item.id == cartItemId);
    if (index >= 0) {
      _items[index] = _items[index].copyWith(quantity: quantity);
      _saveCart();
      notifyListeners();
    }
  }

  void incrementQuantity(String cartItemId) {
    final index = _items.indexWhere((item) => item.id == cartItemId);
    if (index >= 0) {
      final item = _items[index];
      if (item.quantity < item.product.stock) {
        _items[index] = item.copyWith(quantity: item.quantity + 1);
        _saveCart();
        notifyListeners();
      }
    }
  }

  void decrementQuantity(String cartItemId) {
    final index = _items.indexWhere((item) => item.id == cartItemId);
    if (index >= 0) {
      final item = _items[index];
      if (item.quantity > 1) {
        _items[index] = item.copyWith(quantity: item.quantity - 1);
        _saveCart();
        notifyListeners();
      } else {
        removeItem(cartItemId);
      }
    }
  }

  void clear() {
    _items = [];
    _saveCart();
    notifyListeners();
  }

  bool isInCart(String productId) {
    return _items.any((item) => item.product.id == productId);
  }

  int getProductQuantity(String productId) {
    return _items
        .where((item) => item.product.id == productId)
        .fold(0, (sum, item) => sum + item.quantity);
  }
}
