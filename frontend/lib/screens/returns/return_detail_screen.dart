import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/return_provider.dart';

class ReturnDetailScreen extends StatefulWidget {
  final String returnId;

  const ReturnDetailScreen({super.key, required this.returnId});

  @override
  State<ReturnDetailScreen> createState() => _ReturnDetailScreenState();
}

class _ReturnDetailScreenState extends State<ReturnDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReturnProvider>().fetchReturnDetails(widget.returnId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Return Details'),
        actions: [
          Consumer<ReturnProvider>(
            builder: (context, provider, child) {
              final returnRequest = provider.currentReturn;
              if (returnRequest == null || !returnRequest.canCancel) {
                return const SizedBox.shrink();
              }
              return IconButton(
                icon: const Icon(Icons.cancel_outlined),
                onPressed: () => _showCancelDialog(context),
                tooltip: 'Cancel Return',
              );
            },
          ),
        ],
      ),
      body: Consumer<ReturnProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.currentReturn == null) {
            return const Center(child: CircularProgressIndicator());
          }

          final returnRequest = provider.currentReturn;
          if (returnRequest == null) {
            return const Center(child: Text('Return request not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatusCard(returnRequest),
                const SizedBox(height: 16),
                _buildProductCard(returnRequest),
                const SizedBox(height: 16),
                _buildReasonCard(returnRequest),
                if (returnRequest.images.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _buildImagesCard(returnRequest),
                ],
                if (returnRequest.adminResponse != null) ...[
                  const SizedBox(height: 16),
                  _buildAdminResponseCard(returnRequest),
                ],
                const SizedBox(height: 16),
                _buildRefundCard(returnRequest),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(dynamic returnRequest) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _getStatusColor(returnRequest.status).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getStatusIcon(returnRequest.status),
                color: _getStatusColor(returnRequest.status),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    returnRequest.statusLabel,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(returnRequest.status),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Created on ${returnRequest.formattedDate}',
                    style: const TextStyle(color: AppColors.grey600),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(dynamic returnRequest) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Product',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (returnRequest.product?.images.isNotEmpty ?? false)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      returnRequest.product!.images.first,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 80,
                        height: 80,
                        color: AppColors.grey200,
                        child: const Icon(Icons.image, color: AppColors.grey400),
                      ),
                    ),
                  )
                else
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.image, color: AppColors.grey400),
                  ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        returnRequest.product?.title ?? 'Product #${returnRequest.productId}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Order #${returnRequest.orderId}',
                        style: const TextStyle(
                          color: AppColors.grey600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReasonCard(dynamic returnRequest) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Reason for Return',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.grey100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                returnRequest.reasonLabel,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.grey700,
                ),
              ),
            ),
            if (returnRequest.description.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                returnRequest.description,
                style: const TextStyle(color: AppColors.grey600),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildImagesCard(dynamic returnRequest) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Attached Images',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: returnRequest.images.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: EdgeInsets.only(right: index < returnRequest.images.length - 1 ? 8 : 0),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        returnRequest.images[index],
                        width: 100,
                        height: 100,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 100,
                          height: 100,
                          color: AppColors.grey200,
                          child: const Icon(Icons.image, color: AppColors.grey400),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminResponseCard(dynamic returnRequest) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.support_agent, color: AppColors.primary),
                const SizedBox(width: 8),
                const Text(
                  'Admin Response',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              returnRequest.adminResponse!,
              style: const TextStyle(color: AppColors.grey700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRefundCard(dynamic returnRequest) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Refund Information',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Refund Method:', style: TextStyle(color: AppColors.grey600)),
                Text(
                  returnRequest.refundMethodLabel,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Refund Amount:', style: TextStyle(color: AppColors.grey600)),
                Text(
                  '${returnRequest.refundAmount.toStringAsFixed(0)} UZS',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return AppColors.warning;
      case 'approved':
        return AppColors.success;
      case 'rejected':
        return AppColors.error;
      case 'processing':
        return Colors.blue;
      case 'completed':
        return AppColors.success;
      case 'cancelled':
        return AppColors.grey500;
      default:
        return AppColors.grey500;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.hourglass_empty;
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'processing':
        return Icons.sync;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.block;
      default:
        return Icons.help_outline;
    }
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Return'),
        content: const Text('Are you sure you want to cancel this return request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await context.read<ReturnProvider>().cancelReturn(widget.returnId);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Return request cancelled')),
                );
              }
            },
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }
}
