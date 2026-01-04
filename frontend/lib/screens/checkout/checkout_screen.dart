import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/order.dart';
import '../../services/biometric_service.dart';
import '../../utils/currency_formatter.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _phoneController = TextEditingController();
  final _noteController = TextEditingController();
  
  PaymentMethod _selectedPaymentMethod = PaymentMethod.cash;
  bool _isPlacingOrder = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _phoneController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  String _getPaymentMethodString(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash: return 'cash';
      case PaymentMethod.card: return 'card';
      case PaymentMethod.payme: return 'payme';
      case PaymentMethod.click: return 'click';
    }
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    final cart = context.read<CartProvider>();
    if (cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your cart is empty'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedPaymentMethod != PaymentMethod.cash) {
      final authenticated = await BiometricService().authenticateForPayment();
      if (!authenticated) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Authentication required for payment'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
    }

    setState(() => _isPlacingOrder = true);

    try {
      final orderProvider = context.read<OrderProvider>();
      bool allOrdersPlaced = true;
      
      for (final item in cart.items) {
        final order = await orderProvider.createOrder({
          'productId': item.product.id,
          'quantity': item.quantity,
          'paymentMethod': _getPaymentMethodString(_selectedPaymentMethod),
          'shippingAddress': _addressController.text,
          'shippingCity': _cityController.text,
          'shippingPhone': _phoneController.text,
          if (_noteController.text.isNotEmpty) 'buyerNote': _noteController.text,
        });
        
        if (order == null) {
          allOrdersPlaced = false;
          break;
        }
      }

      if (!mounted) return;

      if (allOrdersPlaced) {
        cart.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order placed successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(orderProvider.error ?? 'Failed to place order'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isPlacingOrder = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cart, child) {
          if (cart.isEmpty) {
            return const Center(child: Text('Your cart is empty'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Order Items (${cart.totalQuantity})', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  ...cart.items.map((item) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: item.product.images.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                item.product.images.first,
                                width: 50,
                                height: 50,
                                fit: BoxFit.cover,
                                errorBuilder: (ctx, err, stack) => Container(
                                  width: 50,
                                  height: 50,
                                  color: AppColors.grey200,
                                  child: const Icon(Icons.image),
                                ),
                              ),
                            )
                          : Container(
                              width: 50,
                              height: 50,
                              color: AppColors.grey200,
                              child: const Icon(Icons.image),
                            ),
                      title: Text(item.product.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Text('Qty: ${item.quantity}'),
                      trailing: Text(
                        CurrencyFormatter.format(item.totalPrice),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  )),
                  const SizedBox(height: 24),
                  Text(
                    'Shipping Address',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(
                  labelText: 'Address',
                  hintText: 'Street, building, apartment',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
                maxLines: 2,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _cityController,
                decoration: const InputDecoration(
                  labelText: 'City',
                  prefixIcon: Icon(Icons.location_city_outlined),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your city';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _noteController,
                decoration: const InputDecoration(
                  labelText: 'Note (Optional)',
                  hintText: 'Any special instructions',
                  prefixIcon: Icon(Icons.note_outlined),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 32),
              Text(
                'Payment Method',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              _buildPaymentOption(
                PaymentMethod.cash,
                'Cash on Delivery',
                Icons.money,
              ),
              _buildPaymentOption(
                PaymentMethod.card,
                'Credit/Debit Card',
                Icons.credit_card,
              ),
              _buildPaymentOption(
                PaymentMethod.payme,
                'Payme',
                Icons.payment,
              ),
              _buildPaymentOption(
                PaymentMethod.click,
                'Click',
                Icons.touch_app,
              ),
              const SizedBox(height: 32),
              Text(
                'Order Summary',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              _buildSummaryRow('Subtotal', CurrencyFormatter.format(cart.subtotal)),
              _buildSummaryRow('Delivery Fee', CurrencyFormatter.format(cart.deliveryFee)),
              const Divider(),
              _buildSummaryRow('Total', CurrencyFormatter.format(cart.total), isTotal: true),
              const SizedBox(height: 100),
                ],
              ),
            ),
          );
        },
      ),
      bottomSheet: Consumer<CartProvider>(
        builder: (context, cart, child) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isPlacingOrder || cart.isEmpty ? null : _placeOrder,
                  child: _isPlacingOrder
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text('Place Order - ${CurrencyFormatter.format(cart.total)}'),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPaymentOption(PaymentMethod method, String title, IconData icon) {
    final isSelected = _selectedPaymentMethod == method;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppColors.primary : Colors.transparent,
          width: 2,
        ),
      ),
      child: ListTile(
        leading: Icon(icon, color: isSelected ? AppColors.primary : null),
        title: Text(title),
        trailing: isSelected
            ? const Icon(Icons.check_circle, color: AppColors.primary)
            : null,
        onTap: () {
          setState(() {
            _selectedPaymentMethod = method;
          });
        },
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: isTotal
                ? Theme.of(context).textTheme.titleMedium
                : Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            value,
            style: isTotal
                ? Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  )
                : Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
