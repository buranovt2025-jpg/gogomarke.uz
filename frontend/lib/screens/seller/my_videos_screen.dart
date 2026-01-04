import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/video.dart';
import '../../providers/seller_provider.dart';

class MyVideosScreen extends StatefulWidget {
  const MyVideosScreen({super.key});

  @override
  State<MyVideosScreen> createState() => _MyVideosScreenState();
}

class _MyVideosScreenState extends State<MyVideosScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SellerProvider>().fetchSellerVideos();
    });
  }

  Future<void> _refreshVideos() async {
    await context.read<SellerProvider>().fetchSellerVideos();
  }

  void _deleteVideo(Video video) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Video'),
        content: Text('Are you sure you want to delete "${video.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final success = await context.read<SellerProvider>().deleteVideo(video.id);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video deleted successfully'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Videos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.pushNamed(context, '/seller/add-video');
            },
          ),
        ],
      ),
      body: Consumer<SellerProvider>(
        builder: (context, sellerProvider, child) {
          if (sellerProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (sellerProvider.videos.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: _refreshVideos,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: sellerProvider.videos.length,
              itemBuilder: (context, index) {
                return _buildVideoCard(sellerProvider.videos[index]);
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.pushNamed(context, '/seller/add-video');
        },
        icon: const Icon(Icons.video_call),
        label: const Text('Add Video'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.video_library_outlined,
            size: 80,
            color: AppColors.grey400,
          ),
          const SizedBox(height: 16),
          const Text(
            'No videos yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Upload your first video to start selling',
            style: TextStyle(color: AppColors.grey500),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pushNamed(context, '/seller/add-video');
            },
            icon: const Icon(Icons.video_call),
            label: const Text('Upload Video'),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoCard(Video video) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: video.thumbnailUrl != null
                    ? Image.network(
                        video.thumbnailUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.grey200,
                          child: const Icon(Icons.video_library, size: 48, color: AppColors.grey400),
                        ),
                      )
                    : Container(
                        color: AppColors.grey200,
                        child: const Icon(Icons.video_library, size: 48, color: AppColors.grey400),
                      ),
              ),
              Positioned(
                bottom: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _formatDuration(video.duration),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: _buildStatusBadge(video.isActive ? 'published' : 'draft'),
                            ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        video.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'edit') {
                          Navigator.pushNamed(context, '/seller/edit-video', arguments: video);
                        } else if (value == 'delete') {
                          _deleteVideo(video);
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit, size: 20),
                              SizedBox(width: 8),
                              Text('Edit'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete, size: 20, color: AppColors.error),
                              SizedBox(width: 8),
                              Text('Delete', style: TextStyle(color: AppColors.error)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildStatItem(Icons.visibility, '${video.viewCount}'),
                    const SizedBox(width: 16),
                    _buildStatItem(Icons.favorite, '${video.likeCount}'),
                    const SizedBox(width: 16),
                                        _buildStatItem(Icons.comment, '0'),
                                        const SizedBox(width: 16),
                                        _buildStatItem(Icons.share, '0'),
                  ],
                ),
                if (video.product != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.grey100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: video.product!.images.isNotEmpty
                              ? Image.network(
                                  video.product!.images.first,
                                  width: 40,
                                  height: 40,
                                  fit: BoxFit.cover,
                                )
                              : Container(
                                  width: 40,
                                  height: 40,
                                  color: AppColors.grey200,
                                  child: const Icon(Icons.image, size: 20),
                                ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                video.product!.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 12,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                '${video.product!.price.toStringAsFixed(0)} UZS',
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  'Uploaded ${_formatDate(video.createdAt)}',
                  style: const TextStyle(
                    color: AppColors.grey500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;
    switch (status.toLowerCase()) {
      case 'published':
        color = AppColors.success;
        text = 'Published';
        break;
      case 'processing':
        color = AppColors.warning;
        text = 'Processing';
        break;
      case 'draft':
        color = AppColors.grey500;
        text = 'Draft';
        break;
      case 'rejected':
        color = AppColors.error;
        text = 'Rejected';
        break;
      default:
        color = AppColors.grey500;
        text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.grey500),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.grey600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        return '${diff.inMinutes} min ago';
      }
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
