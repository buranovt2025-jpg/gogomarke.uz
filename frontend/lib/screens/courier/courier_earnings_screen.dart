import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/courier_provider.dart';

class CourierEarningsScreen extends StatefulWidget {
  const CourierEarningsScreen({super.key});

  @override
  State<CourierEarningsScreen> createState() => _CourierEarningsScreenState();
}

class _CourierEarningsScreenState extends State<CourierEarningsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CourierProvider>().fetchCourierStats();
      context.read<CourierProvider>().fetchDeliveryHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Мой заработок')),
      body: Consumer<CourierProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildBalanceCard(context, provider),
                const SizedBox(height: 24),
                _buildStatsCards(context, provider),
                const SizedBox(height: 24),
                Text('История доставок', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                _buildDeliveryHistory(provider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBalanceCard(BuildContext context, CourierProvider provider) {
    return Card(
      color: AppColors.primary,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Доступный баланс', style: TextStyle(color: Colors.white70, fontSize: 14)),
            const SizedBox(height: 8),
            Text('${_formatPrice(provider.stats.availableBalance)} UZS', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('В ожидании', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('${_formatPrice(provider.stats.pendingBalance)} UZS', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Всего заработано', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('${_formatPrice(provider.stats.totalEarnings)} UZS', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: provider.stats.availableBalance >= 50000 ? () => _showWithdrawDialog(context, provider) : null,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary),
                child: const Text('Вывести средства'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCards(BuildContext context, CourierProvider provider) {
    return Row(
      children: [
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(Icons.today, color: Colors.blue, size: 32),
                  const SizedBox(height: 8),
                  Text('${_formatPrice(provider.stats.todayEarnings)} UZS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('Сегодня', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(Icons.local_shipping, color: Colors.green, size: 32),
                  const SizedBox(height: 8),
                  Text('${provider.stats.totalDeliveries}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('Доставок', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDeliveryHistory(CourierProvider provider) {
    if (provider.deliveryHistory.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.history, size: 80, color: AppColors.grey400),
              const SizedBox(height: 16),
              Text('История пуста', style: TextStyle(color: AppColors.grey500)),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: provider.deliveryHistory.length,
      itemBuilder: (context, index) {
        final order = provider.deliveryHistory[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.check_circle, color: Colors.green, size: 20),
            ),
            title: Text('Заказ #${order.orderNumber}'),
            subtitle: Text(_formatDate(order.deliveredAt), style: TextStyle(color: AppColors.grey500, fontSize: 12)),
            trailing: Text('+${_formatPrice(order.courierFee)} UZS', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
          ),
        );
      },
    );
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ');
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.day}.${date.month}.${date.year}';
  }

  Future<void> _showWithdrawDialog(BuildContext context, CourierProvider provider) async {
    final amountController = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Вывод средств'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Доступно: ${_formatPrice(provider.stats.availableBalance)} UZS'),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Сумма вывода', border: OutlineInputBorder(), suffixText: 'UZS'),
            ),
            const SizedBox(height: 8),
            Text('Минимальная сумма: 50 000 UZS', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Заявка на вывод отправлена'), backgroundColor: Colors.green));
            },
            child: const Text('Вывести'),
          ),
        ],
      ),
    );
  }
}
