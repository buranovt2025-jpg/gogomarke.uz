import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wishlist'),
        actions: [
          Consumer<WishlistProvider>(
            builder: (context, wishlist, child) {
              if (wishlist.isEmpty) return const SizedBox.shrink();
              return TextButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Clear Wishlist'),
                      content: const Text('Are you sure you want to remove all items from your wishlist?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                        TextButton(onPressed: () { wishlist.clear(); Navigator.pop(ctx); }, child: const Text('Clear', style: TextStyle(color: AppColors.error))),
                      ],
                    ),
                  );
                },
                child: const Text('Clear'),
              );
            },
          ),
        ],
      ),
      body: Consumer<WishlistProvider>(
        builder: (context, wishlist, child) {
          if (wishlist.isLoading) return const Center(child: CircularProgressIndicator());
          if (wishlist.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.favorite_border, size: 100, color: AppColors.grey400),
                  const SizedBox(height: 16),
                  const Text('Your wishlist is empty', style: TextStyle(fontSize: 18, color: AppColors.grey600)),
                  const SizedBox(height: 8),
                  const Text('Save items you like for later', style: TextStyle(color: AppColors.grey500)),
                  const SizedBox(height: 24),
                  ElevatedButton(onPressed: () => Navigator.pushNamed(context, '/search'), child: const Text('Browse Products')),
                ],
              ),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.65, crossAxisSpacing: 12, mainAxisSpacing: 12),
            itemCount: wishlist.items.length,
            itemBuilder: (context, index) {
              final product = wishlist.items[index];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      children: [
                        AspectRatio(
                          aspectRatio: 1,
                          child: product.images.isNotEmpty
                              ? CachedNetworkImage(imageUrl: product.images.first, fit: BoxFit.cover, placeholder: (context, url) => Container(color: AppColors.grey200, child: const Center(child: CircularProgressIndicator(strokeWidth: 2))), errorWidget: (context, url, error) => Container(color: AppColors.grey200, child: const Icon(Icons.image_not_supported)))
                              : Container(color: AppColors.grey200, child: const Icon(Icons.image, size: 50)),
                        ),
                        Positioned(
                          top: 8, right: 8,
                          child: GestureDetector(
                            onTap: () => wishlist.removeItem(product.id),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                              child: const Icon(Icons.favorite, color: AppColors.error, size: 20),
                            ),
                          ),
                        ),
                      ],
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(product.title, style: Theme.of(context).textTheme.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                            const Spacer(),
                            Text(CurrencyFormatter.format(product.price), style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: product.stock > 0 ? () {
                                  context.read<CartProvider>().addItem(product);
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${product.title} added to cart'), backgroundColor: AppColors.success));
                                } : null,
                                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 8)),
                                child: Text(product.stock > 0 ? 'Add to Cart' : 'Out of Stock', style: const TextStyle(fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
