import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../config/theme.dart';

class ShopSettingsScreen extends StatefulWidget {
  const ShopSettingsScreen({super.key});

  @override
  State<ShopSettingsScreen> createState() => _ShopSettingsScreenState();
}

class _ShopSettingsScreenState extends State<ShopSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _shopNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _workingHoursController = TextEditingController();

  File? _logoImage;
  File? _bannerImage;
  bool _isLoading = false;
  bool _notificationsEnabled = true;
  bool _autoAcceptOrders = false;

  @override
  void initState() {
    super.initState();
    _loadShopSettings();
  }

  void _loadShopSettings() {
    _shopNameController.text = 'My Shop';
    _descriptionController.text = 'Welcome to my shop! We sell quality products.';
    _phoneController.text = '+998 90 123 45 67';
    _emailController.text = 'shop@example.com';
    _addressController.text = 'Tashkent, Uzbekistan';
    _workingHoursController.text = '09:00 - 18:00';
  }

  @override
  void dispose() {
    _shopNameController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _workingHoursController.dispose();
    super.dispose();
  }

  Future<void> _pickLogo() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _logoImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _pickBanner() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _bannerImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _saveSettings() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _isLoading = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Shop settings saved successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop Settings'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveSettings,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildBannerSection(),
              const SizedBox(height: 24),
              _buildLogoSection(),
              const SizedBox(height: 24),
              _buildBasicInfoSection(),
              const SizedBox(height: 24),
              _buildContactSection(),
              const SizedBox(height: 24),
              _buildPreferencesSection(),
              const SizedBox(height: 32),
              _buildDangerZone(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBannerSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Shop Banner',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickBanner,
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.grey200,
              borderRadius: BorderRadius.circular(12),
              image: _bannerImage != null
                  ? DecorationImage(
                      image: FileImage(_bannerImage!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: _bannerImage == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.add_photo_alternate,
                        size: 48,
                        color: AppColors.grey400,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Tap to add banner image',
                        style: TextStyle(color: AppColors.grey500),
                      ),
                      const Text(
                        'Recommended: 1200 x 400 px',
                        style: TextStyle(
                          color: AppColors.grey400,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  )
                : null,
          ),
        ),
      ],
    );
  }

  Widget _buildLogoSection() {
    return Row(
      children: [
        GestureDetector(
          onTap: _pickLogo,
          child: Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.grey200,
              shape: BoxShape.circle,
              image: _logoImage != null
                  ? DecorationImage(
                      image: FileImage(_logoImage!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: _logoImage == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.store,
                        size: 32,
                        color: AppColors.grey400,
                      ),
                      const Text(
                        'Logo',
                        style: TextStyle(
                          color: AppColors.grey500,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  )
                : null,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Shop Logo',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Upload a square image for best results',
                style: TextStyle(
                  color: AppColors.grey500,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: _pickLogo,
                child: const Text('Change Logo'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Basic Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _shopNameController,
              decoration: const InputDecoration(
                labelText: 'Shop Name',
                hintText: 'Enter your shop name',
                prefixIcon: Icon(Icons.store),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter shop name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Tell customers about your shop',
                prefixIcon: Icon(Icons.description),
                alignLabelWithHint: true,
              ),
              maxLines: 3,
              maxLength: 500,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _workingHoursController,
              decoration: const InputDecoration(
                labelText: 'Working Hours',
                hintText: 'e.g., 09:00 - 18:00',
                prefixIcon: Icon(Icons.access_time),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Contact Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                hintText: '+998 XX XXX XX XX',
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'shop@example.com',
                prefixIcon: Icon(Icons.email),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Address',
                hintText: 'Enter your shop address',
                prefixIcon: Icon(Icons.location_on),
              ),
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreferencesSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Preferences',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text('Order Notifications'),
              subtitle: const Text('Receive notifications for new orders'),
              value: _notificationsEnabled,
              onChanged: (value) {
                setState(() {
                  _notificationsEnabled = value;
                });
              },
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(),
            SwitchListTile(
              title: const Text('Auto-accept Orders'),
              subtitle: const Text('Automatically accept new orders'),
              value: _autoAcceptOrders,
              onChanged: (value) {
                setState(() {
                  _autoAcceptOrders = value;
                });
              },
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDangerZone() {
    return Card(
      color: AppColors.error.withValues(alpha: 0.05),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.warning, color: AppColors.error),
                SizedBox(width: 8),
                Text(
                  'Danger Zone',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.error,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Deactivate Shop'),
              subtitle: const Text('Temporarily hide your shop from customers'),
              trailing: OutlinedButton(
                onPressed: () {
                  _showDeactivateDialog();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.warning,
                  side: const BorderSide(color: AppColors.warning),
                ),
                child: const Text('Deactivate'),
              ),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Delete Shop'),
              subtitle: const Text('Permanently delete your shop and all data'),
              trailing: OutlinedButton(
                onPressed: () {
                  _showDeleteDialog();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                ),
                child: const Text('Delete'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeactivateDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Deactivate Shop'),
        content: const Text(
          'Are you sure you want to deactivate your shop? '
          'Customers will not be able to see your products until you reactivate.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Shop deactivated'),
                  backgroundColor: AppColors.warning,
                ),
              );
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.warning),
            child: const Text('Deactivate'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Shop'),
        content: const Text(
          'Are you sure you want to permanently delete your shop? '
          'This action cannot be undone and all your products, orders, and data will be lost.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Shop deleted'),
                  backgroundColor: AppColors.error,
                ),
              );
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
