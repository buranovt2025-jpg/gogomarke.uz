import 'package:flutter/material.dart';
import '../models/user.dart';

/// Middleware for route protection based on user roles
class RouteGuard {
  /// Check if user has access to a route based on their role
  static bool canAccess(User? user, List<String> allowedRoles) {
    if (user == null) return false;
    return allowedRoles.contains(user.role);
  }

  /// Check if user is authenticated
  static bool isAuthenticated(User? user) {
    return user != null;
  }

  /// Check if user is a guest (not authenticated)
  static bool isGuest(User? user) {
    return user == null;
  }

  /// Check if user is admin
  static bool isAdmin(User? user) {
    return user?.role == 'admin';
  }

  /// Check if user is seller
  static bool isSeller(User? user) {
    return user?.role == 'seller';
  }

  /// Check if user is buyer
  static bool isBuyer(User? user) {
    return user?.role == 'buyer';
  }

  /// Check if user is courier
  static bool isCourier(User? user) {
    return user?.role == 'courier';
  }

  /// Get home route based on user role
  static String getHomeRoute(User? user) {
    if (user == null) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'seller':
        return '/seller';
      case 'courier':
        return '/courier';
      case 'buyer':
      default:
        return '/';
    }
  }

  /// Get navigation items based on user role
  static List<BottomNavigationBarItem> getNavigationItems(User? user) {
    if (user == null) {
      // Guest navigation
      return [
        const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Главная'),
        const BottomNavigationBarItem(icon: Icon(Icons.play_circle), label: 'Рилсы'),
        const BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: 'Корзина'),
        const BottomNavigationBarItem(icon: Icon(Icons.favorite), label: 'Избранное'),
        const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Войти'),
      ];
    }

    switch (user.role) {
      case 'admin':
        return [
          const BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Дашборд'),
          const BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Юзеры'),
          const BottomNavigationBarItem(icon: Icon(Icons.shopping_bag), label: 'Заказы'),
          const BottomNavigationBarItem(icon: Icon(Icons.payments), label: 'Финансы'),
          const BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Настройки'),
        ];
      case 'seller':
        return [
          const BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Дашборд'),
          const BottomNavigationBarItem(icon: Icon(Icons.store), label: 'Товары'),
          const BottomNavigationBarItem(icon: Icon(Icons.shopping_bag), label: 'Заказы'),
          const BottomNavigationBarItem(icon: Icon(Icons.storefront), label: 'Каталог'),
          const BottomNavigationBarItem(icon: Icon(Icons.account_circle), label: 'Витрина'),
        ];
      case 'courier':
        return [
          const BottomNavigationBarItem(icon: Icon(Icons.local_shipping), label: 'Доставки'),
          const BottomNavigationBarItem(icon: Icon(Icons.history), label: 'История'),
          const BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Карта'),
          const BottomNavigationBarItem(icon: Icon(Icons.wallet), label: 'Выплаты'),
          const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Профиль'),
        ];
      case 'buyer':
      default:
        return [
          const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Главная'),
          const BottomNavigationBarItem(icon: Icon(Icons.play_circle), label: 'Рилсы'),
          const BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: 'Корзина'),
          const BottomNavigationBarItem(icon: Icon(Icons.favorite), label: 'Избранное'),
          const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Профиль'),
        ];
    }
  }

  /// Route protection widget
  static Widget protectedRoute({
    required Widget child,
    required User? user,
    required List<String> allowedRoles,
    Widget? fallback,
    VoidCallback? onUnauthorized,
  }) {
    if (canAccess(user, allowedRoles)) {
      return child;
    }
    
    if (onUnauthorized != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        onUnauthorized();
      });
    }
    
    return fallback ?? const Scaffold(
      body: Center(
        child: Text('Доступ запрещен'),
      ),
    );
  }
}
