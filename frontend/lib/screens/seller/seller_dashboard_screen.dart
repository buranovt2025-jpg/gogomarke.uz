import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/order.dart';
import '../../providers/seller_provider.dart';
import 'add_product_screen.dart';
import 'my_products_screen.dart';
import 'my_videos_screen.dart';
import 'seller_analytics_screen.dart';
import 'seller_orders_screen.dart';
import 'shop_settings_screen.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({super.key});

  @override
  State<SellerDashboardScreen> createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final sellerProvider = context.read<SellerProvider>();
    await Future.wait([
      sellerProvider.fetchSellerStats(),
      sellerProvider.fetchSellerProducts(),
      sellerProvider.fetchRecentOrders(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          'Seller Dashboard',
          style: TextStyle(
            color: AppColors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: const IconThemeData(color: AppColors.black),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: Consumer<SellerProvider>(
          builder: (context, sellerProvider, child) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsGrid(context, sellerProvider),
                  const SizedBox(height: 24),
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildQuickActions(context),
                  const SizedBox(height: 24),
                  _buildMenuSection(context),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Orders',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const SellerOrdersScreen()),
                          );
                        },
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildRecentOrders(sellerProvider),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, SellerProvider sellerProvider) {
    final stats = sellerProvider.stats;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                'Total Sales',
                '${_formatNumber(stats.totalSales)} UZS',
                Icons.attach_money,
                AppColors.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                'Orders',
                stats.totalOrders.toString(),
                Icons.shopping_bag,
                Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                'Products',
                stats.totalProducts.toString(),
                Icons.inventory,
                Colors.purple,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                'Pending',
                stats.pendingOrders.toString(),
                Icons.pending_actions,
                AppColors.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                'Rating',
                stats.rating > 0 ? stats.rating.toStringAsFixed(1) : '-',
                Icons.star,
                Colors.amber,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                'Followers',
                stats.followers.toString(),
                Icons.people,
                Colors.teal,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.grey500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildPrimaryActionButton(
            context,
            'Add Product',
            Icons.add_box_outlined,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AddProductScreen()),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildPrimaryActionButton(
            context,
            'Withdraw',
            Icons.account_balance_wallet_outlined,
            () => Navigator.pushNamed(context, '/wallet'),
          ),
        ),
      ],
    );
  }

  Widget _buildMenuSection(BuildContext context) {
    return Column(
      children: [
        _buildMenuItem(
          context,
          icon: Icons.inventory_2_outlined,
          title: 'My Products',
          subtitle: 'Manage your products',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MyProductsScreen()),
            );
          },
        ),
        _buildMenuItem(
          context,
          icon: Icons.receipt_long_outlined,
          title: 'Orders',
          subtitle: 'View and manage orders',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SellerOrdersScreen()),
            );
          },
        ),
        _buildMenuItem(
          context,
          icon: Icons.video_library_outlined,
          title: 'My Videos',
          subtitle: 'Manage your video content',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MyVideosScreen()),
            );
          },
        ),
        _buildMenuItem(
          context,
          icon: Icons.analytics_outlined,
          title: 'Analytics',
          subtitle: 'View sales statistics',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SellerAnalyticsScreen()),
            );
          },
        ),
        _buildMenuItem(
          context,
          icon: Icons.store_outlined,
          title: 'Shop Settings',
          subtitle: 'Edit shop profile',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ShopSettingsScreen()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _buildPrimaryActionButton(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.white, size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.white,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrders(SellerProvider sellerProvider) {
    if (sellerProvider.recentOrders.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.grey400),
                SizedBox(height: 8),
                Text(
                  'No recent orders',
                  style: TextStyle(color: AppColors.grey500),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      children: sellerProvider.recentOrders.take(3).map((order) {
        return _buildOrderItem(order);
      }).toList(),
    );
  }

  Widget _buildOrderItem(Order order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
                    child: order.product != null && order.product!.images.isNotEmpty
                        ? Image.network(
                            order.product!.images.first,
                  width: 50,
                  height: 50,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 50,
                      height: 50,
                      color: AppColors.grey200,
                      child: const Icon(Icons.image, color: AppColors.grey400),
                    );
                  },
                )
              : Container(
                  width: 50,
                  height: 50,
                  color: AppColors.grey200,
                  child: const Icon(Icons.image, color: AppColors.grey400),
                ),
        ),
        title: Text(
          order.product?.title ?? 'Order #${order.id.substring(0, 8)}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${order.totalAmount.toStringAsFixed(0)} UZS',
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: _buildStatusChip(order.status.name),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'pending':
        color = AppColors.warning;
        break;
      case 'processing':
        color = Colors.blue;
        break;
      case 'shipped':
        color = Colors.purple;
        break;
      case 'delivered':
        color = AppColors.success;
        break;
      case 'cancelled':
        color = AppColors.error;
        break;
      default:
        color = AppColors.grey500;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _formatNumber(double number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toStringAsFixed(0);
  }
}
