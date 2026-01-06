import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../models/story.dart';
import '../models/video.dart';
import '../models/user.dart';
import 'story_avatar.dart';
import '../screens/story/story_viewer_screen.dart';

class StoriesTray extends StatelessWidget {
  final List<SellerStories> sellerStories;
  final bool isLoading;

  const StoriesTray({
    super.key,
    required this.sellerStories,
    this.isLoading = false,
  });

  factory StoriesTray.fromVideos(List<Video> videos) {
    final Map<String, List<Story>> storiesBySeller = {};

    for (final video in videos) {
      final story = Story(
        id: video.id,
        sellerId: video.sellerId,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        title: video.title,
        duration: video.duration > 0 ? video.duration : 5,
        isLive: video.isLive,
        seller: video.seller,
        createdAt: video.createdAt,
      );

      if (!storiesBySeller.containsKey(video.sellerId)) {
        storiesBySeller[video.sellerId] = [];
      }
      storiesBySeller[video.sellerId]!.add(story);
    }

    final sellerStoriesList = storiesBySeller.entries
        .map((entry) => SellerStories.fromStories(entry.value))
        .toList();

    sellerStoriesList.sort((a, b) {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return StoriesTray(sellerStories: sellerStoriesList);
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _buildLoadingState();
    }

    if (sellerStories.isEmpty) {
      return _buildEmptyState();
    }

    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: sellerStories.length,
        itemBuilder: (context, index) {
          final stories = sellerStories[index];
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: StoryAvatar(
              sellerStories: stories,
              onTap: () => _openStoryViewer(context, index),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 5,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _ShimmerAvatar(),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return SizedBox(
      height: 100,
      child: Center(
        child: Text(
          'No stories available',
          style: TextStyle(
            color: AppColors.grey500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  void _openStoryViewer(BuildContext context, int index) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        pageBuilder: (context, animation, secondaryAnimation) {
          return StoryViewerScreen(
            allSellerStories: sellerStories,
            initialSellerIndex: index,
          );
        },
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
      ),
    );
  }
}

class _ShimmerAvatar extends StatefulWidget {
  @override
  State<_ShimmerAvatar> createState() => _ShimmerAvatarState();
}

class _ShimmerAvatarState extends State<_ShimmerAvatar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
    _animation = Tween<double>(begin: 0.3, end: 0.7).animate(_controller);
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
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.grey700.withOpacity(_animation.value),
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: 50,
              height: 12,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: AppColors.grey700.withOpacity(_animation.value),
              ),
            ),
          ],
        );
      },
    );
  }
}
