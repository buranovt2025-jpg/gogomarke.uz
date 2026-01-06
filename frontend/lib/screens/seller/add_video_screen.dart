import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/seller_provider.dart';
import '../../providers/product_provider.dart';
import '../../l10n/app_localizations.dart';

class AddVideoScreen extends StatefulWidget {
  const AddVideoScreen({super.key});

  @override
  State<AddVideoScreen> createState() => _AddVideoScreenState();
}

class _AddVideoScreenState extends State<AddVideoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _videoUrlController = TextEditingController();
  final _thumbnailUrlController = TextEditingController();
  
  String? _selectedProductId;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _videoUrlController.dispose();
    _thumbnailUrlController.dispose();
    super.dispose();
  }

  Future<void> _uploadVideo() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final sellerProvider = context.read<SellerProvider>();
      final success = await sellerProvider.createVideo({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'videoUrl': _videoUrlController.text.trim(),
        'thumbnailUrl': _thumbnailUrlController.text.trim().isNotEmpty 
            ? _thumbnailUrlController.text.trim() 
            : null,
        'productId': _selectedProductId,
      });

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video created successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(sellerProvider.error ?? 'Failed to create video'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n?.translate('add_video') ?? 'Add Video'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Video URL field
            TextFormField(
              controller: _videoUrlController,
              decoration: InputDecoration(
                labelText: l10n?.translate('video_url') ?? 'Video URL',
                hintText: 'https://example.com/video.mp4',
                prefixIcon: const Icon(Icons.video_library),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n?.translate('please_enter_video_url') ?? 'Please enter video URL';
                }
                if (!value.startsWith('http://') && !value.startsWith('https://')) {
                  return l10n?.translate('invalid_url') ?? 'Please enter a valid URL';
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // Thumbnail URL field
            TextFormField(
              controller: _thumbnailUrlController,
              decoration: InputDecoration(
                labelText: l10n?.translate('thumbnail_url') ?? 'Thumbnail URL (optional)',
                hintText: 'https://example.com/thumbnail.jpg',
                prefixIcon: const Icon(Icons.image),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Title field
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: l10n?.translate('title') ?? 'Title',
                hintText: l10n?.translate('enter_video_title') ?? 'Enter video title',
                prefixIcon: const Icon(Icons.title),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n?.translate('please_enter_title') ?? 'Please enter a title';
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // Description field
            TextFormField(
              controller: _descriptionController,
              decoration: InputDecoration(
                labelText: l10n?.translate('description') ?? 'Description',
                hintText: l10n?.translate('enter_video_description') ?? 'Enter video description',
                prefixIcon: const Icon(Icons.description),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              maxLines: 3,
            ),
            
            const SizedBox(height: 16),
            
            // Product selector
            Consumer<ProductProvider>(
              builder: (context, productProvider, child) {
                final products = productProvider.products;
                return DropdownButtonFormField<String>(
                  value: _selectedProductId,
                  decoration: InputDecoration(
                    labelText: l10n?.translate('link_product') ?? 'Link Product (optional)',
                    prefixIcon: const Icon(Icons.shopping_bag),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: [
                    DropdownMenuItem(
                      value: null,
                      child: Text(l10n?.translate('no_product') ?? 'No product'),
                    ),
                    ...products.map((product) => DropdownMenuItem(
                      value: product.id,
                      child: Text(
                        product.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    )),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedProductId = value;
                    });
                  },
                );
              },
            ),
            
            const SizedBox(height: 32),
            
            // Create button
            ElevatedButton(
              onPressed: _isUploading ? null : _uploadVideo,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isUploading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : Text(
                      l10n?.translate('create_video') ?? 'Create Video',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
