import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/cart_storage.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<Map<String, dynamic>> _guestCartItems = [];
  bool _isLoadingGuestCart = false;

  @override
  void initState() {
    super.initState();
    _loadGuestCart();
  }

  Future<void> _loadGuestCart() async {
    setState(() => _isLoadingGuestCart = true);
    final items = await CartStorage.getCartItems();
    if (mounted) {
      setState(() {
        _guestCartItems = items;
        _isLoadingGuestCart = false;
      });
    }
  }

  Future<void> _updateGuestQuantity(int productId, int newQuantity) async {
    await CartStorage.updateQuantity(productId, newQuantity);
    await _loadGuestCart();
  }

  Future<void> _removeGuestItem(int productId) async {
    await CartStorage.removeItem(productId);
    await _loadGuestCart();
  }

  Future<void> _clearGuestCart() async {
    await CartStorage.clearCart();
    await _loadGuestCart();
  }

  double get _guestCartTotal {
    double total = 0;
    for (var item in _guestCartItems) {
      total += (item['price'] as num) * (item['quantity'] as int);
    }
    return total;
  }

  int get _guestCartItemsCount {
    int count = 0;
    for (var item in _guestCartItems) {
      count += item['quantity'] as int;
    }
    return count;
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isAuthenticated = authProvider.isAuthenticated;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Корзина'),
        actions: [
          if (isAuthenticated)
            Consumer<CartProvider>(
              builder: (context, cart, child) {
                if (cart.isEmpty) return const SizedBox.shrink();
                return TextButton(
                  onPressed: () => _showClearDialog(context, cart, isAuthenticated),
                  child: const Text('Очистить'),
                );
              },
            )
          else if (_guestCartItems.isNotEmpty)
            TextButton(
              onPressed: () => _showClearDialog(context, null, isAuthenticated),
              child: const Text('Очистить'),
            ),
        ],
      ),
      body: isAuthenticated ? _buildAuthenticatedCart() : _buildGuestCart(),
    );
  }

  Widget _buildAuthenticatedCart() {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        if (cart.isLoading) return const Center(child: CircularProgressIndicator());
        if (cart.isEmpty) return _buildEmptyCart();
        
        return Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: cart.items.length,
                itemBuilder: (context, index) {
                  final item = cart.items[index];
                  return _buildCartItemCard(
                    title: item.product.title,
                    price: item.product.price,
                    quantity: item.quantity,
                    imageUrl: item.product.images.isNotEmpty ? item.product.images.first : null,
                    size: item.selectedSize,
                    color: item.selectedColor,
                    maxQuantity: item.product.stock,
                    onIncrement: () => cart.incrementQuantity(item.id),
                    onDecrement: () => cart.decrementQuantity(item.id),
                    onRemove: () => cart.removeItem(item.id),
                  );
                },
              ),
            ),
            _buildCartSummary(
              itemCount: cart.totalQuantity,
              subtotal: cart.subtotal,
              deliveryFee: cart.deliveryFee,
              total: cart.total,
              onCheckout: () => Navigator.pushNamed(context, '/checkout'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildGuestCart() {
    if (_isLoadingGuestCart) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (_guestCartItems.isEmpty) {
      return _buildEmptyCart();
    }
    
    final deliveryFee = 15000.0; // Default delivery fee
    final total = _guestCartTotal + deliveryFee;
    
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _guestCartItems.length,
            itemBuilder: (context, index) {
              final item = _guestCartItems[index];
              return _buildCartItemCard(
                title: item['name'] as String,
                price: (item['price'] as num).toDouble(),
                quantity: item['quantity'] as int,
                imageUrl: item['imageUrl'] as String?,
                maxQuantity: 99,
                onIncrement: () => _updateGuestQuantity(
                  item['productId'] as int,
                  (item['quantity'] as int) + 1,
                ),
                onDecrement: () => _updateGuestQuantity(
                  item['productId'] as int,
                  (item['quantity'] as int) - 1,
                ),
                onRemove: () => _removeGuestItem(item['productId'] as int),
              );
            },
          ),
        ),
        _buildCartSummary(
          itemCount: _guestCartItemsCount,
          subtotal: _guestCartTotal,
          deliveryFee: deliveryFee,
          total: total,
          onCheckout: () => _showLoginForCheckout(),
        ),
      ],
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_cart_outlined, size: 100, color: AppColors.grey400),
          const SizedBox(height: 16),
          const Text('Корзина пуста', style: TextStyle(fontSize: 18, color: AppColors.grey600)),
          const SizedBox(height: 8),
          const Text('Добавьте товары для покупки', style: TextStyle(color: AppColors.grey500)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/main'),
            child: const Text('Перейти к товарам'),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItemCard({
    required String title,
    required double price,
    required int quantity,
    String? imageUrl,
    String? size,
    String? color,
    required int maxQuantity,
    required VoidCallback onIncrement,
    required VoidCallback onDecrement,
    required VoidCallback onRemove,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 80,
                        height: 80,
                        color: AppColors.grey200,
                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 80,
                        height: 80,
                        color: AppColors.grey200,
                        child: const Icon(Icons.image_not_supported),
                      ),
                    )
                  : Container(
                      width: 80,
                      height: 80,
                      color: AppColors.grey200,
                      child: const Icon(Icons.image),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  if (size != null || color != null)
                    Text(
                      [
                        if (size != null) 'Размер: $size',
                        if (color != null) 'Цвет: $color',
                      ].join(' | '),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.grey600,
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    CurrencyFormatter.format(price),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.grey300),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: quantity > 1 ? onDecrement : onRemove,
                              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                              padding: EdgeInsets.zero,
                            ),
                            Container(
                              constraints: const BoxConstraints(minWidth: 32),
                              alignment: Alignment.center,
                              child: Text(
                                '$quantity',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: quantity < maxQuantity ? onIncrement : null,
                              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                              padding: EdgeInsets.zero,
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: AppColors.error),
                        onPressed: onRemove,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartSummary({
    required int itemCount,
    required double subtotal,
    required double deliveryFee,
    required double total,
    required VoidCallback onCheckout,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Сумма ($itemCount товаров)', style: Theme.of(context).textTheme.bodyMedium),
                Text(CurrencyFormatter.format(subtotal), style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Доставка', style: Theme.of(context).textTheme.bodyMedium),
                Text(CurrencyFormatter.format(deliveryFee), style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Итого',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  CurrencyFormatter.format(total),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onCheckout,
                child: const Text('Оформить заказ'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showClearDialog(BuildContext context, CartProvider? cart, bool isAuthenticated) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Очистить корзину'),
        content: const Text('Вы уверены, что хотите удалить все товары?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Отмена'),
          ),
          TextButton(
            onPressed: () {
              if (isAuthenticated && cart != null) {
                cart.clear();
              } else {
                _clearGuestCart();
              }
              Navigator.pop(ctx);
            },
            child: const Text('Очистить', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _showLoginForCheckout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Требуется авторизация'),
        content: const Text('Для оформления заказа необходимо войти в аккаунт. После входа товары из корзины сохранятся.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Позже'),
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
