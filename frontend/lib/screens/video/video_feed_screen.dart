import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/video_provider.dart';
import '../../widgets/video_player_item.dart';

class VideoFeedScreen extends StatefulWidget {
  final bool isActive;
  
  const VideoFeedScreen({super.key, this.isActive = true});

  @override
  State<VideoFeedScreen> createState() => _VideoFeedScreenState();
}

class _VideoFeedScreenState extends State<VideoFeedScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _loadVideos();
  }

  Future<void> _loadVideos() async {
    await context.read<VideoProvider>().fetchVideoFeed(refresh: true);
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
          Consumer<VideoProvider>(
            builder: (context, videoProvider, child) {
              if (videoProvider.isLoading && videoProvider.videos.isEmpty) {
                return const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                );
              }

              final videos = videoProvider.videos;

              if (videos.isEmpty) {
                return const Center(
                  child: Text(
                    'No videos available',
                    style: TextStyle(color: AppColors.white),
                  ),
                );
              }

              return PageView.builder(
                controller: _pageController,
                scrollDirection: Axis.vertical,
                itemCount: videos.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentIndex = index;
                  });

                  if (index >= videos.length - 3 && videoProvider.hasMore) {
                    videoProvider.fetchVideoFeed();
                  }
                },
                itemBuilder: (context, index) {
                  final video = videos[index];
                  return VideoPlayerItem(
                    video: video,
                    isActive: widget.isActive && index == _currentIndex,
                  );
                },
              );
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Reels',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.search, color: AppColors.white, size: 28),
                    onPressed: () {},
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
