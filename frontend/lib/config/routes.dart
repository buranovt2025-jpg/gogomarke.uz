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
import '../screens/courier/courier_dashboard_screen.dart';
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

class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String otp = '/otp';
  static const String main = '/main';
  static const String home = '/home';
  static const String videoFeed = '/video-feed';
  static const String productDetail = '/product/:id';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orders = '/orders';
  static const String orderDetail = '/order/:id';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String addresses = '/profile/addresses';
  static const String appSettings = '/settings';
  static const String sellerDashboard = '/seller/dashboard';
    static const String courierDashboard = '/courier/dashboard';
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

                                static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
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
        return MaterialPageRoute(builder: (_) => const CheckoutScreen());
      
      case orders:
        return MaterialPageRoute(builder: (_) => const OrdersScreen());
      
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      
      case editProfile:
        return MaterialPageRoute(builder: (_) => const EditProfileScreen());
      
      case addresses:
        return MaterialPageRoute(builder: (_) => const AddressesScreen());
      
      case appSettings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      
      case sellerDashboard:
        return MaterialPageRoute(builder: (_) => const SellerDashboardScreen());
      
      case courierDashboard:
        return MaterialPageRoute(builder: (_) => const CourierDashboardScreen());
      
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
                          return MaterialPageRoute(builder: (_) => const WishlistScreen());
      
                                case followingFeed:
                                  return MaterialPageRoute(builder: (_) => const FollowingFeedScreen());
      
                    case chatList:
                      return MaterialPageRoute(builder: (_) => const ChatListScreen());
      
                                        case notifications:
                                          return MaterialPageRoute(builder: (_) => const NotificationScreen());
      
                                                                case viewHistory:
                                                                  return MaterialPageRoute(builder: (_) => const ViewHistoryScreen());
      
                                                                                        case support:
                                                                                          return MaterialPageRoute(builder: (_) => const SupportScreen());
      
                                                        case returns:
                                                          return MaterialPageRoute(builder: (_) => const ReturnsScreen());
      
                                                                                                                                default:
                                                    if (settings.name?.startsWith('/returns/') ?? false) {
                                                      final returnId = settings.name!.split('/').last;
                                                      return MaterialPageRoute(
                                                        builder: (_) => ReturnDetailScreen(returnId: returnId),
                                                      );
                                                    }
        
                                        if (settings.name?.startsWith('/support/') ?? false) {
                                          final ticketId = settings.name!.split('/').last;
                                          return MaterialPageRoute(
                                            builder: (_) => TicketDetailScreen(ticketId: ticketId),
                                          );
                                        }
        
                if (settings.name?.startsWith('/chat/') ?? false) {
                  final chatId = settings.name!.split('/').last;
                  return MaterialPageRoute(
                    builder: (_) => ChatScreen(chatId: chatId),
                  );
                }
        
                if (settings.name?.startsWith('/product/') ?? false) {
          final productId = settings.name!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: productId),
          );
        }
        
        if (settings.name?.startsWith('/order/') ?? false) {
          final orderId = settings.name!.split('/').last;
          return MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: orderId),
          );
        }
        
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('Route not found: ${settings.name}'),
            ),
          ),
        );
    }
  }
}
