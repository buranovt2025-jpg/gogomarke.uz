import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/video_provider.dart';
import '../../providers/follow_provider.dart';
import '../../widgets/video_player_item.dart';

class FollowingFeedScreen extends StatefulWidget {
  const FollowingFeedScreen({super.key});

  @override
  State<FollowingFeedScreen> createState() => _FollowingFeedScreenState();
}

class _FollowingFeedScreenState extends State<FollowingFeedScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Consumer2<VideoProvider, FollowProvider>(
            builder: (context, videoProvider, followProvider, child) {
              if (followProvider.followedSellerIds.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_outline, size: 80, color: AppColors.grey400),
                      const SizedBox(height: 16),
                      const Text(
                        'No followed sellers yet',
                        style: TextStyle(color: AppColors.white, fontSize: 18),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Follow sellers to see their videos here',
                        style: TextStyle(color: AppColors.grey400, fontSize: 14),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Discover Videos'),
                      ),
                    ],
                  ),
                );
              }

              if (videoProvider.isLoading && videoProvider.videos.isEmpty) {
                return const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                );
              }

              final followedVideos = videoProvider.videos
                  .where((v) => followProvider.isFollowing(v.sellerId))
                  .toList();

              if (followedVideos.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.video_library_outlined, size: 80, color: AppColors.grey400),
                      const SizedBox(height: 16),
                      const Text(
                        'No videos from followed sellers',
                        style: TextStyle(color: AppColors.white, fontSize: 18),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Following ${followProvider.followingCount} sellers',
                        style: const TextStyle(color: AppColors.grey400, fontSize: 14),
                      ),
                    ],
                  ),
                );
              }

              return PageView.builder(
                controller: _pageController,
                scrollDirection: Axis.vertical,
                itemCount: followedVideos.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentIndex = index;
                  });
                },
                itemBuilder: (context, index) {
                  final video = followedVideos[index];
                  return VideoPlayerItem(
                    video: video,
                    isActive: index == _currentIndex,
                  );
                },
              );
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: AppColors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Following',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Consumer<FollowProvider>(
                    builder: (context, followProvider, child) {
                      return Text(
                        '${followProvider.followingCount} sellers',
                        style: const TextStyle(color: AppColors.grey400, fontSize: 14),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
