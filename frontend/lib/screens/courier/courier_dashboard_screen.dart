import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/courier_provider.dart';

class CourierDashboardScreen extends StatefulWidget {
  const CourierDashboardScreen({super.key});

  @override
  State<CourierDashboardScreen> createState() => _CourierDashboardScreenState();
}

class _CourierDashboardScreenState extends State<CourierDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<CourierProvider>();
      provider.fetchCourierStats();
      provider.fetchMyDeliveries();
      provider.fetchAvailableOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Панель курьера'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () {
            final provider = context.read<CourierProvider>();
            provider.fetchCourierStats();
            provider.fetchMyDeliveries();
          }),
        ],
      ),
      body: Consumer<CourierProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          return RefreshIndicator(
            onRefresh: () async {
              await provider.fetchCourierStats();
              await provider.fetchMyDeliveries();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsRow(context, provider),
                  const SizedBox(height: 24),
                  _buildQuickActions(context),
                  const SizedBox(height: 24),
                  _buildEarningsCard(context, provider),
                  const SizedBox(height: 24),
                  Text('Активные доставки', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),
                  _buildActiveDeliveries(provider),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/courier/available-orders'),
        icon: const Icon(Icons.add),
        label: const Text('Новые заказы'),
      ),
    );
  }

  Widget _buildStatsRow(BuildContext context, CourierProvider provider) {
    return Row(
      children: [
        Expanded(child: _buildStatCard(context, 'Сегодня', '${provider.stats.completedToday}', Icons.today, Colors.blue)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(context, 'Всего', '${provider.stats.totalDeliveries}', Icons.local_shipping, AppColors.primary)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(context, 'Рейтинг', provider.stats.rating.toStringAsFixed(1), Icons.star, Colors.amber)),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            Text(title, style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(context, 'Доступные заказы', Icons.list_alt, () => Navigator.pushNamed(context, '/courier/available-orders')),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(context, 'Мои доставки', Icons.local_shipping, () => Navigator.pushNamed(context, '/courier/orders')),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(context, 'Заработок', Icons.account_balance_wallet, () => Navigator.pushNamed(context, '/courier/earnings')),
        ),
      ],
    );
  }

  Widget _buildActionButton(BuildContext context, String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningsCard(BuildContext context, CourierProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Заработок', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                TextButton(onPressed: () => Navigator.pushNamed(context, '/courier/earnings'), child: const Text('Подробнее')),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Сегодня', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
                      Text('${_formatPrice(provider.stats.todayEarnings)} UZS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
                  ),
                ),
                Container(width: 1, height: 40, color: AppColors.grey300),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Доступно', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
                        Text('${_formatPrice(provider.stats.availableBalance)} UZS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveDeliveries(CourierProvider provider) {
    if (provider.myDeliveries.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.local_shipping_outlined, size: 80, color: AppColors.grey400),
              const SizedBox(height: 16),
              Text('Нет активных доставок', style: TextStyle(color: AppColors.grey500)),
              const SizedBox(height: 8),
              ElevatedButton(onPressed: () => Navigator.pushNamed(context, '/courier/available-orders'), child: const Text('Найти заказы')),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: provider.myDeliveries.length > 3 ? 3 : provider.myDeliveries.length,
      itemBuilder: (context, index) {
        final order = provider.myDeliveries[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Container(width: 50, height: 50, decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.local_shipping, color: Colors.orange)),
            title: Text('Заказ #${order.orderNumber}'),
            subtitle: Text(order.shippingAddress ?? 'Адрес не указан', maxLines: 1, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.pushNamed(context, '/courier/orders'),
          ),
        );
      },
    );
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ');
  }
}
