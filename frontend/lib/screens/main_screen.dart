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
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
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
    switch (role) {
      case UserRole.seller:
        return [
          const HomeScreen(),
          VideoFeedScreen(isActive: currentIndex == 1),
          const OrdersScreen(),
          const ProfileScreen(),
        ];
      case UserRole.courier:
        return const [
          OrdersScreen(),
          ProfileScreen(),
        ];
      case UserRole.admin:
        return const [
          HomeScreen(),
          OrdersScreen(),
          ProfileScreen(),
        ];
      default:
        return [
          const HomeScreen(),
          VideoFeedScreen(isActive: currentIndex == 1),
          const CartScreen(),
          const OrdersScreen(),
          const ProfileScreen(),
        ];
    }
  }

  List<BottomNavigationBarItem> _getNavItemsForRole(UserRole? role) {
    switch (role) {
      case UserRole.seller:
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.video_library_outlined),
            activeIcon: Icon(Icons.video_library),
            label: 'Videos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
      case UserRole.courier:
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            activeIcon: Icon(Icons.local_shipping),
            label: 'Deliveries',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
      case UserRole.admin:
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
      default:
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.play_circle_outline),
            activeIcon: Icon(Icons.play_circle),
            label: 'Reels',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_outlined),
            activeIcon: Icon(Icons.shopping_bag),
            label: 'Cart',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
    }
  }
}
