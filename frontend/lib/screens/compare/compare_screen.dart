import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/product.dart';
import '../../providers/compare_provider.dart';
import '../../providers/cart_provider.dart';

class CompareScreen extends StatelessWidget {
  const CompareScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Compare Products'),
        actions: [
          Consumer<CompareProvider>(
            builder: (context, compareProvider, child) {
              if (compareProvider.compareCount > 0) {
                return TextButton(
                  onPressed: () {
                    compareProvider.clearCompare();
                  },
                  child: const Text('Clear All'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<CompareProvider>(
        builder: (context, compareProvider, child) {
          if (compareProvider.isEmpty) {
            return _buildEmptyState(context);
          }
          return _buildComparisonTable(context, compareProvider);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.compare_arrows,
            size: 80,
            color: AppColors.grey400,
          ),
          const SizedBox(height: 16),
          const Text(
            'No products to compare',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Add products from the product page\nto compare them side by side',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.grey500),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/search');
            },
            child: const Text('Browse Products'),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonTable(BuildContext context, CompareProvider compareProvider) {
    final products = compareProvider.compareList;
    final comparisonData = compareProvider.getComparisonData();
    final attributes = compareProvider.getComparisonAttributes();

    return SingleChildScrollView(
      child: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildAttributeColumn(attributes),
                ...products.map((product) => _buildProductColumn(context, product, comparisonData, attributes)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttributeColumn(List<String> attributes) {
    return Container(
      width: 100,
      color: AppColors.grey100,
      child: Column(
        children: [
          Container(
            height: 200,
            alignment: Alignment.center,
            child: const Text(
              'Attribute',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          const Divider(height: 1),
          Container(
            height: 50,
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: const Text(
              'Actions',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          const Divider(height: 1),
          ...attributes.map((attr) => Container(
            height: 50,
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.grey200)),
            ),
            child: Text(
              attr,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildProductColumn(
    BuildContext context,
    Product product,
    Map<String, List<String>> comparisonData,
    List<String> attributes,
  ) {
    final compareProvider = context.read<CompareProvider>();
    final productIndex = compareProvider.compareList.indexOf(product);

    return Container(
      width: 150,
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: AppColors.grey200)),
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, '/product/${product.id}');
            },
            child: Container(
              height: 200,
              padding: const EdgeInsets.all(8),
              child: Column(
                children: [
                  Stack(
                    children: [
                      Container(
                        height: 100,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          color: AppColors.grey200,
                        ),
                        child: product.images.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  product.images.first,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(
                                    Icons.image,
                                    color: AppColors.grey400,
                                  ),
                                ),
                              )
                            : const Icon(Icons.image, color: AppColors.grey400),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () {
                            compareProvider.removeFromCompare(product.id);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppColors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 16,
                              color: AppColors.grey600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${product.price.toStringAsFixed(0)} UZS',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Consumer<CartProvider>(
              builder: (context, cartProvider, child) {
                return ElevatedButton(
                  onPressed: () {
                    cartProvider.addItem(product);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${product.title} added to cart'),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: const Size(0, 36),
                  ),
                  child: const Text(
                    'Add to Cart',
                    style: TextStyle(fontSize: 11),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),
          ...attributes.map((attr) {
            final values = comparisonData[attr] ?? [];
            final value = productIndex < values.length ? values[productIndex] : '-';
            return Container(
              height: 50,
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.grey200)),
              ),
              child: Text(
                value,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12),
              ),
            );
          }),
        ],
      ),
    );
  }
}
