import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/admin_provider.dart';
import '../../models/order.dart';

class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  String? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    final provider = context.read<AdminProvider>();
    await provider.fetchOrders(status: _selectedStatus);
  }

  String _getStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending: return 'Ожидает';
      case OrderStatus.confirmed: return 'Подтвержден';
      case OrderStatus.pickedUp: return 'Забран';
      case OrderStatus.inTransit: return 'В пути';
      case OrderStatus.delivered: return 'Доставлен';
      case OrderStatus.cancelled: return 'Отменен';
      case OrderStatus.disputed: return 'Спор';
    }
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending: return Colors.amber;
      case OrderStatus.confirmed: return Colors.blue;
      case OrderStatus.pickedUp: return Colors.orange;
      case OrderStatus.inTransit: return Colors.purple;
      case OrderStatus.delivered: return Colors.green;
      case OrderStatus.cancelled: return Colors.red;
      case OrderStatus.disputed: return Colors.deepOrange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Все заказы')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip(null, 'Все'),
                  const SizedBox(width: 8),
                  _buildFilterChip('pending', 'Ожидают'),
                  const SizedBox(width: 8),
                  _buildFilterChip('confirmed', 'Подтверждены'),
                  const SizedBox(width: 8),
                  _buildFilterChip('in_transit', 'В пути'),
                  const SizedBox(width: 8),
                  _buildFilterChip('delivered', 'Доставлены'),
                  const SizedBox(width: 8),
                  _buildFilterChip('cancelled', 'Отменены'),
                ],
              ),
            ),
          ),
          Expanded(
            child: Consumer<AdminProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) return const Center(child: CircularProgressIndicator());
                if (provider.orders.isEmpty) return const Center(child: Text('Заказы не найдены'));
                return RefreshIndicator(
                  onRefresh: _loadOrders,
                  child: ListView.builder(
                    itemCount: provider.orders.length,
                    itemBuilder: (context, index) {
                      final order = provider.orders[index];
                      return _buildOrderCard(order);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String? status, String label) {
    return FilterChip(
      label: Text(label),
      selected: _selectedStatus == status,
      onSelected: (selected) { setState(() { _selectedStatus = selected ? status : null; }); _loadOrders(); },
    );
  }

  Widget _buildOrderCard(Order order) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('#${order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(_getStatusLabel(order.status), style: TextStyle(color: _getStatusColor(order.status), fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (order.product != null) ...[
              Text(order.product!.title, style: const TextStyle(fontWeight: FontWeight.w500)),
              const SizedBox(height: 4),
            ],
            Row(
              children: [
                const Icon(Icons.person_outline, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text('Покупатель: ${order.buyer?.fullName ?? order.buyer?.phone ?? "N/A"}', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.store_outlined, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text('Продавец: ${order.seller?.fullName ?? order.seller?.phone ?? "N/A"}', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${order.totalAmount.toStringAsFixed(0)} сум', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green)),
                Text(_formatDate(order.createdAt), style: TextStyle(color: Colors.grey[500], fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}
