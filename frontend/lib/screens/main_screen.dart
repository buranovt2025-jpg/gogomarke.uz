import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../models/user.dart';
import 'home/home_screen.dart';
import 'video/video_feed_screen.dart';
import 'cart/cart_screen.dart';
import 'order/orders_screen.dart';
import 'profile/profile_screen.dart';
import 'seller/seller_dashboard_screen.dart';
import 'seller/my_products_screen.dart';
import 'seller/seller_orders_screen.dart';
import 'shop/shop_screen.dart';
import 'courier/courier_dashboard_screen.dart';
import 'courier/courier_orders_screen.dart';
import 'courier/courier_earnings_screen.dart';
import 'admin/admin_dashboard_screen.dart';
import 'admin/admin_users_screen.dart';
import 'admin/admin_orders_screen.dart';
import 'admin/admin_finance_screen.dart';
import 'admin/admin_settings_screen.dart';
import 'wishlist/wishlist_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    final screens = _getScreensForRole(user?.role, _currentIndex);
    final navItems = _getNavItemsForRole(user?.role);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navBackgroundColor = isDark ? AppColors.grey900 : AppColors.white;
    final shadowColor = isDark ? AppColors.black.withOpacity(0.3) : AppColors.black.withOpacity(0.1);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: navBackgroundColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
          boxShadow: [
            BoxShadow(
              color: shadowColor,
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => _handleNavTap(index, user?.role),
            backgroundColor: navBackgroundColor,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: isDark ? AppColors.grey400 : AppColors.grey500,
            type: BottomNavigationBarType.fixed,
            showSelectedLabels: false,
            showUnselectedLabels: false,
            elevation: 0,
            items: navItems,
          ),
        ),
      ),
    );
  }

  List<Widget> _getScreensForRole(UserRole? role, int currentIndex) {
    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.user?.id?.toString() ?? '';
    
    switch (role) {
      case UserRole.seller:
        // Seller: Dashboard, Products, Orders, Catalog (Home), My Store
        return [
          const SellerDashboardScreen(),
          const MyProductsScreen(),
          const SellerOrdersScreen(),
          const HomeScreen(), // Catalog - browse all products
          ShopScreen(sellerId: userId), // My Store
        ];
      case UserRole.courier:
        // Courier: Deliveries, Orders, Earnings, Profile
        return const [
          CourierDashboardScreen(),
          CourierOrdersScreen(),
          CourierEarningsScreen(),
          ProfileScreen(),
        ];
      case UserRole.admin:
        // Admin: Dashboard, Users, Orders, Finance, Settings
        return const [
          AdminDashboardScreen(),
          AdminUsersScreen(),
          AdminOrdersScreen(),
          AdminFinanceScreen(),
          AdminSettingsScreen(),
        ];
      default:
        // Buyer/Guest: Home, Reels, Cart, Wishlist, Profile
        return [
          const HomeScreen(),
          VideoFeedScreen(isActive: currentIndex == 1),
          const CartScreen(),
          const WishlistScreen(),
          const ProfileScreen(),
        ];
    }
  }

  List<BottomNavigationBarItem> _getNavItemsForRole(UserRole? role) {
    switch (role) {
      case UserRole.seller:
        // Seller: Dashboard, Products, Orders, Catalog, My Store
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Дашборд',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Товары',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Заказы',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store_outlined),
            activeIcon: Icon(Icons.store),
            label: 'Каталог',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront),
            label: 'Витрина',
          ),
        ];
      case UserRole.courier:
        // Courier: Deliveries, Orders, Earnings, Profile
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            activeIcon: Icon(Icons.local_shipping),
            label: 'Доставки',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Заказы',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.wallet_outlined),
            activeIcon: Icon(Icons.wallet),
            label: 'Выплаты',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Профиль',
          ),
        ];
      case UserRole.admin:
        // Admin: Dashboard, Users, Orders, Finance, Settings
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Дашборд',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Юзеры',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Заказы',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.attach_money_outlined),
            activeIcon: Icon(Icons.attach_money),
            label: 'Финансы',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Настройки',
          ),
        ];
      default:
        // Buyer/Guest: Home, Reels, Cart, Wishlist, Profile
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Главная',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.play_circle_outline),
            activeIcon: Icon(Icons.play_circle),
            label: 'Рилсы',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_outlined),
            activeIcon: Icon(Icons.shopping_bag),
            label: 'Корзина',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_outline),
            activeIcon: Icon(Icons.favorite),
            label: 'Избранное',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Профиль',
          ),
        ];
    }
  }

  /// Handle tap on protected nav items for guests
  void _handleNavTap(int index, UserRole? role) {
    // For guests, check if they're trying to access protected items
    if (role == null) {
      // Cart (index 2) and Wishlist (index 3) show login prompt
      if (index == 2 || index == 3) {
        _showLoginPrompt();
        return;
      }
    }
    
    setState(() {
      _currentIndex = index;
    });
  }

  void _showLoginPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Требуется авторизация'),
        content: const Text('Для доступа к этой функции необходимо войти в аккаунт.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/login');
            },
            child: const Text('Войти'),
          ),
        ],
      ),
    );
  }
}
