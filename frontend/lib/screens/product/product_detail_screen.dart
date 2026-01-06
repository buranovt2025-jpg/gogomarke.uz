import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';

import '../../config/theme.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/compare_provider.dart';
import '../../utils/currency_formatter.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _currentImageIndex = 0;
  String? _selectedSize;
  String? _selectedColor;
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  Future<void> _loadProduct() async {
    await context.read<ProductProvider>().fetchProductById(widget.productId);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Consumer<ProductProvider>(
        builder: (context, productProvider, child) {
          final product = productProvider.selectedProduct;

          if (productProvider.isLoading || product == null) {
            return Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 400,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: product.images.isNotEmpty
                      ? PageView.builder(
                          itemCount: product.images.length,
                          onPageChanged: (index) {
                            setState(() {
                              _currentImageIndex = index;
                            });
                          },
                          itemBuilder: (context, index) {
                            return CachedNetworkImage(
                              imageUrl: product.images[index],
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                color: AppColors.grey200,
                                child: const Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: AppColors.grey200,
                                child: const Icon(Icons.image_not_supported),
                              ),
                            );
                          },
                        )
                      : Container(
                          color: AppColors.grey200,
                          child: const Icon(Icons.image, size: 100),
                        ),
                ),
                                actions: [
                                  Consumer<WishlistProvider>(
                                    builder: (context, wishlist, child) {
                                      final isInWishlist = wishlist.isInWishlist(product.id);
                                      return IconButton(
                                        icon: Icon(
                                          isInWishlist ? Icons.favorite : Icons.favorite_border,
                                          color: isInWishlist ? AppColors.error : null,
                                        ),
                                        onPressed: () {
                                          wishlist.toggleItem(product);
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist'),
                                              backgroundColor: isInWishlist ? AppColors.grey600 : AppColors.success,
                                            ),
                                          );
                                        },
                                      );
                                    },
                                  ),
                                                                                                                                    IconButton(
                                                                                                                                      icon: const Icon(Icons.share),
                                                                                                                                      onPressed: () {
                                                                                                                                        final shareText = '${product.title}\n\n'
                                                                                                                                            'Price: ${product.price.toStringAsFixed(0)} UZS\n'
                                                                                                                                            '${product.description.length > 100 ? '${product.description.substring(0, 100)}...' : product.description}\n\n'
                                                                                                                                            'Check it out on GoGoMarket!';
                                                                                                                                        Share.share(shareText, subject: product.title);
                                                                                                                                      },
                                                                                                                                    ),
                                                                  Consumer<CompareProvider>(
                                                                    builder: (context, compareProvider, child) {
                                                                      final isInCompare = compareProvider.isInCompare(product.id);
                                                                      return IconButton(
                                                                        icon: Icon(
                                                                          Icons.compare_arrows,
                                                                          color: isInCompare ? AppColors.primary : null,
                                                                        ),
                                                                        onPressed: () {
                                                                          if (isInCompare) {
                                                                            compareProvider.removeFromCompare(product.id);
                                                                            ScaffoldMessenger.of(context).showSnackBar(
                                                                              const SnackBar(
                                                                                content: Text('Removed from comparison'),
                                                                                backgroundColor: AppColors.grey600,
                                                                              ),
                                                                            );
                                                                          } else {
                                                                            final added = compareProvider.addToCompare(product);
                                                                            if (added) {
                                                                              ScaffoldMessenger.of(context).showSnackBar(
                                                                                SnackBar(
                                                                                  content: Text('Added to comparison (${compareProvider.compareCount}/4)'),
                                                                                  backgroundColor: AppColors.success,
                                                                                  action: SnackBarAction(
                                                                                    label: 'Compare',
                                                                                    textColor: Colors.white,
                                                                                    onPressed: () {
                                                                                      Navigator.pushNamed(context, '/compare');
                                                                                    },
                                                                                  ),
                                                                                ),
                                                                              );
                                                                            } else {
                                                                              ScaffoldMessenger.of(context).showSnackBar(
                                                                                const SnackBar(
                                                                                  content: Text('Maximum 4 products can be compared'),
                                                                                  backgroundColor: AppColors.error,
                                                                                ),
                                                                              );
                                                                            }
                                                                          }
                                                                        },
                                                                      );
                                                                    },
                                                                  ),
                                                                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.images.length > 1)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            product.images.length,
                            (index) => Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _currentImageIndex == index
                                    ? AppColors.primary
                                    : AppColors.grey300,
                              ),
                            ),
                          ),
                        ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              product.title,
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                CurrencyFormatter.format(product.price),
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (product.hasDiscount)
                                Text(
                                  CurrencyFormatter.format(product.originalPrice!),
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    decoration: TextDecoration.lineThrough,
                                    color: AppColors.grey500,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 20),
                          const SizedBox(width: 4),
                          Text(
                            product.rating.toStringAsFixed(1),
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${product.reviewCount} reviews)',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const Spacer(),
                          Text(
                            product.stock > 0 ? 'In Stock' : 'Out of Stock',
                            style: TextStyle(
                              color: product.stock > 0 ? AppColors.success : AppColors.error,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Description',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        product.description,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      if (product.sizes.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Text(
                          'Size',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: product.sizes.map((size) {
                            final isSelected = _selectedSize == size;
                            return ChoiceChip(
                              label: Text(size),
                              selected: isSelected,
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSize = selected ? size : null;
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ],
                      if (product.colors.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Text(
                          'Color',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: product.colors.map((color) {
                            final isSelected = _selectedColor == color;
                            return ChoiceChip(
                              label: Text(color),
                              selected: isSelected,
                              onSelected: (selected) {
                                setState(() {
                                  _selectedColor = selected ? color : null;
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ],
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Text(
                            'Quantity',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: _quantity > 1
                                ? () {
                                    setState(() {
                                      _quantity--;
                                    });
                                  }
                                : null,
                          ),
                          Text(
                            _quantity.toString(),
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: _quantity < product.stock
                                ? () {
                                    setState(() {
                                      _quantity++;
                                    });
                                  }
                                : null,
                          ),
                        ],
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
      bottomSheet: Consumer<ProductProvider>(
        builder: (context, productProvider, child) {
          final product = productProvider.selectedProduct;

          if (product == null) return const SizedBox.shrink();

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
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: product.stock > 0
                          ? () {
                              final cart = context.read<CartProvider>();
                              cart.addItem(
                                product,
                                quantity: _quantity,
                                size: _selectedSize,
                                color: _selectedColor,
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${product.title} added to cart'),
                                  backgroundColor: AppColors.success,
                                  action: SnackBarAction(
                                    label: 'View Cart',
                                    textColor: Colors.white,
                                    onPressed: () {
                                      Navigator.pushNamed(context, '/cart');
                                    },
                                  ),
                                ),
                              );
                            }
                          : null,
                      icon: const Icon(Icons.shopping_cart_outlined),
                      label: const Text('Add to Cart'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: product.stock > 0
                          ? () {
                              final cart = context.read<CartProvider>();
                              cart.addItem(
                                product,
                                quantity: _quantity,
                                size: _selectedSize,
                                color: _selectedColor,
                              );
                              Navigator.pushNamed(context, '/checkout');
                            }
                          : null,
                      child: const Text('Buy Now'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
