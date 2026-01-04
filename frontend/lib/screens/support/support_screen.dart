import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/support_provider.dart';
import '../../models/support_ticket.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SupportProvider>().fetchTickets();
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
        title: const Text('Support'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Open'),
            Tab(text: 'Closed'),
          ],
        ),
      ),
      body: Consumer<SupportProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.tickets.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildTicketList(provider.openTickets, 'No open tickets'),
              _buildTicketList(provider.closedTickets, 'No closed tickets'),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateTicketDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Widget _buildTicketList(List<SupportTicket> tickets, String emptyMessage) {
    if (tickets.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.support_agent, size: 80, color: AppColors.grey400),
            const SizedBox(height: 16),
            Text(emptyMessage, style: const TextStyle(fontSize: 18, color: AppColors.grey600)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<SupportProvider>().fetchTickets(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: tickets.length,
        itemBuilder: (context, index) {
          final ticket = tickets[index];
          return _buildTicketCard(ticket);
        },
      ),
    );
  }

  Widget _buildTicketCard(SupportTicket ticket) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(ticket.status).withOpacity(0.1),
          child: Icon(
            _getCategoryIcon(ticket.category),
            color: _getStatusColor(ticket.status),
          ),
        ),
        title: Text(
          ticket.subject,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              ticket.categoryLabel,
              style: const TextStyle(color: AppColors.grey500),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(ticket.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    ticket.statusLabel,
                    style: TextStyle(
                      fontSize: 12,
                      color: _getStatusColor(ticket.status),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  ticket.formattedDate,
                  style: const TextStyle(fontSize: 12, color: AppColors.grey500),
                ),
              ],
            ),
          ],
        ),
        isThreeLine: true,
        onTap: () {
          Navigator.pushNamed(context, '/support/${ticket.id}');
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'open':
        return AppColors.primary;
      case 'in_progress':
        return Colors.blue;
      case 'resolved':
        return AppColors.success;
      case 'closed':
        return AppColors.grey500;
      default:
        return AppColors.grey500;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'order':
        return Icons.shopping_bag;
      case 'payment':
        return Icons.payment;
      case 'delivery':
        return Icons.local_shipping;
      case 'product':
        return Icons.inventory;
      case 'account':
        return Icons.person;
      default:
        return Icons.help;
    }
  }

  void _showCreateTicketDialog(BuildContext context) {
    final subjectController = TextEditingController();
    final descriptionController = TextEditingController();
    String selectedCategory = 'other';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Create Support Ticket',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'order', child: Text('Order Issue')),
                DropdownMenuItem(value: 'payment', child: Text('Payment')),
                DropdownMenuItem(value: 'delivery', child: Text('Delivery')),
                DropdownMenuItem(value: 'product', child: Text('Product')),
                DropdownMenuItem(value: 'account', child: Text('Account')),
                DropdownMenuItem(value: 'other', child: Text('Other')),
              ],
              onChanged: (value) => selectedCategory = value ?? 'other',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: subjectController,
              decoration: const InputDecoration(
                labelText: 'Subject',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (subjectController.text.isEmpty || descriptionController.text.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please fill all fields')),
                    );
                    return;
                  }
                  
                  final success = await context.read<SupportProvider>().createTicket(
                    subject: subjectController.text,
                    description: descriptionController.text,
                    category: selectedCategory,
                  );
                  
                  if (success && context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ticket created successfully')),
                    );
                  }
                },
                child: const Text('Submit'),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
