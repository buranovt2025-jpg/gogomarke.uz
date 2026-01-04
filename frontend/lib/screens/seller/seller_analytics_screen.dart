import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/seller_provider.dart';

class SellerAnalyticsScreen extends StatefulWidget {
  const SellerAnalyticsScreen({super.key});

  @override
  State<SellerAnalyticsScreen> createState() => _SellerAnalyticsScreenState();
}

class _SellerAnalyticsScreenState extends State<SellerAnalyticsScreen> {
  String _selectedPeriod = '7d';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SellerProvider>().fetchSellerStats();
    });
  }

  Future<void> _refreshStats() async {
    await context.read<SellerProvider>().fetchSellerStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _selectedPeriod = value;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: '7d', child: Text('Last 7 days')),
              const PopupMenuItem(value: '30d', child: Text('Last 30 days')),
              const PopupMenuItem(value: '90d', child: Text('Last 90 days')),
              const PopupMenuItem(value: 'all', child: Text('All time')),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    _getPeriodLabel(_selectedPeriod),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ),
        ],
      ),
      body: Consumer<SellerProvider>(
        builder: (context, sellerProvider, child) {
          if (sellerProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final stats = sellerProvider.stats;

          return RefreshIndicator(
            onRefresh: _refreshStats,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildOverviewCards(stats),
                  const SizedBox(height: 24),
                  _buildSalesChart(stats),
                  const SizedBox(height: 24),
                  _buildPerformanceMetrics(stats),
                  const SizedBox(height: 24),
                  _buildTopProducts(sellerProvider),
                  const SizedBox(height: 24),
                  _buildRecentActivity(sellerProvider),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  String _getPeriodLabel(String period) {
    switch (period) {
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case '90d':
        return 'Last 90 days';
      case 'all':
        return 'All time';
      default:
        return 'Last 7 days';
    }
  }

  Widget _buildOverviewCards(SellerStats stats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Overview',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildOverviewCard(
                'Total Sales',
                '${_formatNumber(stats.totalSales)} UZS',
                Icons.attach_money,
                AppColors.success,
                '+12%',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildOverviewCard(
                'Orders',
                stats.totalOrders.toString(),
                Icons.shopping_bag,
                AppColors.primary,
                '+8%',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildOverviewCard(
                'Products',
                stats.totalProducts.toString(),
                Icons.inventory_2,
                Colors.purple,
                null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildOverviewCard(
                'Videos',
                stats.totalVideos.toString(),
                Icons.video_library,
                Colors.orange,
                null,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOverviewCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String? change,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                if (change != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      change,
                      style: const TextStyle(
                        color: AppColors.success,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.grey500,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSalesChart(SellerStats stats) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Sales Trend',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _getPeriodLabel(_selectedPeriod),
                  style: const TextStyle(
                    color: AppColors.grey500,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: _buildSimpleChart(),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildChartLegend('Sales', AppColors.primary),
                _buildChartLegend('Orders', AppColors.success),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleChart() {
    final List<double> salesData = [30, 45, 35, 60, 50, 70, 65];
    final maxValue = salesData.reduce((a, b) => a > b ? a : b);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(salesData.length, (index) {
        final height = (salesData[index] / maxValue) * 180;
        return Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Container(
              width: 32,
              height: height,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.8),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _getDayLabel(index),
              style: const TextStyle(
                color: AppColors.grey500,
                fontSize: 11,
              ),
            ),
          ],
        );
      }),
    );
  }

  String _getDayLabel(int index) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[index % 7];
  }

  Widget _buildChartLegend(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.grey600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildPerformanceMetrics(SellerStats stats) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Performance Metrics',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildMetricRow(
              'Average Rating',
              '${stats.rating.toStringAsFixed(1)} / 5.0',
              Icons.star,
              Colors.amber,
              stats.rating / 5.0,
            ),
            const Divider(height: 24),
            _buildMetricRow(
              'Order Completion Rate',
              '95%',
              Icons.check_circle,
              AppColors.success,
              0.95,
            ),
            const Divider(height: 24),
            _buildMetricRow(
              'Response Time',
              '< 2 hours',
              Icons.access_time,
              AppColors.primary,
              0.85,
            ),
            const Divider(height: 24),
            _buildMetricRow(
              'Customer Satisfaction',
              '4.8 / 5.0',
              Icons.sentiment_satisfied,
              Colors.orange,
              0.96,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(
    String label,
    String value,
    IconData icon,
    Color color,
    double progress,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.grey600,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppColors.grey200,
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                  minHeight: 6,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildTopProducts(SellerProvider sellerProvider) {
    final topProducts = sellerProvider.products.take(5).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Top Products',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/seller/products');
                  },
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (topProducts.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'No products yet',
                    style: TextStyle(color: AppColors.grey500),
                  ),
                ),
              )
            else
              ...topProducts.asMap().entries.map((entry) {
                final index = entry.key;
                final product = entry.value;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 24,
                        child: Text(
                          '#${index + 1}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: index < 3 ? AppColors.primary : AppColors.grey500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: product.images.isNotEmpty
                            ? Image.network(
                                product.images.first,
                                width: 48,
                                height: 48,
                                fit: BoxFit.cover,
                              )
                            : Container(
                                width: 48,
                                height: 48,
                                color: AppColors.grey200,
                                child: const Icon(Icons.image, color: AppColors.grey400),
                              ),
                      ),
                    ],
                  ),
                  title: Text(
                    product.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    '${product.price.toStringAsFixed(0)} UZS',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                                    trailing: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '${product.stock} in stock',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.star, size: 14, color: Colors.amber),
                                            Text(
                                              ' ${product.rating.toStringAsFixed(1)}',
                                              style: const TextStyle(
                                                color: AppColors.grey500,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivity(SellerProvider sellerProvider) {
    final recentOrders = sellerProvider.recentOrders.take(5).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Activity',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/seller/orders');
                  },
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (recentOrders.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'No recent activity',
                    style: TextStyle(color: AppColors.grey500),
                  ),
                ),
              )
            else
              ...recentOrders.map((order) {
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _getStatusColor(order.status.name).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getStatusIcon(order.status.name),
                      color: _getStatusColor(order.status.name),
                      size: 20,
                    ),
                  ),
                  title: Text(
                    'Order #${order.id.substring(0, 8)}',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  subtitle: Text(
                    _formatDate(order.createdAt),
                    style: const TextStyle(
                      color: AppColors.grey500,
                      fontSize: 12,
                    ),
                  ),
                  trailing: Text(
                    '${order.totalAmount.toStringAsFixed(0)} UZS',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return AppColors.warning;
      case 'confirmed':
      case 'processing':
        return Colors.blue;
      case 'shipped':
      case 'intransit':
        return Colors.purple;
      case 'delivered':
        return AppColors.success;
      case 'cancelled':
        return AppColors.error;
      default:
        return AppColors.grey500;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Icons.hourglass_empty;
      case 'confirmed':
      case 'processing':
        return Icons.check_circle_outline;
      case 'shipped':
      case 'intransit':
        return Icons.local_shipping;
      case 'delivered':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }

  String _formatNumber(double number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toStringAsFixed(0);
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        return '${diff.inMinutes} min ago';
      }
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
