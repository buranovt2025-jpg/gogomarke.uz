import 'package:flutter/foundation.dart';

import '../models/product.dart';

class CompareProvider extends ChangeNotifier {
  final List<Product> _compareList = [];
  static const int maxCompareItems = 4;

  List<Product> get compareList => List.unmodifiable(_compareList);
  int get compareCount => _compareList.length;
  bool get isEmpty => _compareList.isEmpty;
  bool get isFull => _compareList.length >= maxCompareItems;

  bool isInCompare(String productId) {
    return _compareList.any((p) => p.id == productId);
  }

  bool addToCompare(Product product) {
    if (_compareList.length >= maxCompareItems) {
      return false;
    }
    
    if (isInCompare(product.id)) {
      return true;
    }

    _compareList.add(product);
    notifyListeners();
    return true;
  }

  void removeFromCompare(String productId) {
    _compareList.removeWhere((p) => p.id == productId);
    notifyListeners();
  }

  void clearCompare() {
    _compareList.clear();
    notifyListeners();
  }

  void toggleCompare(Product product) {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  }

  List<String> getComparisonAttributes() {
    return [
      'Price',
      'Rating',
      'Reviews',
      'Stock',
      'Category',
      'Seller',
    ];
  }

  Map<String, List<String>> getComparisonData() {
    final Map<String, List<String>> data = {};
    
    data['Price'] = _compareList.map((p) => '${p.price.toStringAsFixed(0)} UZS').toList();
    data['Rating'] = _compareList.map((p) => p.rating > 0 ? p.rating.toStringAsFixed(1) : '-').toList();
    data['Reviews'] = _compareList.map((p) => p.reviewCount.toString()).toList();
    data['Stock'] = _compareList.map((p) => p.stock > 0 ? 'In Stock (${p.stock})' : 'Out of Stock').toList();
    data['Category'] = _compareList.map((p) => p.category ?? '-').toList();
    data['Seller'] = _compareList.map((p) => p.sellerName ?? '-').toList();
    
    return data;
  }
}
