import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../config/theme.dart';
import '../models/video.dart';
import '../providers/follow_provider.dart';
import '../providers/video_interaction_provider.dart';
import '../utils/currency_formatter.dart';

class VideoPlayerItem extends StatefulWidget {
  final Video video;
  final bool isActive;

  const VideoPlayerItem({
    super.key,
    required this.video,
    this.isActive = false,
  });

  @override
  State<VideoPlayerItem> createState() => _VideoPlayerItemState();
}

class _VideoPlayerItemState extends State<VideoPlayerItem> {
  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        _buildVideoPlayer(),
        _buildGradientOverlay(),
        _buildVideoInfo(),
        _buildActionButtons(),
        if (widget.video.product != null) _buildProductOverlay(),
      ],
    );
  }

  Widget _buildVideoPlayer() {
    if (widget.video.thumbnailUrl != null) {
      return CachedNetworkImage(
        imageUrl: widget.video.thumbnailUrl!,
        fit: BoxFit.cover,
        placeholder: (context, url) => Container(
          color: AppColors.black,
          child: const Center(child: CircularProgressIndicator()),
        ),
        errorWidget: (context, url, error) => Container(
          color: AppColors.black,
          child: const Icon(Icons.video_library, color: AppColors.grey600, size: 80),
        ),
      );
    }

    return Container(
      color: AppColors.black,
      child: const Center(
        child: Icon(Icons.play_circle_outline, color: AppColors.white, size: 80),
      ),
    );
  }

  Widget _buildGradientOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.transparent,
            Colors.black.withOpacity(0.7),
          ],
          stops: const [0.0, 0.5, 1.0],
        ),
      ),
    );
  }

  Widget _buildVideoInfo() {
    return Positioned(
      left: 16,
      right: 80,
      bottom: widget.video.product != null ? 140 : 40,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.grey600,
                backgroundImage: widget.video.seller?.avatar != null
                    ? NetworkImage(widget.video.seller!.avatar!)
                    : null,
                child: widget.video.seller?.avatar == null
                    ? const Icon(Icons.person, color: AppColors.white, size: 20)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.video.seller?.fullName ?? 'Seller',
                      style: const TextStyle(
                        color: AppColors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    if (widget.video.isLive)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'LIVE',
                          style: TextStyle(
                            color: AppColors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
                            Consumer<FollowProvider>(
                              builder: (context, followProvider, child) {
                                final seller = widget.video.seller;
                                if (seller == null) return const SizedBox.shrink();
                                final isFollowing = followProvider.isFollowing(seller.id);
                                return OutlinedButton(
                                  onPressed: () => followProvider.toggleFollow(seller),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: isFollowing ? AppColors.primary : AppColors.white,
                                    backgroundColor: isFollowing ? AppColors.white : Colors.transparent,
                                    side: BorderSide(color: isFollowing ? AppColors.primary : AppColors.white),
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    minimumSize: const Size(0, 32),
                                  ),
                                  child: Text(isFollowing ? 'Following' : 'Follow'),
                                );
                              },
                            ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            widget.video.title,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 14,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (widget.video.description != null) ...[
            const SizedBox(height: 4),
            Text(
              widget.video.description!,
              style: TextStyle(
                color: AppColors.white.withOpacity(0.8),
                fontSize: 12,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

    Widget _buildActionButtons() {
      return Positioned(
        right: 16,
        bottom: widget.video.product != null ? 160 : 100,
        child: Column(
          children: [
            Consumer<VideoInteractionProvider>(
              builder: (context, interactionProvider, child) {
                final isLiked = interactionProvider.isLiked(widget.video.id);
                final likeCount = interactionProvider.getLikeCount(widget.video.id, widget.video.likeCount);
                return _buildActionButton(
                  icon: isLiked ? Icons.favorite : Icons.favorite_border,
                  label: _formatCount(likeCount),
                  color: isLiked ? AppColors.error : AppColors.primary,
                  onTap: () => interactionProvider.toggleLike(widget.video.id, widget.video.likeCount),
                );
              },
            ),
            const SizedBox(height: 20),
            _buildActionButton(
              icon: Icons.comment_outlined,
              label: '0',
              color: AppColors.primary,
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Comments coming soon!')),
                );
              },
            ),
            const SizedBox(height: 20),
            _buildActionButton(
              icon: Icons.share_outlined,
              label: 'Share',
              color: AppColors.primary,
              onTap: () => _shareVideo(),
            ),
            const SizedBox(height: 20),
            _buildBuyButton(),
          ],
        ),
      );
    }

    String _formatCount(int count) {
      if (count >= 1000000) {
        return '\${(count / 1000000).toStringAsFixed(1)}M';
      } else if (count >= 1000) {
        return '\${(count / 1000).toStringAsFixed(1)}K';
      }
      return count.toString();
    }

    void _shareVideo() {
      final videoUrl = 'https://gogomarket.uz/video/\${widget.video.id}';
      final text = '\${widget.video.title}\\n\\nCheck out this video on GoGoMarket!\\n\$videoUrl';
      Share.share(text);
    }

  Widget _buildBuyButton() {
    if (widget.video.product == null) return const SizedBox.shrink();
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/product/${widget.video.product!.id}');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.4),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Text(
          'BUY',
          style: TextStyle(
            color: AppColors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color color = AppColors.primary,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.black.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductOverlay() {
    final product = widget.video.product!;

    return Positioned(
      left: 16,
      right: 80,
      bottom: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              'OUR BEST PRODUCT',
              style: TextStyle(
                color: AppColors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, '/product/${product.id}');
            },
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: product.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: product.images.first,
                            width: 50,
                            height: 50,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            width: 50,
                            height: 50,
                            color: AppColors.grey200,
                            child: const Icon(Icons.image),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.title,
                          style: const TextStyle(
                            color: AppColors.black,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Most Popular',
                          style: TextStyle(
                            color: AppColors.grey500,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              CurrencyFormatter.format(product.price),
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            if (product.originalPrice != null && product.originalPrice! > product.price) ...[
                              const SizedBox(width: 8),
                              Text(
                                CurrencyFormatter.format(product.originalPrice!),
                                style: TextStyle(
                                  color: AppColors.grey400,
                                  fontSize: 12,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          _buildStoreInfo(),
        ],
      ),
    );
  }

  Widget _buildStoreInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.grey300,
            backgroundImage: widget.video.seller?.avatar != null
                ? NetworkImage(widget.video.seller!.avatar!)
                : null,
            child: widget.video.seller?.avatar == null
                ? const Icon(Icons.store, color: AppColors.grey600, size: 18)
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.video.seller?.fullName ?? 'Fashion Store',
                  style: const TextStyle(
                    color: AppColors.black,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                Text(
                  'Most Popular Clothing Brand',
                  style: TextStyle(
                    color: AppColors.grey500,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
                    Consumer<FollowProvider>(
                      builder: (context, followProvider, child) {
                        final seller = widget.video.seller;
                        if (seller == null) return const SizedBox.shrink();
                        final isFollowing = followProvider.isFollowing(seller.id);
                        return TextButton(
                          onPressed: () => followProvider.toggleFollow(seller),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            isFollowing ? 'Following' : 'Follow',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        );
                      },
                    ),
        ],
      ),
    );
  }
}
