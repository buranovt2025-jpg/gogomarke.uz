import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../utils/cart_storage.dart';

/// API service for cart operations
class CartApi {
  static String get _baseUrl => ApiConfig.baseUrl;

  /// Merge guest cart with user cart after login
  static Future<Map<String, dynamic>> mergeCart(String token) async {
    try {
      // Get items from local storage
      final localItems = await CartStorage.getItemsForMerge();
      
      if (localItems.isEmpty) {
        return {'success': true, 'message': 'No items to merge'};
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/cart/merge'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'items': localItems,
        }),
      );

      if (response.statusCode == 200) {
        // Clear local cart after successful merge
        await CartStorage.clearCart();
        return json.decode(response.body);
      } else {
        final errorBody = json.decode(response.body);
        return {
          'success': false,
          'message': errorBody['message'] ?? 'Failed to merge cart',
        };
      }
    } catch (e) {
      print('Error merging cart: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  /// Get user cart from server
  static Future<List<dynamic>> getCart(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/cart'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['items'] ?? [];
      } else {
        return [];
      }
    } catch (e) {
      print('Error getting cart: $e');
      return [];
    }
  }

  /// Add item to cart (server-side for authenticated users)
  static Future<Map<String, dynamic>> addToCart({
    required String token,
    required int productId,
    required int quantity,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/cart'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'productId': productId,
          'quantity': quantity,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final errorBody = json.decode(response.body);
        return {
          'success': false,
          'message': errorBody['message'] ?? 'Failed to add to cart',
        };
      }
    } catch (e) {
      print('Error adding to cart: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  /// Update cart item quantity
  static Future<Map<String, dynamic>> updateCartItem({
    required String token,
    required int itemId,
    required int quantity,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/cart/$itemId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'quantity': quantity,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorBody = json.decode(response.body);
        return {
          'success': false,
          'message': errorBody['message'] ?? 'Failed to update cart',
        };
      }
    } catch (e) {
      print('Error updating cart: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  /// Remove item from cart
  static Future<Map<String, dynamic>> removeFromCart({
    required String token,
    required int itemId,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/cart/$itemId'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        final errorBody = json.decode(response.body);
        return {
          'success': false,
          'message': errorBody['message'] ?? 'Failed to remove from cart',
        };
      }
    } catch (e) {
      print('Error removing from cart: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  /// Clear cart
  static Future<Map<String, dynamic>> clearCart(String token) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/cart'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        final errorBody = json.decode(response.body);
        return {
          'success': false,
          'message': errorBody['message'] ?? 'Failed to clear cart',
        };
      }
    } catch (e) {
      print('Error clearing cart: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }
}
