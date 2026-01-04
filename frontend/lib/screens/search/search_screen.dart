import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../providers/product_provider.dart';
import '../../models/product.dart';
import '../../utils/currency_formatter.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  
  String? _selectedCategory;
  String _sortBy = 'newest';
  double? _minPrice;
  double? _maxPrice;
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _loadCategories() {
    context.read<ProductProvider>().fetchCategories();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _loadMoreProducts();
    }
  }

  void _loadMoreProducts() {
    final provider = context.read<ProductProvider>();
    if (!provider.isLoading && provider.hasMore) {
      provider.fetchProducts(
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        category: _selectedCategory,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
      );
    }
  }

  void _search() {
    context.read<ProductProvider>().fetchProducts(
      search: _searchController.text.isNotEmpty ? _searchController.text : null,
      category: _selectedCategory,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      refresh: true,
    );
  }

  void _clearFilters() {
    setState(() {
      _selectedCategory = null;
      _minPrice = null;
      _maxPrice = null;
      _sortBy = 'newest';
    });
    _search();
  }

  List<Product> _sortProducts(List<Product> products) {
    final sorted = List<Product>.from(products);
    switch (_sortBy) {
      case 'price_low':
        sorted.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price_high':
        sorted.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case 'newest':
      default:
        break;
    }
    return sorted;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Search products...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: AppColors.grey500),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _searchController.clear(); _search(); })
                : null,
          ),
          onSubmitted: (_) => _search(),
          textInputAction: TextInputAction.search,
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: _search),
          IconButton(
            icon: Icon(_showFilters ? Icons.filter_list_off : Icons.filter_list, color: _hasActiveFilters ? AppColors.primary : null),
            onPressed: () { setState(() { _showFilters = !_showFilters; }); },
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showFilters) _buildFiltersSection(),
          _buildSortingChips(),
          Expanded(
            child: Consumer<ProductProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.products.isEmpty) return const Center(child: CircularProgressIndicator());
                if (provider.products.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_off, size: 80, color: AppColors.grey400),
                        const SizedBox(height: 16),
                        const Text('No products found', style: TextStyle(fontSize: 18, color: AppColors.grey600)),
                        const SizedBox(height: 8),
                        TextButton(onPressed: _clearFilters, child: const Text('Clear filters')),
                      ],
                    ),
                  );
                }
                final sortedProducts = _sortProducts(provider.products);
                return GridView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.7, crossAxisSpacing: 12, mainAxisSpacing: 12),
                  itemCount: sortedProducts.length + (provider.hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index >= sortedProducts.length) return const Center(child: CircularProgressIndicator());
                    return _buildProductCard(sortedProducts[index]);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  bool get _hasActiveFilters => _selectedCategory != null || _minPrice != null || _maxPrice != null;

  Widget _buildFiltersSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Filters', style: Theme.of(context).textTheme.titleMedium), if (_hasActiveFilters) TextButton(onPressed: _clearFilters, child: const Text('Clear all'))]),
          const SizedBox(height: 12),
          Text('Category', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Consumer<ProductProvider>(
            builder: (context, provider, child) {
              return Wrap(
                spacing: 8, runSpacing: 8,
                children: [
                  ChoiceChip(label: const Text('All'), selected: _selectedCategory == null, onSelected: (selected) { if (selected) { setState(() => _selectedCategory = null); _search(); } }),
                  ...provider.categories.map((category) => ChoiceChip(label: Text(category), selected: _selectedCategory == category, onSelected: (selected) { setState(() => _selectedCategory = selected ? category : null); _search(); })),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          Text('Price Range', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: TextField(decoration: const InputDecoration(labelText: 'Min', prefixText: 'UZS ', isDense: true), keyboardType: TextInputType.number, onChanged: (value) { _minPrice = double.tryParse(value); }, onSubmitted: (_) => _search())),
              const SizedBox(width: 16),
              Expanded(child: TextField(decoration: const InputDecoration(labelText: 'Max', prefixText: 'UZS ', isDense: true), keyboardType: TextInputType.number, onChanged: (value) { _maxPrice = double.tryParse(value); }, onSubmitted: (_) => _search())),
              const SizedBox(width: 8),
              IconButton(icon: const Icon(Icons.check), onPressed: _search),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSortingChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(children: [_buildSortChip('Newest', 'newest'), const SizedBox(width: 8), _buildSortChip('Price: Low to High', 'price_low'), const SizedBox(width: 8), _buildSortChip('Price: High to Low', 'price_high'), const SizedBox(width: 8), _buildSortChip('Top Rated', 'rating')]),
    );
  }

  Widget _buildSortChip(String label, String value) {
    return ChoiceChip(label: Text(label), selected: _sortBy == value, onSelected: (selected) { if (selected) setState(() => _sortBy = value); });
  }

  Widget _buildProductCard(Product product) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/product/${product.id}'),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 3, child: product.images.isNotEmpty ? CachedNetworkImage(imageUrl: product.images.first, fit: BoxFit.cover, width: double.infinity, placeholder: (context, url) => Container(color: AppColors.grey200, child: const Center(child: CircularProgressIndicator(strokeWidth: 2))), errorWidget: (context, url, error) => Container(color: AppColors.grey200, child: const Icon(Icons.image_not_supported))) : Container(color: AppColors.grey200, child: const Icon(Icons.image, size: 50))),
            Expanded(flex: 2, child: Padding(padding: const EdgeInsets.all(8), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(product.title, style: Theme.of(context).textTheme.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis), const Spacer(), Row(children: [const Icon(Icons.star, size: 14, color: Colors.amber), const SizedBox(width: 2), Text(product.rating.toStringAsFixed(1), style: Theme.of(context).textTheme.bodySmall)]), const SizedBox(height: 4), Text(CurrencyFormatter.format(product.price), style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold))]))),
          ],
        ),
      ),
    );
  }
}
