import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/wallet.dart';
import '../../providers/wallet_provider.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<WalletProvider>();
      provider.fetchWallet();
      provider.fetchTransactions();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Wallet'),
      ),
      body: Consumer<WalletProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.wallet == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              await provider.fetchWallet();
              await provider.fetchTransactions();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  _buildBalanceCard(provider),
                  _buildActionButtons(context),
                  _buildTransactionsList(provider),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBalanceCard(WalletProvider provider) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFFFF6B00)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Available Balance',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            provider.wallet?.formattedBalance ?? '0 UZS',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.account_balance_wallet, color: Colors.white70, size: 16),
              const SizedBox(width: 8),
              Text(
                'Wallet ID: ${provider.wallet?.id.substring(0, 8) ?? 'N/A'}...',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildActionButton(
              icon: Icons.add,
              label: 'Top Up',
              onTap: () => _showTopUpDialog(context),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildActionButton(
              icon: Icons.arrow_upward,
              label: 'Withdraw',
              onTap: () => _showWithdrawDialog(context),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildActionButton(
              icon: Icons.history,
              label: 'History',
              onTap: () {
                // Already showing history below
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey200),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsList(WalletProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Transaction History',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        if (provider.transactions.isEmpty)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(
              child: Column(
                children: [
                  Icon(Icons.receipt_long, size: 48, color: AppColors.grey400),
                  SizedBox(height: 16),
                  Text(
                    'No transactions yet',
                    style: TextStyle(color: AppColors.grey500),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: provider.transactions.length,
            itemBuilder: (context, index) {
              final transaction = provider.transactions[index];
              return _buildTransactionItem(transaction);
            },
          ),
      ],
    );
  }

  Widget _buildTransactionItem(WalletTransaction transaction) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: (transaction.isCredit ? AppColors.success : AppColors.error).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              transaction.isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: transaction.isCredit ? AppColors.success : AppColors.error,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.typeLabel,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  transaction.description ?? '${transaction.formattedDate} ${transaction.formattedTime}',
                  style: const TextStyle(
                    color: AppColors.grey500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            transaction.formattedAmount,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: transaction.isCredit ? AppColors.success : AppColors.error,
            ),
          ),
        ],
      ),
    );
  }

  void _showTopUpDialog(BuildContext context) {
    final amountController = TextEditingController();
    String selectedMethod = 'card';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Top Up Wallet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount (UZS)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.money),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            StatefulBuilder(
              builder: (context, setState) => Column(
                children: [
                  _buildPaymentMethodTile('card', 'Bank Card', Icons.credit_card, selectedMethod, (value) {
                    setState(() => selectedMethod = value);
                  }),
                  _buildPaymentMethodTile('payme', 'Payme', Icons.payment, selectedMethod, (value) {
                    setState(() => selectedMethod = value);
                  }),
                  _buildPaymentMethodTile('click', 'Click', Icons.touch_app, selectedMethod, (value) {
                    setState(() => selectedMethod = value);
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(amountController.text);
                  if (amount == null || amount <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please enter a valid amount')),
                    );
                    return;
                  }
                  Navigator.pop(context);
                  final success = await context.read<WalletProvider>().topUp(amount, selectedMethod);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Top up successful!')),
                    );
                  }
                },
                child: const Text('Top Up'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodTile(String value, String label, IconData icon, String selectedMethod, Function(String) onChanged) {
    return RadioListTile<String>(
      value: value,
      groupValue: selectedMethod,
      onChanged: (v) => onChanged(v!),
      title: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
      contentPadding: EdgeInsets.zero,
    );
  }

  void _showWithdrawDialog(BuildContext context) {
    final amountController = TextEditingController();
    String selectedMethod = 'bank';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Withdraw Funds',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount (UZS)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.money),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Withdraw Method', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            StatefulBuilder(
              builder: (context, setState) => Column(
                children: [
                  _buildPaymentMethodTile('bank', 'Bank Transfer', Icons.account_balance, selectedMethod, (value) {
                    setState(() => selectedMethod = value);
                  }),
                  _buildPaymentMethodTile('card', 'Bank Card', Icons.credit_card, selectedMethod, (value) {
                    setState(() => selectedMethod = value);
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(amountController.text);
                  if (amount == null || amount <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please enter a valid amount')),
                    );
                    return;
                  }
                  Navigator.pop(context);
                  final success = await context.read<WalletProvider>().withdraw(amount, selectedMethod, null);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Withdrawal request submitted!')),
                    );
                  }
                },
                child: const Text('Withdraw'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
