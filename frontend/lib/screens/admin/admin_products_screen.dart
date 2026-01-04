import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/product_provider.dart';
import '../../models/product.dart';

class AdminProductsScreen extends StatefulWidget {
  const AdminProductsScreen({super.key});

  @override
  State<AdminProductsScreen> createState() => _AdminProductsScreenState();
}

class _AdminProductsScreenState extends State<AdminProductsScreen> {
  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    final provider = context.read<ProductProvider>();
    await provider.fetchProducts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Модерация товаров')),
      body: Consumer<ProductProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) return const Center(child: CircularProgressIndicator());
          if (provider.products.isEmpty) return const Center(child: Text('Товары не найдены'));
          return RefreshIndicator(
            onRefresh: _loadProducts,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.products.length,
              itemBuilder: (context, index) {
                final product = provider.products[index];
                return _buildProductCard(product);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: product.images.isNotEmpty
                  ? Image.network(
                      product.images.first,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey[200],
                        child: const Icon(Icons.image, color: Colors.grey),
                      ),
                    )
                  : Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[200],
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.title, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text('${product.price.toStringAsFixed(0)} сум', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: product.isActive ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          product.isActive ? 'Активен' : 'Неактивен',
                          style: TextStyle(fontSize: 12, color: product.isActive ? Colors.green : Colors.red),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('В наличии: ${product.stock}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (value) => _handleProductAction(product, value),
              itemBuilder: (context) => [
                PopupMenuItem(value: product.isActive ? 'deactivate' : 'activate', child: Text(product.isActive ? 'Деактивировать' : 'Активировать')),
                const PopupMenuItem(value: 'view', child: Text('Просмотреть')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _handleProductAction(Product product, String action) {
    switch (action) {
      case 'activate':
      case 'deactivate':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Функция модерации в разработке')),
        );
        break;
      case 'view':
        Navigator.pushNamed(context, '/product/${product.id}');
        break;
    }
  }
}
