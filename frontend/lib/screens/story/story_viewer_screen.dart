import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/theme.dart';
import '../../models/story.dart';

class StoryViewerScreen extends StatefulWidget {
  final List<SellerStories> allSellerStories;
  final int initialSellerIndex;

  const StoryViewerScreen({
    super.key,
    required this.allSellerStories,
    this.initialSellerIndex = 0,
  });

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late int _currentSellerIndex;
  late int _currentStoryIndex;
  late AnimationController _progressController;
  VideoPlayerController? _videoController;
  Timer? _autoAdvanceTimer;
  bool _isPaused = false;
  bool _isVideoLoading = false;

  static const int _defaultDuration = 5;

  @override
  void initState() {
    super.initState();
    _currentSellerIndex = widget.initialSellerIndex;
    _currentStoryIndex = 0;
    _pageController = PageController(initialPage: _currentSellerIndex);
    _progressController = AnimationController(
      vsync: this,
      duration: Duration(seconds: _currentStoryDuration),
    );
    _startStory();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _progressController.dispose();
    _videoController?.dispose();
    _autoAdvanceTimer?.cancel();
    super.dispose();
  }

  SellerStories get _currentSellerStories =>
      widget.allSellerStories[_currentSellerIndex];

  Story get _currentStory =>
      _currentSellerStories.stories[_currentStoryIndex];

  int get _currentStoryDuration =>
      _currentStory.duration > 0 ? _currentStory.duration : _defaultDuration;

  void _startStory() {
    _progressController.reset();
    _progressController.duration = Duration(seconds: _currentStoryDuration);

    if (_currentStory.isVideo && _currentStory.videoUrl != null) {
      _loadVideo();
    } else {
      _progressController.forward();
      _startAutoAdvanceTimer();
    }

    _markAsViewed();
  }

  void _loadVideo() async {
    setState(() => _isVideoLoading = true);

    _videoController?.dispose();
    _videoController = VideoPlayerController.networkUrl(
      Uri.parse(_currentStory.videoUrl!),
    );

    try {
      await _videoController!.initialize();
      if (mounted) {
        setState(() => _isVideoLoading = false);
        _videoController!.play();
        _progressController.duration = _videoController!.value.duration;
        _progressController.forward();
        _videoController!.addListener(_onVideoProgress);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isVideoLoading = false);
        _progressController.duration = Duration(seconds: _defaultDuration);
        _progressController.forward();
        _startAutoAdvanceTimer();
      }
    }
  }

  void _onVideoProgress() {
    if (_videoController == null) return;
    
    final position = _videoController!.value.position;
    final duration = _videoController!.value.duration;
    
    if (duration.inMilliseconds > 0) {
      final progress = position.inMilliseconds / duration.inMilliseconds;
      if (progress >= 0.99) {
        _goToNextStory();
      }
    }
  }

  void _startAutoAdvanceTimer() {
    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = Timer(
      Duration(seconds: _currentStoryDuration),
      _goToNextStory,
    );
  }

  void _markAsViewed() async {
    final prefs = await SharedPreferences.getInstance();
    final viewedStories = prefs.getStringList('viewed_stories') ?? [];
    if (!viewedStories.contains(_currentStory.id)) {
      viewedStories.add(_currentStory.id);
      await prefs.setStringList('viewed_stories', viewedStories);
    }
  }

  void _goToNextStory() {
    if (_currentStoryIndex < _currentSellerStories.stories.length - 1) {
      setState(() => _currentStoryIndex++);
      _startStory();
    } else {
      _goToNextSeller();
    }
  }

  void _goToPreviousStory() {
    if (_currentStoryIndex > 0) {
      setState(() => _currentStoryIndex--);
      _startStory();
    } else {
      _goToPreviousSeller();
    }
  }

  void _goToNextSeller() {
    if (_currentSellerIndex < widget.allSellerStories.length - 1) {
      setState(() {
        _currentSellerIndex++;
        _currentStoryIndex = 0;
      });
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStory();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _goToPreviousSeller() {
    if (_currentSellerIndex > 0) {
      setState(() {
        _currentSellerIndex--;
        _currentStoryIndex =
            widget.allSellerStories[_currentSellerIndex].stories.length - 1;
      });
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStory();
    }
  }

  void _onTapDown(TapDownDetails details) {
    final screenWidth = MediaQuery.of(context).size.width;
    final tapX = details.globalPosition.dx;

    if (tapX < screenWidth / 3) {
      _goToPreviousStory();
    } else if (tapX > screenWidth * 2 / 3) {
      _goToNextStory();
    }
  }

  void _onLongPressStart(LongPressStartDetails details) {
    setState(() => _isPaused = true);
    _progressController.stop();
    _videoController?.pause();
    _autoAdvanceTimer?.cancel();
  }

  void _onLongPressEnd(LongPressEndDetails details) {
    setState(() => _isPaused = false);
    _progressController.forward();
    _videoController?.play();
    if (!_currentStory.isVideo) {
      final remainingTime = Duration(
        milliseconds: ((_progressController.duration!.inMilliseconds) *
                (1 - _progressController.value))
            .round(),
      );
      _autoAdvanceTimer = Timer(remainingTime, _goToNextStory);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      body: GestureDetector(
        onTapDown: _onTapDown,
        onLongPressStart: _onLongPressStart,
        onLongPressEnd: _onLongPressEnd,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity! > 0) {
            _goToPreviousSeller();
          } else if (details.primaryVelocity! < 0) {
            _goToNextSeller();
          }
        },
        child: Stack(
          fit: StackFit.expand,
          children: [
            _buildStoryContent(),
            _buildOverlay(),
            if (_isPaused)
              Container(
                color: AppColors.black.withOpacity(0.3),
                child: const Center(
                  child: Icon(
                    Icons.pause_circle_filled,
                    color: AppColors.white,
                    size: 64,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoryContent() {
    if (_isVideoLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (_currentStory.isVideo && _videoController?.value.isInitialized == true) {
      return Center(
        child: AspectRatio(
          aspectRatio: _videoController!.value.aspectRatio,
          child: VideoPlayer(_videoController!),
        ),
      );
    }

    final imageUrl = _currentStory.thumbnailUrl ?? _currentStory.imageUrl;
    if (imageUrl != null) {
      return CachedNetworkImage(
        imageUrl: imageUrl,
        fit: BoxFit.cover,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        errorWidget: (context, url, error) => Container(
          color: AppColors.grey800,
          child: const Center(
            child: Icon(Icons.error, color: AppColors.grey500, size: 48),
          ),
        ),
      );
    }

    return Container(
      color: AppColors.grey800,
      child: const Center(
        child: Icon(Icons.image, color: AppColors.grey500, size: 48),
      ),
    );
  }

  Widget _buildOverlay() {
    return SafeArea(
      child: Column(
        children: [
          _buildProgressBars(),
          const SizedBox(height: 8),
          _buildHeader(),
          const Spacer(),
          if (_currentStory.title != null) _buildTitle(),
        ],
      ),
    );
  }

  Widget _buildProgressBars() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: List.generate(
          _currentSellerStories.stories.length,
          (index) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: _StoryProgressBar(
                  isActive: index == _currentStoryIndex,
                  isCompleted: index < _currentStoryIndex,
                  animation: index == _currentStoryIndex
                      ? _progressController
                      : null,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final seller = _currentSellerStories.seller;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.grey700,
            backgroundImage: seller?.avatar != null
                ? CachedNetworkImageProvider(seller!.avatar!)
                : null,
            child: seller?.avatar == null
                ? const Icon(Icons.person, color: AppColors.grey400, size: 16)
                : null,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  seller?.firstName ?? 'Seller',
                  style: const TextStyle(
                    color: AppColors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (_currentStory.createdAt != null)
                  Text(
                    _formatTime(_currentStory.createdAt!),
                    style: const TextStyle(
                      color: AppColors.grey400,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          if (_currentSellerStories.isLive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildTitle() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            AppColors.black.withOpacity(0.8),
            Colors.transparent,
          ],
        ),
      ),
      child: Text(
        _currentStory.title!,
        style: const TextStyle(
          color: AppColors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }
}

class _StoryProgressBar extends StatelessWidget {
  final bool isActive;
  final bool isCompleted;
  final AnimationController? animation;

  const _StoryProgressBar({
    required this.isActive,
    required this.isCompleted,
    this.animation,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 3,
      decoration: BoxDecoration(
        color: AppColors.white.withOpacity(0.3),
        borderRadius: BorderRadius.circular(2),
      ),
      child: isCompleted
          ? Container(
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(2),
              ),
            )
          : isActive && animation != null
              ? AnimatedBuilder(
                  animation: animation!,
                  builder: (context, child) {
                    return FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: animation!.value,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    );
                  },
                )
              : null,
    );
  }
}
