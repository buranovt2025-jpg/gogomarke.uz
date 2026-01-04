import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/seller_provider.dart';

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});

  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();

  String _selectedMethod = 'card';
  bool _isLoading = false;
  double _availableBalance = 1500000;
  double _pendingBalance = 250000;

  final List<Map<String, dynamic>> _withdrawHistory = [
    {
      'id': '1',
      'amount': 500000,
      'method': 'card',
      'status': 'completed',
      'date': DateTime.now().subtract(const Duration(days: 2)),
      'cardLast4': '4532',
    },
    {
      'id': '2',
      'amount': 300000,
      'method': 'card',
      'status': 'pending',
      'date': DateTime.now().subtract(const Duration(days: 1)),
      'cardLast4': '4532',
    },
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    super.dispose();
  }

  Future<void> _submitWithdraw() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.tryParse(_amountController.text) ?? 0;
    if (amount > _availableBalance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Insufficient balance'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
      _availableBalance -= amount;
      _pendingBalance += amount;
      _withdrawHistory.insert(0, {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'amount': amount,
        'method': _selectedMethod,
        'status': 'pending',
        'date': DateTime.now(),
        'cardLast4': _cardNumberController.text.substring(_cardNumberController.text.length - 4),
      });
      _amountController.clear();
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Withdrawal request submitted successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Withdraw'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBalanceCards(),
            const SizedBox(height: 24),
            _buildWithdrawForm(),
            const SizedBox(height: 24),
            _buildWithdrawHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCards() {
    return Row(
      children: [
        Expanded(
          child: Card(
            color: AppColors.primary,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.account_balance_wallet, color: Colors.white, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Available',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_formatNumber(_availableBalance)} UZS',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.hourglass_empty, color: AppColors.warning, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Pending',
                        style: TextStyle(
                          color: AppColors.grey500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_formatNumber(_pendingBalance)} UZS',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildWithdrawForm() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Withdraw Funds',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Withdrawal Method',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: AppColors.grey600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildMethodOption(
                      'card',
                      'Bank Card',
                      Icons.credit_card,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMethodOption(
                      'payme',
                      'Payme',
                      Icons.payment,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMethodOption(
                      'click',
                      'Click',
                      Icons.touch_app,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: InputDecoration(
                  labelText: 'Amount',
                  hintText: 'Enter amount to withdraw',
                  prefixIcon: const Icon(Icons.attach_money),
                  suffixText: 'UZS',
                  helperText: 'Min: 50,000 UZS | Max: ${_formatNumber(_availableBalance)} UZS',
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter amount';
                  }
                  final amount = double.tryParse(value);
                  if (amount == null || amount < 50000) {
                    return 'Minimum withdrawal is 50,000 UZS';
                  }
                  if (amount > _availableBalance) {
                    return 'Insufficient balance';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              if (_selectedMethod == 'card') ...[
                TextFormField(
                  controller: _cardNumberController,
                  decoration: const InputDecoration(
                    labelText: 'Card Number',
                    hintText: '8600 XXXX XXXX XXXX',
                    prefixIcon: Icon(Icons.credit_card),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 16,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter card number';
                    }
                    if (value.length < 16) {
                      return 'Invalid card number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _cardHolderController,
                  decoration: const InputDecoration(
                    labelText: 'Card Holder Name',
                    hintText: 'Enter name as on card',
                    prefixIcon: Icon(Icons.person),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter card holder name';
                    }
                    return null;
                  },
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitWithdraw,
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Withdraw'),
                ),
              ),
              const SizedBox(height: 12),
              const Center(
                child: Text(
                  'Withdrawals are processed within 1-3 business days',
                  style: TextStyle(
                    color: AppColors.grey500,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMethodOption(String value, String label, IconData icon) {
    final isSelected = _selectedMethod == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedMethod = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.grey100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.grey300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.grey500,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppColors.primary : AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWithdrawHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Withdrawal History',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        if (_withdrawHistory.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.history,
                      size: 48,
                      color: AppColors.grey400,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'No withdrawal history',
                      style: TextStyle(color: AppColors.grey500),
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          ...(_withdrawHistory.map((item) => _buildHistoryItem(item))),
      ],
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> item) {
    final status = item['status'] as String;
    final statusColor = status == 'completed'
        ? AppColors.success
        : status == 'pending'
            ? AppColors.warning
            : AppColors.error;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            status == 'completed'
                ? Icons.check_circle
                : status == 'pending'
                    ? Icons.hourglass_empty
                    : Icons.cancel,
            color: statusColor,
          ),
        ),
        title: Text(
          '${_formatNumber(item['amount'] as double)} UZS',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Card ending in ${item['cardLast4']}',
              style: const TextStyle(fontSize: 12),
            ),
            Text(
              _formatDate(item['date'] as DateTime),
              style: const TextStyle(
                color: AppColors.grey500,
                fontSize: 11,
              ),
            ),
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            status.toUpperCase(),
            style: TextStyle(
              color: statusColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        isThreeLine: true,
      ),
    );
  }

  String _formatNumber(double number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(0)}K';
    }
    return number.toStringAsFixed(0);
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
