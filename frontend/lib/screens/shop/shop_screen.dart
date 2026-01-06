import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../../config/theme.dart';
import '../../models/product.dart';
import '../../models/user.dart';
import '../../models/video.dart';
import '../../models/story.dart';
import '../../providers/follow_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../l10n/app_localizations.dart';

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
  List<Video> _videos = [];
  List<Story> _stories = [];
  Set<String> _viewedStories = {};
  bool _isLoading = true;
  bool _isSubscribed = false;
  bool _isSubscribeLoading = false;
  String? _error;
  
  int _totalProducts = 0;
  int _followers = 0;
  int _following = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadViewedStories();
    _loadSellerData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadViewedStories() async {
    final prefs = await SharedPreferences.getInstance();
    final viewed = prefs.getString('viewedStories_${widget.sellerId}');
    if (viewed != null) {
      setState(() {
        _viewedStories = Set<String>.from(json.decode(viewed));
      });
    }
  }

  Future<void> _markStoryAsViewed(String storyId) async {
    setState(() {
      _viewedStories.add(storyId);
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('viewedStories_${widget.sellerId}', json.encode(_viewedStories.toList()));
  }

  Future<void> _loadSellerData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load seller info
      final sellerResponse = await _apiService.get('/users/${widget.sellerId}');
      if (sellerResponse['success'] != false) {
        final data = sellerResponse['data'] ?? sellerResponse['user'] ?? sellerResponse;
        _seller = User.fromJson(data);
      }

      // Load products
      final productsResponse = await _apiService.get('/products?sellerId=${widget.sellerId}');
      if (productsResponse['success'] != false) {
        final List<dynamic> data = productsResponse['data'] ?? productsResponse['products'] ?? [];
        _products = data.map((json) => Product.fromJson(json)).toList();
        _totalProducts = _products.length;
      }

      // Load videos/reels
      try {
        final videosResponse = await _apiService.get('/videos?sellerId=${widget.sellerId}');
        if (videosResponse['success'] != false) {
          final List<dynamic> data = videosResponse['data'] ?? videosResponse['videos'] ?? [];
          _videos = data.map((json) => Video.fromJson(json)).toList();
        }
      } catch (e) {
        // Videos not available
      }

      // Load stories
      try {
        final storiesResponse = await _apiService.get('/stories');
        if (storiesResponse['success'] != false) {
          final List<dynamic> data = storiesResponse['data'] ?? [];
          for (var sellerStories in data) {
            if (sellerStories['sellerId'] == widget.sellerId) {
              final List<dynamic> stories = sellerStories['stories'] ?? [];
              _stories = stories.map((json) => Story.fromJson(json)).toList();
              break;
            }
          }
        }
      } catch (e) {
        // Stories not available
      }

      // Set random followers/following for demo
      _followers = 1000 + (DateTime.now().millisecond * 30);
      _following = 10 + (DateTime.now().millisecond ~/ 10);

      // Check subscription status
      try {
        final subResponse = await _apiService.get('/subscriptions/check/${widget.sellerId}');
        if (subResponse['success'] != false) {
          _isSubscribed = subResponse['data']?['isSubscribed'] ?? false;
        }
      } catch (e) {
        // Subscription check failed
      }
    } catch (e) {
      _error = e.toString();
    }

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _toggleSubscribe() async {
    setState(() => _isSubscribeLoading = true);
    try {
      if (_isSubscribed) {
        await _apiService.delete('/subscriptions/${widget.sellerId}');
        setState(() => _isSubscribed = false);
      } else {
        await _apiService.post('/subscriptions/${widget.sellerId}', {});
        setState(() => _isSubscribed = true);
      }
    } catch (e) {
      // Handle error
    }
    setState(() => _isSubscribeLoading = false);
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)} M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)} K';
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isOwnProfile = authProvider.user?.id == widget.sellerId || 
                         authProvider.user?.role == 'admin' ||
                         authProvider.user?.role == 'seller';

    return Scaffold(
      backgroundColor: Colors.black,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadSellerData,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                        child: Text(AppLocalizations.of(context)?.retry ?? 'Retry'),
                      ),
                    ],
                  ),
                )
              : NestedScrollView(
                  headerSliverBuilder: (context, innerBoxIsScrolled) {
                    return [
                      _buildSliverAppBar(),
                      SliverToBoxAdapter(child: _buildProfileSection(isOwnProfile)),
                      SliverToBoxAdapter(child: _buildStoryHighlights(isOwnProfile)),
                      SliverPersistentHeader(
                        pinned: true,
                        delegate: _SliverTabBarDelegate(
                          TabBar(
                            controller: _tabController,
                            indicatorColor: Colors.orange,
                            labelColor: Colors.orange,
                            unselectedLabelColor: Colors.grey,
                            tabs: const [
                              Tab(icon: Icon(Icons.grid_on)),
                              Tab(icon: Icon(Icons.play_arrow)),
                              Tab(icon: Icon(Icons.person_pin_outlined)),
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
                      _buildReelsGrid(),
                      _buildTaggedGrid(),
                    ],
                  ),
                ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildSliverAppBar() {
    final sellerUsername = _seller?.phone?.replaceAll('+998', '') ?? 'seller';
    return SliverAppBar(
      backgroundColor: Colors.black,
      pinned: true,
      title: Text(
        sellerUsername,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      ),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: Colors.white),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.more_horiz, color: Colors.white),
          onPressed: () {},
        ),
      ],
    );
  }

  Widget _buildProfileSection(bool isOwnProfile) {
    final sellerName = _seller?.fullName ?? 'Shop';
    final sellerUsername = _seller?.phone?.replaceAll('+998', '') ?? 'seller';

    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar and Stats Row
          Row(
            children: [
              // Avatar with gradient border
              Container(
                width: 86,
                height: 86,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFFFB923C), Color(0xFFF97316), Color(0xFFEA580C)],
                    begin: Alignment.topRight,
                    end: Alignment.bottomLeft,
                  ),
                ),
                padding: const EdgeInsets.all(3),
                child: Container(
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.black,
                  ),
                  padding: const EdgeInsets.all(2),
                  child: CircleAvatar(
                    radius: 38,
                    backgroundColor: Colors.grey[800],
                    backgroundImage: _seller?.avatar != null ? NetworkImage(_seller!.avatar!) : null,
                    child: _seller?.avatar == null
                        ? Text(
                            sellerName.isNotEmpty ? sellerName[0].toUpperCase() : 'S',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 24),
              // Stats
              Expanded(
                child: Column(
                  children: [
                    Text(
                      sellerName,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildStatColumn(_totalProducts.toString(), AppLocalizations.of(context)?.posts ?? 'posts'),
                        _buildStatColumn(_formatCount(_followers), AppLocalizations.of(context)?.followers ?? 'followers'),
                        _buildStatColumn(_following.toString(), AppLocalizations.of(context)?.following ?? 'following'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Bio
          Text(
            AppLocalizations.of(context)?.productService ?? 'Product/Service',
            style: const TextStyle(color: Colors.orange, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            '${AppLocalizations.of(context)?.qualityProducts ?? 'Quality products'}\nTelegram: @$sellerUsername\n${_seller?.phone ?? '+998 XX XXX XX XX'}',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
          const SizedBox(height: 16),
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _isSubscribeLoading ? null : _toggleSubscribe,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isSubscribed ? Colors.grey[800] : Colors.orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: _isSubscribeLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(_isSubscribed ? (AppLocalizations.of(context)?.following ?? 'Following') : (AppLocalizations.of(context)?.follow ?? 'Follow')),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[800],
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.message_outlined, size: 16),
                      const SizedBox(width: 4),
                      Text(AppLocalizations.of(context)?.message ?? 'Message'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: IconButton(
                  icon: const Icon(Icons.person_add_outlined, color: Colors.white, size: 20),
                  onPressed: () {},
                  padding: const EdgeInsets.all(8),
                  constraints: const BoxConstraints(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(color: Colors.grey[400], fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildStoryHighlights(bool isOwnProfile) {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: SizedBox(
        height: 100,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            // Add Story Button - Only for seller/admin
            if (isOwnProfile)
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: GestureDetector(
                  onTap: () {
                    Navigator.pushNamed(context, '/seller/add-video');
                  },
                  child: Column(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.grey[600]!, width: 2),
                          color: Colors.grey[900],
                        ),
                        child: const Center(
                          child: Icon(Icons.add, color: Colors.white, size: 28),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Builder(
                        builder: (context) => Text(
                          AppLocalizations.of(context)?.add ?? 'Add',
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            // Story Circles
            ..._stories.take(5).map((story) {
              final isViewed = _viewedStories.contains(story.id);
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: GestureDetector(
                  onTap: () => _markStoryAsViewed(story.id),
                  child: Column(
                    children: [
                      Container(
                        width: 68,
                        height: 68,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: isViewed
                              ? null
                              : const LinearGradient(
                                  colors: [Color(0xFFFB923C), Color(0xFFF97316), Color(0xFFEA580C)],
                                  begin: Alignment.topRight,
                                  end: Alignment.bottomLeft,
                                ),
                          color: isViewed ? Colors.grey[600] : null,
                        ),
                        padding: const EdgeInsets.all(2),
                        child: Container(
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.black,
                          ),
                          padding: const EdgeInsets.all(1),
                          child: CircleAvatar(
                            radius: 30,
                            backgroundImage: (story.thumbnailUrl ?? story.mediaUrl) != null 
                                ? NetworkImage(story.thumbnailUrl ?? story.mediaUrl!)
                                : null,
                            backgroundColor: Colors.grey[800],
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        width: 64,
                        child: Builder(
                          builder: (ctx) => Text(
                            story.title?.split(':').first ?? (AppLocalizations.of(ctx)?.story ?? 'Story'),
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            // Empty state
            if (_stories.isEmpty && !isOwnProfile)
              Center(
                child: Builder(
                  builder: (ctx) => Text(
                    AppLocalizations.of(ctx)?.noVideos ?? 'No stories',
                    style: const TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductsGrid() {
    if (_products.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.grid_on, size: 64, color: Colors.grey[600]),
            const SizedBox(height: 16),
            Builder(
              builder: (ctx) => Text(
                AppLocalizations.of(ctx)?.noProducts ?? 'No products',
                style: TextStyle(fontSize: 18, color: Colors.grey[500]),
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: _products.length,
      itemBuilder: (context, index) {
        final product = _products[index];
        return GestureDetector(
          onTap: () => Navigator.pushNamed(context, '/product/${product.id}'),
          child: Container(
            color: Colors.grey[900],
            child: product.images.isNotEmpty
                ? Image.network(
                    product.images.first,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: Colors.grey[800],
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
                  )
                : Container(
                    color: Colors.grey[800],
                    child: const Icon(Icons.image, color: Colors.grey),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildReelsGrid() {
    if (_videos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.play_arrow, size: 64, color: Colors.grey[600]),
            const SizedBox(height: 16),
            Builder(
              builder: (ctx) => Text(
                AppLocalizations.of(ctx)?.noVideos ?? 'No videos',
                style: TextStyle(fontSize: 18, color: Colors.grey[500]),
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 9 / 16,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: _videos.length,
      itemBuilder: (context, index) {
        final video = _videos[index];
        return GestureDetector(
          onTap: () => Navigator.pushNamed(context, '/video-feed'),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Container(
                color: Colors.grey[900],
                child: video.thumbnailUrl != null
                    ? Image.network(
                        video.thumbnailUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[800],
                          child: const Icon(Icons.play_arrow, color: Colors.grey),
                        ),
                      )
                    : Container(
                        color: Colors.grey[800],
                        child: const Icon(Icons.play_arrow, color: Colors.grey),
                      ),
              ),
              Positioned(
                bottom: 8,
                left: 8,
                child: Row(
                  children: [
                    const Icon(Icons.play_arrow, color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      _formatCount(video.viewCount),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTaggedGrid() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_pin_outlined, size: 64, color: Colors.grey[600]),
          const SizedBox(height: 16),
          Builder(
            builder: (ctx) => Text(
              AppLocalizations.of(ctx)?.noTaggedPosts ?? 'No tagged posts',
              style: TextStyle(fontSize: 18, color: Colors.grey[500]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        border: Border(top: BorderSide(color: Colors.grey[800]!)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              IconButton(
                icon: const Icon(Icons.home_outlined, color: Colors.grey),
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false),
              ),
              IconButton(
                icon: const Icon(Icons.play_arrow_outlined, color: Colors.grey),
                onPressed: () => Navigator.pushNamed(context, '/video-feed'),
              ),
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined, color: Colors.grey),
                onPressed: () => Navigator.pushNamed(context, '/cart'),
              ),
              IconButton(
                icon: const Icon(Icons.favorite_outline, color: Colors.grey),
                onPressed: () => Navigator.pushNamed(context, '/wishlist'),
              ),
              IconButton(
                icon: const Icon(Icons.person_outline, color: Colors.white),
                onPressed: () => Navigator.pushNamed(context, '/profile'),
              ),
            ],
          ),
        ),
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
      color: Colors.black,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
