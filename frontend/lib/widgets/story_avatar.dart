import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../config/theme.dart';
import '../models/story.dart';

class StoryAvatar extends StatelessWidget {
  final SellerStories sellerStories;
  final VoidCallback? onTap;
  final double size;

  const StoryAvatar({
    super.key,
    required this.sellerStories,
    this.onTap,
    this.size = 64,
  });

  @override
  Widget build(BuildContext context) {
    final seller = sellerStories.seller;
    final hasUnviewed = sellerStories.hasUnviewed;
    final isLive = sellerStories.isLive;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: hasUnviewed
                      ? const LinearGradient(
                          colors: [
                            Color(0xFFFF6600),
                            Color(0xFFFF8533),
                            Color(0xFFE53935),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  border: hasUnviewed
                      ? null
                      : Border.all(color: AppColors.grey500, width: 2),
                ),
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Theme.of(context).scaffoldBackgroundColor,
                  ),
                    child: CircleAvatar(
                      radius: size / 2 - 5,
                      backgroundColor: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.grey700
                          : AppColors.grey200,
                      backgroundImage: seller?.avatar != null
                          ? CachedNetworkImageProvider(seller!.avatar!)
                          : null,
                      child: seller?.avatar == null
                          ? Icon(
                              Icons.person,
                              color: Theme.of(context).brightness == Brightness.dark
                                  ? AppColors.grey400
                                  : AppColors.grey500,
                              size: size / 2,
                            )
                          : null,
                    ),
                ),
              ),
              if (isLive)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: _LiveBadge(),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: size + 10,
            child: Text(
              seller?.firstName ?? 'Seller',
              style: TextStyle(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.white
                    : AppColors.black,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveBadge extends StatefulWidget {
  @override
  State<_LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<_LiveBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.7, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.error.withOpacity(_animation.value),
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(
                color: AppColors.error.withOpacity(0.5),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
          child: const Text(
            'LIVE',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 8,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        );
      },
    );
  }
}
