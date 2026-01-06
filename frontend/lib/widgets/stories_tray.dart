import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/theme.dart';
import '../models/story.dart';
import '../models/video.dart';
import '../providers/auth_provider.dart';
import '../l10n/app_localizations.dart';
import 'story_avatar.dart';
import '../screens/story/story_viewer_screen.dart';

class StoriesTray extends StatelessWidget {
  final List<SellerStories> sellerStories;
  final bool isLoading;
  final bool showAddStory;

  const StoriesTray({
    super.key,
    required this.sellerStories,
    this.isLoading = false,
    this.showAddStory = true,
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

      final authProvider = context.watch<AuthProvider>();
      final user = authProvider.user;
      final isSeller = user?.role == 'seller' || user?.role == 'admin';
      final l10n = AppLocalizations.of(context);

      return SizedBox(
        height: 100,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: sellerStories.length + (showAddStory && isSeller ? 1 : 0),
          itemBuilder: (context, index) {
            // First item is "Your Story" button for sellers
            if (showAddStory && isSeller && index == 0) {
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: _buildAddStoryButton(context, user, l10n),
              );
            }
          
            final storyIndex = showAddStory && isSeller ? index - 1 : index;
            if (storyIndex < 0 || storyIndex >= sellerStories.length) {
              return const SizedBox.shrink();
            }
          
            final stories = sellerStories[storyIndex];
            return Padding(
              padding: const EdgeInsets.only(right: 12),
              child: StoryAvatar(
                sellerStories: stories,
                onTap: () => _openStoryViewer(context, storyIndex),
              ),
            );
          },
        ),
      );
    }

    Widget _buildAddStoryButton(BuildContext context, dynamic user, AppLocalizations? l10n) {
      final isDark = Theme.of(context).brightness == Brightness.dark;
      return GestureDetector(
        onTap: () {
          Navigator.pushNamed(context, '/seller/add-video');
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDark ? AppColors.grey800 : AppColors.grey200,
                    image: user?.avatar != null
                        ? DecorationImage(
                            image: NetworkImage(user!.avatar!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: user?.avatar == null
                      ? Icon(
                          Icons.person,
                          color: isDark ? AppColors.grey400 : AppColors.grey500,
                          size: 32,
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? AppColors.darkBackground : AppColors.white,
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.add,
                      color: AppColors.white,
                      size: 14,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            SizedBox(
              width: 74,
              child: Text(
                l10n?.translate('your_story') ?? 'Your story',
                style: TextStyle(
                  color: isDark ? AppColors.white : AppColors.black,
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final shimmerColor = isDark ? AppColors.grey700 : AppColors.grey300;
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
                color: shimmerColor.withOpacity(_animation.value),
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: 50,
              height: 12,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: shimmerColor.withOpacity(_animation.value),
              ),
            ),
          ],
        );
      },
    );
  }
}
