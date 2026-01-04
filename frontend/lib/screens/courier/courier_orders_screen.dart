import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/order.dart';
import '../../providers/courier_provider.dart';

class CourierOrdersScreen extends StatefulWidget {
  const CourierOrdersScreen({super.key});

  @override
  State<CourierOrdersScreen> createState() => _CourierOrdersScreenState();
}

class _CourierOrdersScreenState extends State<CourierOrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<CourierProvider>();
      provider.fetchMyDeliveries();
      provider.fetchDeliveryHistory();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мои доставки'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Активные'),
            Tab(text: 'История'),
          ],
        ),
      ),
      body: Consumer<CourierProvider>(
        builder: (context, provider, child) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildActiveDeliveries(provider),
              _buildDeliveryHistory(provider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActiveDeliveries(CourierProvider provider) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (provider.myDeliveries.isEmpty) {
      return _buildEmptyState(Icons.local_shipping_outlined, 'Нет активных доставок', 'Примите заказ для начала доставки');
    }
    return RefreshIndicator(
      onRefresh: () => provider.fetchMyDeliveries(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: provider.myDeliveries.length,
        itemBuilder: (context, index) => _buildActiveOrderCard(provider.myDeliveries[index], provider),
      ),
    );
  }

  Widget _buildDeliveryHistory(CourierProvider provider) {
    if (provider.isLoading && provider.deliveryHistory.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (provider.deliveryHistory.isEmpty) {
      return _buildEmptyState(Icons.history, 'История пуста', 'Завершенные доставки появятся здесь');
    }
    return RefreshIndicator(
      onRefresh: () => provider.fetchDeliveryHistory(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: provider.deliveryHistory.length,
        itemBuilder: (context, index) => _buildHistoryOrderCard(provider.deliveryHistory[index]),
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: AppColors.grey400),
          const SizedBox(height: 16),
          Text(title, style: TextStyle(fontSize: 18, color: AppColors.grey500)),
          const SizedBox(height: 8),
          Text(subtitle, style: TextStyle(color: AppColors.grey400)),
        ],
      ),
    );
  }

  Widget _buildActiveOrderCard(Order order, CourierProvider provider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Заказ #${order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                  child: Text(_getStatusText(order.status), style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.w500, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(),
            _buildInfoRow(Icons.person, 'Покупатель', order.buyer?.fullName ?? 'Не указан'),
            _buildInfoRow(Icons.phone, 'Телефон', order.shippingPhone ?? 'Не указан'),
            _buildInfoRow(Icons.location_on, 'Адрес', order.shippingAddress ?? 'Не указан'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.phone), label: const Text('Позвонить'))),
                const SizedBox(width: 12),
                Expanded(child: ElevatedButton.icon(onPressed: () => _showDeliveryDialog(order, provider), icon: const Icon(Icons.check_circle), label: const Text('Доставлено'))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryOrderCard(Order order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(width: 50, height: 50, decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.check_circle, color: Colors.green)),
        title: Text('Заказ #${order.orderNumber}'),
        subtitle: Text(order.shippingAddress ?? 'Адрес не указан'),
        trailing: Text('+${order.courierFee.toStringAsFixed(0)} UZS', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [Icon(icon, size: 16, color: AppColors.grey500), const SizedBox(width: 8), Text('$label: ', style: TextStyle(color: AppColors.grey500, fontSize: 13)), Expanded(child: Text(value, style: const TextStyle(fontSize: 13)))]),
    );
  }

  String _getStatusText(OrderStatus status) {
    switch (status) {
      case OrderStatus.pickedUp: return 'Забран';
      case OrderStatus.inTransit: return 'В пути';
      case OrderStatus.delivered: return 'Доставлен';
      default: return status.name;
    }
  }

  Future<void> _showDeliveryDialog(Order order, CourierProvider provider) async {
    final codeController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Подтвердить доставку'),
        content: TextField(controller: codeController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Код доставки', border: OutlineInputBorder()), maxLength: 6),
        actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')), ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Подтвердить'))],
      ),
    );
    if (confirmed == true && codeController.text.isNotEmpty) {
      final success = await provider.confirmDelivery(order.id, deliveryCode: codeController.text);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success ? 'Доставка подтверждена!' : provider.error ?? 'Ошибка'), backgroundColor: success ? Colors.green : Colors.red));
    }
  }
}
