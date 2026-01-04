import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/product_provider.dart';
import '../../providers/video_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/product_card.dart';
import '../../widgets/live_seller_avatar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final productProvider = context.read<ProductProvider>();
    final videoProvider = context.read<VideoProvider>();

    await Future.wait([
      productProvider.fetchProducts(refresh: true),
      productProvider.fetchCategories(),
      videoProvider.fetchLiveVideos(),
    ]);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _selectedCategory = 'ALL';

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.darkSurface,
          onRefresh: _loadData,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: AppColors.grey700,
                            backgroundImage: user?.avatar != null
                                ? NetworkImage(user!.avatar!)
                                : null,
                            child: user?.avatar == null
                                ? const Icon(Icons.person, color: AppColors.grey400)
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hi, ${user?.firstName ?? 'Guest'}',
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'How are you feeling today?',
                                  style: TextStyle(
                                    color: AppColors.grey400,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.search, color: AppColors.white),
                            onPressed: () {},
                          ),
                          IconButton(
                            icon: const Icon(Icons.notifications_outlined, color: AppColors.white),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: _buildLiveSellingSection(),
              ),
              SliverToBoxAdapter(
                child: _buildShortVideosSection(),
              ),
              SliverToBoxAdapter(
                child: _buildCategoriesSection(),
              ),
              _buildProductGrid(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveSellingSection() {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        final liveVideos = videoProvider.liveVideos;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.star, color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  const Text(
                    'Live selling',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: liveVideos.isEmpty
                  ? ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: 5,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: _buildLiveAvatar(null, 'Seller ${index + 1}'),
                        );
                      },
                    )
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: liveVideos.length,
                      itemBuilder: (context, index) {
                        final video = liveVideos[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: _buildLiveAvatar(
                            video.seller?.avatar,
                            video.seller?.firstName ?? '',
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }

  Widget _buildLiveAvatar(String? imageUrl, String name) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/video-feed');
      },
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary, width: 2),
            ),
            child: CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.grey700,
              backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
              child: imageUrl == null
                  ? const Icon(Icons.person, color: AppColors.grey400)
                  : null,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            name,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 10,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildShortVideosSection() {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        final videos = videoProvider.videos.take(5).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.bolt, color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  const Text(
                    'Short',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 180,
              child: videos.isEmpty
                  ? ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: 4,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: _buildShortVideoCard(null),
                        );
                      },
                    )
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: videos.length,
                      itemBuilder: (context, index) {
                        final video = videos[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: _buildShortVideoCard(video.thumbnailUrl),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }

  Widget _buildShortVideoCard(String? thumbnailUrl) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/video-feed');
      },
      child: Container(
        width: 120,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: AppColors.grey800,
          image: thumbnailUrl != null
              ? DecorationImage(
                  image: NetworkImage(thumbnailUrl),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        child: thumbnailUrl == null
            ? const Center(
                child: Icon(Icons.play_circle_outline, color: AppColors.grey500, size: 40),
              )
            : null,
      ),
    );
  }

  Widget _buildCategoriesSection() {
    final categories = ['ALL', 'MEN', 'WOMEN', 'DRESS', 'KURTA', 'SHOES'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(Icons.grid_view, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              const Text(
                'New Categories',
                style: TextStyle(
                  color: AppColors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              final isSelected = _selectedCategory == category;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedCategory = category;
                    });
                    if (category == 'ALL') {
                      context.read<ProductProvider>().fetchProducts(refresh: true);
                    } else {
                      context.read<ProductProvider>().fetchProducts(
                        category: category.toLowerCase(),
                        refresh: true,
                      );
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : AppColors.grey800,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      category,
                      style: TextStyle(
                        color: isSelected ? AppColors.black : AppColors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildNewCollectionSection() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        final products = productProvider.products.take(4).toList();

        if (products.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'New collection',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  TextButton(
                    onPressed: () {
                      // TODO: Navigate to all products
                    },
                    child: const Text('See all'),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 220,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: products.length,
                itemBuilder: (context, index) {
                  final product = products[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: SizedBox(
                      width: 160,
                      child: ProductCard(
                        product: product,
                        onTap: () {
                          Navigator.pushNamed(context, '/product/${product.id}');
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }

  Widget _buildProductGrid() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.isLoading && productProvider.products.isEmpty) {
          return const SliverFillRemaining(
            child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
          );
        }

        final products = productProvider.products;

        if (products.isEmpty) {
          return const SliverFillRemaining(
            child: Center(
              child: Text(
                'No products found',
                style: TextStyle(color: AppColors.grey400),
              ),
            ),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.7,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final product = products[index];
                return _buildProductCard(product);
              },
              childCount: products.length,
            ),
          ),
        );
      },
    );
  }

  Widget _buildProductCard(dynamic product) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/product/${product.id}');
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: AppColors.grey800,
        ),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: product.images.isNotEmpty
                  ? Image.network(
                      product.images.first,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: AppColors.grey700,
                          child: const Center(
                            child: Icon(Icons.image, color: AppColors.grey500, size: 40),
                          ),
                        );
                      },
                    )
                  : Container(
                      color: AppColors.grey700,
                      child: const Center(
                        child: Icon(Icons.image, color: AppColors.grey500, size: 40),
                      ),
                    ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.favorite_border,
                  color: AppColors.black,
                  size: 18,
                ),
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(16),
                    bottomRight: Radius.circular(16),
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      AppColors.black.withOpacity(0.8),
                    ],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${product.formattedPrice}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
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
}
