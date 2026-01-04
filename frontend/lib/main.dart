import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'config/theme.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'providers/product_provider.dart';
import 'providers/video_provider.dart';
import 'providers/order_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/wishlist_provider.dart';
import 'providers/follow_provider.dart';
import 'providers/video_interaction_provider.dart';
import 'providers/review_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/coupon_provider.dart';
import 'providers/address_provider.dart';
import 'providers/view_history_provider.dart';
import 'providers/support_provider.dart';
import 'providers/return_provider.dart';
import 'providers/wallet_provider.dart';
import 'l10n/app_localizations.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  runApp(const GoGoMarketApp());
}

class GoGoMarketApp extends StatelessWidget {
  const GoGoMarketApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => VideoProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
              ChangeNotifierProvider(create: (_) => WishlistProvider()),
                          ChangeNotifierProvider(create: (_) => FollowProvider()),
                          ChangeNotifierProvider(create: (_) => VideoInteractionProvider()),
                          ChangeNotifierProvider(create: (_) => ReviewProvider()),
                                                  ChangeNotifierProvider(create: (_) => ChatProvider()),
                                                  ChangeNotifierProvider(create: (_) => NotificationProvider()),
                                                                                                  ChangeNotifierProvider(create: (_) => CouponProvider()),
                                                                                                                                                                                                  ChangeNotifierProvider(create: (_) => AddressProvider()),
                                                                                                                                                                                                  ChangeNotifierProvider(create: (_) => ViewHistoryProvider()),
                                                                                                                                                                                                                                                                                                                                                                                                  ChangeNotifierProvider(create: (_) => SupportProvider()),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ChangeNotifierProvider(create: (_) => ReturnProvider()),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ChangeNotifierProvider(create: (_) => WalletProvider()),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ],
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, child) {
          return MaterialApp(
            title: 'GoGoMarket',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,
            locale: localeProvider.locale,
            supportedLocales: const [
              Locale('en'),
              Locale('ru'),
              Locale('uz'),
            ],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            initialRoute: '/',
            onGenerateRoute: AppRoutes.generateRoute,
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
