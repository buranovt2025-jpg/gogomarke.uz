import 'package:share_plus/share_plus.dart';

class ShareService {
  static const String baseUrl = 'https://gogomarket.uz';

  static Future<void> shareProduct(String productId, String productTitle) async {
    final url = '$baseUrl/product/$productId';
    await Share.share(
      '$productTitle\n\n$url',
      subject: productTitle,
    );
  }

  static Future<void> shareVideo(String videoId, String? title) async {
    final url = '$baseUrl/video/$videoId';
    final shareText = title != null ? '$title\n\n$url' : url;
    await Share.share(
      shareText,
      subject: title ?? 'Check out this video on GoGoMarket',
    );
  }

  static Future<void> shareStore(String sellerId, String storeName) async {
    final url = '$baseUrl/store/$sellerId';
    await Share.share(
      'Check out $storeName on GoGoMarket!\n\n$url',
      subject: storeName,
    );
  }

  static Future<void> shareOrder(String orderId, String orderNumber) async {
    await Share.share(
      'Order #$orderNumber on GoGoMarket',
      subject: 'Order #$orderNumber',
    );
  }

  static Future<void> shareApp() async {
    await Share.share(
      'Download GoGoMarket - The best video marketplace!\n\n$baseUrl',
      subject: 'GoGoMarket App',
    );
  }

  static String getProductDeepLink(String productId) {
    return '$baseUrl/product/$productId';
  }

  static String getVideoDeepLink(String videoId) {
    return '$baseUrl/video/$videoId';
  }

  static String getStoreDeepLink(String sellerId) {
    return '$baseUrl/store/$sellerId';
  }
}
