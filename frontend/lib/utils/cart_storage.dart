import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Local storage for guest cart (localStorage equivalent)
class CartStorage {
  static const String _cartKey = 'guest_cart';
  
  /// Cart item structure
  static Map<String, dynamic> createCartItem({
    required int productId,
    required int quantity,
    required String name,
    required double price,
    String? imageUrl,
  }) {
    return {
      'productId': productId,
      'quantity': quantity,
      'name': name,
      'price': price,
      'imageUrl': imageUrl,
      'addedAt': DateTime.now().toIso8601String(),
    };
  }

  /// Get all cart items from local storage
  static Future<List<Map<String, dynamic>>> getCartItems() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = prefs.getString(_cartKey);
      
      if (cartJson == null || cartJson.isEmpty) {
        return [];
      }
      
      final List<dynamic> decoded = json.decode(cartJson);
      return decoded.cast<Map<String, dynamic>>();
    } catch (e) {
      print('Error getting cart items: $e');
      return [];
    }
  }

  /// Add item to cart
  static Future<void> addItem({
    required int productId,
    required int quantity,
    required String name,
    required double price,
    String? imageUrl,
  }) async {
    try {
      final items = await getCartItems();
      
      // Check if item already exists
      final existingIndex = items.indexWhere(
        (item) => item['productId'] == productId,
      );
      
      if (existingIndex >= 0) {
        // Update quantity
        items[existingIndex]['quantity'] = 
            (items[existingIndex]['quantity'] as int) + quantity;
      } else {
        // Add new item
        items.add(createCartItem(
          productId: productId,
          quantity: quantity,
          name: name,
          price: price,
          imageUrl: imageUrl,
        ));
      }
      
      await _saveCart(items);
    } catch (e) {
      print('Error adding item to cart: $e');
    }
  }

  /// Update item quantity
  static Future<void> updateQuantity(int productId, int quantity) async {
    try {
      final items = await getCartItems();
      
      final index = items.indexWhere(
        (item) => item['productId'] == productId,
      );
      
      if (index >= 0) {
        if (quantity <= 0) {
          items.removeAt(index);
        } else {
          items[index]['quantity'] = quantity;
        }
        await _saveCart(items);
      }
    } catch (e) {
      print('Error updating quantity: $e');
    }
  }

  /// Remove item from cart
  static Future<void> removeItem(int productId) async {
    try {
      final items = await getCartItems();
      items.removeWhere((item) => item['productId'] == productId);
      await _saveCart(items);
    } catch (e) {
      print('Error removing item: $e');
    }
  }

  /// Clear all cart items
  static Future<void> clearCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cartKey);
    } catch (e) {
      print('Error clearing cart: $e');
    }
  }

  /// Get cart total
  static Future<double> getTotal() async {
    final items = await getCartItems();
    double total = 0;
    
    for (var item in items) {
      total += (item['price'] as num) * (item['quantity'] as int);
    }
    
    return total;
  }

  /// Get cart items count
  static Future<int> getItemsCount() async {
    final items = await getCartItems();
    int count = 0;
    
    for (var item in items) {
      count += item['quantity'] as int;
    }
    
    return count;
  }

  /// Get items for merge (after login)
  static Future<List<Map<String, dynamic>>> getItemsForMerge() async {
    final items = await getCartItems();
    return items.map((item) => {
      'productId': item['productId'],
      'quantity': item['quantity'],
    }).toList();
  }

  /// Save cart to SharedPreferences
  static Future<void> _saveCart(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cartKey, json.encode(items));
  }

  /// Check if cart has items
  static Future<bool> hasItems() async {
    final items = await getCartItems();
    return items.isNotEmpty;
  }
}
