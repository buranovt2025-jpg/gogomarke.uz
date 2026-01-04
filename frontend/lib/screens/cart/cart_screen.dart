import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cart'),
        actions: [
          Consumer<CartProvider>(
            builder: (context, cart, child) {
              if (cart.isEmpty) return const SizedBox.shrink();
              return TextButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Clear Cart'),
                      content: const Text('Are you sure you want to remove all items?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                        TextButton(onPressed: () { cart.clear(); Navigator.pop(ctx); }, child: const Text('Clear', style: TextStyle(color: AppColors.error))),
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
      body: Consumer<CartProvider>(
        builder: (context, cart, child) {
          if (cart.isLoading) return const Center(child: CircularProgressIndicator());
          if (cart.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.shopping_cart_outlined, size: 100, color: AppColors.grey400),
                  const SizedBox(height: 16),
                  const Text('Your cart is empty', style: TextStyle(fontSize: 18, color: AppColors.grey600)),
                  const SizedBox(height: 8),
                  const Text('Add items to get started', style: TextStyle(color: AppColors.grey500)),
                  const SizedBox(height: 24),
                  ElevatedButton(onPressed: () => Navigator.pushNamed(context, '/main'), child: const Text('Browse Products')),
                ],
              ),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: cart.items.length,
                  itemBuilder: (context, index) {
                    final item = cart.items[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: item.product.images.isNotEmpty
                                  ? CachedNetworkImage(imageUrl: item.product.images.first, width: 80, height: 80, fit: BoxFit.cover, placeholder: (context, url) => Container(width: 80, height: 80, color: AppColors.grey200, child: const Center(child: CircularProgressIndicator(strokeWidth: 2))), errorWidget: (context, url, error) => Container(width: 80, height: 80, color: AppColors.grey200, child: const Icon(Icons.image_not_supported)))
                                  : Container(width: 80, height: 80, color: AppColors.grey200, child: const Icon(Icons.image)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.product.title, style: Theme.of(context).textTheme.titleMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 4),
                                  if (item.selectedSize != null || item.selectedColor != null) Text([if (item.selectedSize != null) 'Size: ${item.selectedSize}', if (item.selectedColor != null) 'Color: ${item.selectedColor}'].join(' | '), style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.grey600)),
                                  const SizedBox(height: 8),
                                  Text(CurrencyFormatter.format(item.product.price), style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Container(
                                        decoration: BoxDecoration(border: Border.all(color: AppColors.grey300), borderRadius: BorderRadius.circular(8)),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(icon: const Icon(Icons.remove, size: 18), onPressed: () => cart.decrementQuantity(item.id), constraints: const BoxConstraints(minWidth: 36, minHeight: 36), padding: EdgeInsets.zero),
                                            Container(constraints: const BoxConstraints(minWidth: 32), alignment: Alignment.center, child: Text('${item.quantity}', style: Theme.of(context).textTheme.titleSmall)),
                                            IconButton(icon: const Icon(Icons.add, size: 18), onPressed: item.quantity < item.product.stock ? () => cart.incrementQuantity(item.id) : null, constraints: const BoxConstraints(minWidth: 36, minHeight: 36), padding: EdgeInsets.zero),
                                          ],
                                        ),
                                      ),
                                      const Spacer(),
                                      IconButton(icon: const Icon(Icons.delete_outline, color: AppColors.error), onPressed: () => cart.removeItem(item.id)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, -5))]),
                child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Subtotal (${cart.totalQuantity} items)', style: Theme.of(context).textTheme.bodyMedium), Text(CurrencyFormatter.format(cart.subtotal), style: Theme.of(context).textTheme.bodyMedium)]),
                      const SizedBox(height: 4),
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Delivery', style: Theme.of(context).textTheme.bodyMedium), Text(CurrencyFormatter.format(cart.deliveryFee), style: Theme.of(context).textTheme.bodyMedium)]),
                      const Divider(height: 16),
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Total', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)), Text(CurrencyFormatter.format(cart.total), style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold))]),
                      const SizedBox(height: 16),
                      SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => Navigator.pushNamed(context, '/checkout'), child: const Text('Proceed to Checkout'))),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
