import 'package:flutter/material.dart';

import '../screens/splash_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/main_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/video/video_feed_screen.dart';
import '../screens/product/product_detail_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/order/orders_screen.dart';
import '../screens/order/order_detail_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/profile/addresses_screen.dart';
import '../screens/profile/settings_screen.dart';
import '../screens/seller/seller_dashboard_screen.dart';
import '../screens/seller/add_video_screen.dart';
import '../screens/seller/my_products_screen.dart';
import '../screens/seller/add_product_screen.dart';
import '../screens/seller/seller_orders_screen.dart';
import '../screens/courier/courier_dashboard_screen.dart';
import '../screens/courier/available_orders_screen.dart';
import '../screens/courier/courier_orders_screen.dart';
import '../screens/courier/courier_earnings_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/admin/admin_users_screen.dart';
import '../screens/admin/admin_orders_screen.dart';
import '../screens/admin/admin_products_screen.dart';
import '../screens/admin/admin_finance_screen.dart';
import '../screens/admin/admin_settings_screen.dart';
import '../screens/qr/qr_scanner_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/wishlist/wishlist_screen.dart';
import '../screens/following/following_feed_screen.dart';
import '../screens/chat/chat_list_screen.dart';
import '../screens/chat/chat_screen.dart';
import '../screens/notifications/notification_screen.dart';
import '../screens/history/view_history_screen.dart';
import '../screens/support/support_screen.dart';
import '../screens/support/ticket_detail_screen.dart';
import '../screens/returns/returns_screen.dart';
import '../screens/returns/return_detail_screen.dart';
import '../screens/wallet/wallet_screen.dart';
import '../screens/shop/shop_screen.dart';
import '../screens/compare/compare_screen.dart';
import '../screens/about/about_screen.dart';
import '../screens/disputes/disputes_screen.dart';
import '../models/user.dart';
import '../middleware/route_guard.dart';

class AppRoutes {
  // Auth routes
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String otp = '/otp';
  
  // Main routes
  static const String main = '/main';
  static const String home = '/home';
  static const String videoFeed = '/video-feed';
  static const String productDetail = '/product/:id';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orders = '/orders';
  static const String orderDetail = '/order/:id';
  
  // Profile routes
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String addresses = '/profile/addresses';
  static const String appSettings = '/settings';
  
  // Seller routes
  static const String sellerDashboard = '/seller/dashboard';
  static const String sellerProducts = '/seller/products';
  static const String sellerAddProduct = '/seller/add-product';
  static const String sellerAddVideo = '/seller/add-video';
  static const String sellerOrders = '/seller/orders';
  static const String sellerStore = '/seller/store';
  
  // Courier routes
  static const String courierDashboard = '/courier/dashboard';
  static const String courierAvailableOrders = '/courier/available-orders';
  static const String courierOrders = '/courier/orders';
  static const String courierEarnings = '/courier/earnings';
  
  // Admin routes
  static const String adminDashboard = '/admin/dashboard';
  static const String adminUsers = '/admin/users';
  static const String adminOrders = '/admin/orders';
  static const String adminProducts = '/admin/products';
  static const String adminFinance = '/admin/finance';
  static const String adminSettings = '/admin/settings';
  
  // Other routes
  static const String qrScanner = '/qr-scanner';
  static const String search = '/search';
  static const String wishlist = '/wishlist';
  static const String followingFeed = '/following';
  static const String chatList = '/chats';
  static const String chat = '/chat/:id';
  static const String notifications = '/notifications';
  static const String viewHistory = '/history';
  static const String support = '/support';
  static const String ticketDetail = '/support/:id';
  static const String returns = '/returns';
  static const String returnDetail = '/returns/:id';
  static const String wallet = '/wallet';
  static const String shop = '/shop/:id';
  static const String compare = '/compare';
  static const String about = '/about';
  static const String disputes = '/disputes';

  /// Routes that require authentication
  static final List<String> protectedRoutes = [
    checkout,
    orders,
    editProfile,
    addresses,
    wishlist,
    returns,
    wallet,
    disputes,
    sellerDashboard,
    sellerProducts,
    sellerAddProduct,
    sellerAddVideo,
    sellerOrders,
    courierDashboard,
    courierAvailableOrders,
    courierOrders,
    courierEarnings,
    adminDashboard,
    adminUsers,
    adminOrders,
    adminProducts,
    adminFinance,
    adminSettings,
  ];

  /// Routes allowed for each role
  static final Map<String, List<String>> roleRoutes = {
    'admin': [
      adminDashboard,
      adminUsers,
      adminOrders,
      adminProducts,
      adminFinance,
      adminSettings,
    ],
    'seller': [
      sellerDashboard,
      sellerProducts,
      sellerAddProduct,
      sellerAddVideo,
      sellerOrders,
      sellerStore,
      home,
      productDetail,
      shop,
    ],
    'courier': [
      courierDashboard,
      courierAvailableOrders,
      courierOrders,
      courierEarnings,
    ],
    'buyer': [
      home,
      videoFeed,
      productDetail,
      cart,
      checkout,
      orders,
      profile,
      editProfile,
      addresses,
      wishlist,
      followingFeed,
      chatList,
      chat,
      notifications,
      viewHistory,
      support,
      returns,
      wallet,
      shop,
      compare,
      disputes,
    ],
  };

  /// Check if a route is allowed for a user
  static bool isRouteAllowed(String route, User? user) {
    // Public routes are always allowed
    if (!protectedRoutes.contains(route)) {
      return true;
    }
    
    // Protected routes require authentication
    if (user == null) {
      return false;
    }
    
    // Check role-specific access
    final allowedRoutes = roleRoutes[user.role] ?? [];
    return allowedRoutes.contains(route);
  }

  /// Get the home route for a user based on their role
  static String getHomeRoute(User? user) {
    return RouteGuard.getHomeRoute(user);
  }

  static Route<dynamic> generateRoute(RouteSettings settings, {User? user}) {
    // Check route access
    final routeName = settings.name;
    
    switch (routeName) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      
      case onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());
      
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      
      case register:
        return MaterialPageRoute(builder: (_) => const RegisterScreen());
      
      case otp:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => OtpScreen(phone: args?['phone'] ?? ''),
        );
      
      case main:
        return MaterialPageRoute(builder: (_) => const MainScreen());
      
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      
      case videoFeed:
        return MaterialPageRoute(builder: (_) => const VideoFeedScreen());
      
      case cart:
        return MaterialPageRoute(builder: (_) => const CartScreen());
      
      case checkout:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const CheckoutScreen());
      
      case orders:
        return MaterialPageRoute(builder: (_) => const OrdersScreen());
      
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      
      case editProfile:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const EditProfileScreen());
      
      case addresses:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const AddressesScreen());
      
      case appSettings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      
      // Seller routes
      case sellerDashboard:
        if (!RouteGuard.isSeller(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const SellerDashboardScreen());
      
      case sellerProducts:
        if (!RouteGuard.isSeller(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const MyProductsScreen());
      
      case sellerAddProduct:
        if (!RouteGuard.isSeller(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AddProductScreen());
      
      case sellerAddVideo:
        if (!RouteGuard.isSeller(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AddVideoScreen());
      
      case sellerOrders:
        if (!RouteGuard.isSeller(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const SellerOrdersScreen());

      // Courier routes
      case courierDashboard:
        if (!RouteGuard.isCourier(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const CourierDashboardScreen());
      
      case courierAvailableOrders:
        if (!RouteGuard.isCourier(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AvailableOrdersScreen());
      
      case courierOrders:
        if (!RouteGuard.isCourier(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const CourierOrdersScreen());
      
      case courierEarnings:
        if (!RouteGuard.isCourier(user) && !RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const CourierEarningsScreen());

      // Admin routes
      case adminDashboard:
        if (!RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AdminDashboardScreen());
      
      case adminUsers:
        if (!RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AdminUsersScreen());
      
      case adminOrders:
        if (!RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AdminOrdersScreen());
      
      case adminProducts:
        if (!RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AdminProductsScreen());
      
      case adminFinance:
        if (!RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AdminFinanceScreen());
      
      case adminSettings:
        if (!RouteGuard.isAdmin(user)) {
          return _redirectToHome(settings);
        }
        return MaterialPageRoute(builder: (_) => const AdminSettingsScreen());

      // Other routes
      case qrScanner:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => QrScannerScreen(
            orderId: args?['orderId'] ?? '',
            scanType: args?['scanType'] ?? 'pickup',
          ),
        );
      
      case search:
        return MaterialPageRoute(builder: (_) => const SearchScreen());
      
      case wishlist:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const WishlistScreen());
      
      case followingFeed:
        return MaterialPageRoute(builder: (_) => const FollowingFeedScreen());
      
      case chatList:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const ChatListScreen());
      
      case notifications:
        return MaterialPageRoute(builder: (_) => const NotificationScreen());
      
      case viewHistory:
        return MaterialPageRoute(builder: (_) => const ViewHistoryScreen());
      
      case support:
        return MaterialPageRoute(builder: (_) => const SupportScreen());
      
      case returns:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const ReturnsScreen());
      
      case wallet:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const WalletScreen());
      
      case compare:
        return MaterialPageRoute(builder: (_) => const CompareScreen());
      
      case about:
        return MaterialPageRoute(builder: (_) => const AboutScreen());
      
      case disputes:
        if (!RouteGuard.isAuthenticated(user)) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(builder: (_) => const DisputesScreen());

      default:
        // Handle dynamic routes
        if (routeName?.startsWith('/returns/') ?? false) {
          if (!RouteGuard.isAuthenticated(user)) {
            return _redirectToLogin(settings);
          }
          final returnId = routeName!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => ReturnDetailScreen(returnId: returnId),
          );
        }
        
        if (routeName?.startsWith('/support/') ?? false) {
          final ticketId = routeName!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => TicketDetailScreen(ticketId: ticketId),
          );
        }
        
        if (routeName?.startsWith('/chat/') ?? false) {
          if (!RouteGuard.isAuthenticated(user)) {
            return _redirectToLogin(settings);
          }
          final chatId = routeName!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => ChatScreen(chatId: chatId),
          );
        }
        
        if (routeName?.startsWith('/product/') ?? false) {
          final productId = routeName!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: productId),
          );
        }
        
        if (routeName?.startsWith('/order/') ?? false) {
          final orderId = routeName!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: orderId),
          );
        }
        
        if (routeName?.startsWith('/shop/') ?? false) {
          final sellerId = routeName!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => ShopScreen(sellerId: sellerId),
          );
        }
        
        // 404 route
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text('Страница не найдена: $routeName'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.pushReplacementNamed(_, main),
                    child: const Text('На главную'),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }

  static MaterialPageRoute _redirectToLogin(RouteSettings settings) {
    return MaterialPageRoute(
      builder: (_) => LoginScreen(redirectTo: settings.name),
    );
  }

  static MaterialPageRoute _redirectToHome(RouteSettings settings) {
    return MaterialPageRoute(
      builder: (_) => const MainScreen(),
    );
  }
}
