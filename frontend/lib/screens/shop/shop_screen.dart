import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/product.dart';
import '../../models/user.dart';
import '../../providers/product_provider.dart';
import '../../providers/follow_provider.dart';
import '../../services/api_service.dart';

class ShopScreen extends StatefulWidget {
  final String sellerId;

  const ShopScreen({super.key, required this.sellerId});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;
  
  User? _seller;
  List<Product> _products = [];
  bool _isLoading = true;
  String? _error;
  
  int _totalProducts = 0;
  double _averageRating = 0;
  int _totalSales = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSellerData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSellerData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final sellerResponse = await _apiService.get('/users/${widget.sellerId}');
      if (sellerResponse.statusCode == 200) {
        final data = sellerResponse.data['data'] ?? sellerResponse.data['user'] ?? sellerResponse.data;
        _seller = User.fromJson(data);
      }

      final productsResponse = await _apiService.get('/products?sellerId=${widget.sellerId}');
      if (productsResponse.statusCode == 200) {
        final List<dynamic> data = productsResponse.data['data'] ?? productsResponse.data['products'] ?? productsResponse.data ?? [];
        _products = data.map((json) => Product.fromJson(json)).toList();
        _totalProducts = _products.length;
        
        if (_products.isNotEmpty) {
          double totalRating = 0;
          int ratedProducts = 0;
          for (var product in _products) {
            if (product.rating > 0) {
              totalRating += product.rating;
              ratedProducts++;
            }
          }
          if (ratedProducts > 0) {
            _averageRating = totalRating / ratedProducts;
          }
        }
      }

      final statsResponse = await _apiService.get('/sellers/${widget.sellerId}/stats');
      if (statsResponse.statusCode == 200) {
        final stats = statsResponse.data['data'] ?? statsResponse.data;
        _totalSales = stats['totalSales'] ?? stats['total_sales'] ?? 0;
      }
    } catch (e) {
      _error = e.toString();
    }

    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: AppColors.error)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadSellerData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : NestedScrollView(
                  headerSliverBuilder: (context, innerBoxIsScrolled) {
                    return [
                      _buildSliverAppBar(),
                      SliverToBoxAdapter(child: _buildSellerInfo()),
                      SliverToBoxAdapter(child: _buildStats()),
                      SliverPersistentHeader(
                        pinned: true,
                        delegate: _SliverTabBarDelegate(
                          TabBar(
                            controller: _tabController,
                            tabs: const [
                              Tab(text: 'Products'),
                              Tab(text: 'About'),
                            ],
                          ),
                        ),
                      ),
                    ];
                  },
                  body: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildProductsGrid(),
                      _buildAboutTab(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 150,
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.share),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Share shop link copied!')),
            );
          },
        ),
      ],
    );
  }

  Widget _buildSellerInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: AppColors.grey200,
            backgroundImage: _seller?.avatar != null ? NetworkImage(_seller!.avatar!) : null,
            child: _seller?.avatar == null
                ? Text(
                    _seller?.name.isNotEmpty == true ? _seller!.name[0].toUpperCase() : 'S',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                  )
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _seller?.shopName ?? _seller?.name ?? 'Shop',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (_seller?.isVerified == true)
                      const Icon(Icons.verified, color: AppColors.primary, size: 20),
                  ],
                ),
                const SizedBox(height: 4),
                if (_averageRating > 0)
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        _averageRating.toStringAsFixed(1),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          Consumer<FollowProvider>(
            builder: (context, followProvider, child) {
              final isFollowing = followProvider.isFollowing(widget.sellerId);
              return ElevatedButton(
                onPressed: () {
                  if (isFollowing) {
                    followProvider.unfollowUser(widget.sellerId);
                  } else {
                    followProvider.followUser(widget.sellerId);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isFollowing ? AppColors.grey200 : AppColors.primary,
                  foregroundColor: isFollowing ? AppColors.black : AppColors.white,
                ),
                child: Text(isFollowing ? 'Following' : 'Follow'),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('Products', _totalProducts.toString()),
          _buildStatItem('Sales', _totalSales.toString()),
          _buildStatItem('Rating', _averageRating > 0 ? _averageRating.toStringAsFixed(1) : '-'),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.grey500,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildProductsGrid() {
    if (_products.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.grey400),
            SizedBox(height: 16),
            Text(
              'No products yet',
              style: TextStyle(fontSize: 18, color: AppColors.grey500),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _products.length,
      itemBuilder: (context, index) {
        final product = _products[index];
        return _buildProductCard(product);
      },
    );
  }

  Widget _buildProductCard(Product product) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/product/${product.id}');
      },
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: product.images.isNotEmpty
                  ? Image.network(
                      product.images.first,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.grey200,
                        child: const Icon(Icons.image, color: AppColors.grey400),
                      ),
                    )
                  : Container(
                      color: AppColors.grey200,
                      child: const Icon(Icons.image, color: AppColors.grey400),
                    ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
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
          ],
        ),
      ),
    );
  }

  Widget _buildAboutTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_seller?.bio != null && _seller!.bio!.isNotEmpty) ...[
            const Text(
              'About',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _seller!.bio!,
              style: const TextStyle(color: AppColors.grey600),
            ),
            const SizedBox(height: 24),
          ],
          const Text(
            'Contact',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          if (_seller?.phone != null)
            ListTile(
              leading: const Icon(Icons.phone),
              title: Text(_seller!.phone!),
              contentPadding: EdgeInsets.zero,
            ),
          if (_seller?.email != null)
            ListTile(
              leading: const Icon(Icons.email),
              title: Text(_seller!.email!),
              contentPadding: EdgeInsets.zero,
            ),
          const SizedBox(height: 24),
          const Text(
            'Member Since',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            _seller?.createdAt != null
                ? '${_seller!.createdAt!.day}.${_seller!.createdAt!.month}.${_seller!.createdAt!.year}'
                : 'Unknown',
            style: const TextStyle(color: AppColors.grey600),
          ),
        ],
      ),
    );
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _SliverTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
