import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/admin_provider.dart';

class AdminFinanceScreen extends StatefulWidget {
  const AdminFinanceScreen({super.key});

  @override
  State<AdminFinanceScreen> createState() => _AdminFinanceScreenState();
}

class _AdminFinanceScreenState extends State<AdminFinanceScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final provider = context.read<AdminProvider>();
    await provider.fetchStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Финансовый отчет')),
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) return const Center(child: CircularProgressIndicator());
          final stats = provider.stats;
          return RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    color: Colors.green[50],
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Общий доход платформы', style: TextStyle(fontSize: 14, color: Colors.grey)),
                          const SizedBox(height: 8),
                          Text('${stats.totalRevenue.toStringAsFixed(0)} сум', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.green)),
                          const SizedBox(height: 8),
                          const Text('Комиссия с продаж', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('Статистика заказов', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('Всего заказов', stats.totalOrders.toString(), Colors.blue)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Выполнено', stats.completedOrders.toString(), Colors.green)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('В ожидании', stats.pendingOrders.toString(), Colors.amber)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Товаров', stats.totalProducts.toString(), Colors.purple)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text('Пользователи', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildUserStatsCard(stats),
                  const SizedBox(height: 24),
                  const Text('Контент', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('Видео', stats.totalVideos.toString(), Colors.red)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Товары', stats.totalProducts.toString(), Colors.teal)),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildUserStatsCard(PlatformStats stats) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildUserRow('Всего пользователей', stats.totalUsers, Colors.blue),
            const Divider(),
            _buildUserRow('Покупатели', stats.totalBuyers, Colors.blue),
            const Divider(),
            _buildUserRow('Продавцы', stats.totalSellers, Colors.green),
            const Divider(),
            _buildUserRow('Курьеры', stats.totalCouriers, Colors.orange),
          ],
        ),
      ),
    );
  }

  Widget _buildUserRow(String title, int count, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 14)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
            child: Text(count.toString(), style: TextStyle(fontWeight: FontWeight.bold, color: color)),
          ),
        ],
      ),
    );
  }
}
