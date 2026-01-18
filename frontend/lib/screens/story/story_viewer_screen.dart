import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';

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
    with TickerProviderStateMixin {
  late PageController _sellerPageController;
  late int _currentSellerIndex;
  late int _currentStoryIndex;
  
  AnimationController? _progressController;
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isPaused = false;

  @override
  void initState() {
    super.initState();
    _currentSellerIndex = widget.initialSellerIndex;
    _currentStoryIndex = 0;
    _sellerPageController = PageController(initialPage: _currentSellerIndex);
    
    // Hide status bar for immersive experience
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    _initCurrentStory();
  }

  @override
  void dispose() {
    _progressController?.dispose();
    _videoController?.dispose();
    _sellerPageController.dispose();
    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  List<Story> get _currentStories {
    if (_currentSellerIndex < 0 || _currentSellerIndex >= widget.allSellerStories.length) {
      return [];
    }
    return widget.allSellerStories[_currentSellerIndex].stories;
  }

  Story? get _currentStory {
    final stories = _currentStories;
    if (_currentStoryIndex < 0 || _currentStoryIndex >= stories.length) {
      return null;
    }
    return stories[_currentStoryIndex];
  }

  void _initCurrentStory() {
    _progressController?.dispose();
    _videoController?.dispose();
    _isVideoInitialized = false;

    final story = _currentStory;
    if (story == null) return;

    final duration = Duration(seconds: story.duration > 0 ? story.duration : 5);
    
    _progressController = AnimationController(
      vsync: this,
      duration: duration,
    );

    _progressController!.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _nextStory();
      }
    });

    if (story.videoUrl != null) {
      _initVideo(story.videoUrl!);
    } else {
      _progressController!.forward();
    }

    setState(() {});
  }

  Future<void> _initVideo(String url) async {
    _videoController = VideoPlayerController.networkUrl(Uri.parse(url));
    
    try {
      await _videoController!.initialize();
      _isVideoInitialized = true;
      _videoController!.play();
      _progressController!.forward();
      setState(() {});
    } catch (e) {
      debugPrint('Error initializing video: $e');
      // Fall back to image duration
      _progressController!.forward();
    }
  }

  void _nextStory() {
    if (_currentStoryIndex < _currentStories.length - 1) {
      setState(() {
        _currentStoryIndex++;
      });
      _initCurrentStory();
    } else {
      _nextSeller();
    }
  }

  void _previousStory() {
    if (_currentStoryIndex > 0) {
      setState(() {
        _currentStoryIndex--;
      });
      _initCurrentStory();
    } else {
      _previousSeller();
    }
  }

  void _nextSeller() {
    if (_currentSellerIndex < widget.allSellerStories.length - 1) {
      setState(() {
        _currentSellerIndex++;
        _currentStoryIndex = 0;
      });
      _sellerPageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _initCurrentStory();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _previousSeller() {
    if (_currentSellerIndex > 0) {
      setState(() {
        _currentSellerIndex--;
        _currentStoryIndex = widget.allSellerStories[_currentSellerIndex].stories.length - 1;
      });
      _sellerPageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _initCurrentStory();
    }
  }

  void _onTapDown(TapDownDetails details) {
    final screenWidth = MediaQuery.of(context).size.width;
    final tapPosition = details.globalPosition.dx;

    if (tapPosition < screenWidth / 3) {
      _previousStory();
    } else if (tapPosition > screenWidth * 2 / 3) {
      _nextStory();
    }
  }

  void _onLongPressStart(LongPressStartDetails details) {
    setState(() {
      _isPaused = true;
    });
    _progressController?.stop();
    _videoController?.pause();
  }

  void _onLongPressEnd(LongPressEndDetails details) {
    setState(() {
      _isPaused = false;
    });
    _progressController?.forward();
    _videoController?.play();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: _onTapDown,
        onLongPressStart: _onLongPressStart,
        onLongPressEnd: _onLongPressEnd,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Story content
            _buildStoryContent(),
            
            // Progress bars
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 8,
              right: 8,
              child: _buildProgressBars(),
            ),
            
            // Header with user info
            Positioned(
              top: MediaQuery.of(context).padding.top + 24,
              left: 16,
              right: 16,
              child: _buildHeader(),
            ),
            
            // Close button
            Positioned(
              top: MediaQuery.of(context).padding.top + 24,
              right: 16,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 28,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoryContent() {
    final story = _currentStory;
    if (story == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (story.videoUrl != null && _isVideoInitialized && _videoController != null) {
      return Center(
        child: AspectRatio(
          aspectRatio: _videoController!.value.aspectRatio,
          child: VideoPlayer(_videoController!),
        ),
      );
    }

    final imageUrl = story.imageUrl ?? story.thumbnailUrl;
    if (imageUrl != null) {
      return CachedNetworkImage(
        imageUrl: imageUrl,
        fit: BoxFit.contain,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        errorWidget: (context, url, error) => const Center(
          child: Icon(Icons.error, color: Colors.white, size: 48),
        ),
      );
    }

    return Container(
      color: AppColors.primary.withOpacity(0.3),
      child: Center(
        child: Text(
          story.title ?? 'Story',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildProgressBars() {
    final stories = _currentStories;
    if (stories.isEmpty) return const SizedBox.shrink();

    return Row(
      children: List.generate(stories.length, (index) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: index < stories.length - 1 ? 4 : 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: SizedBox(
                height: 3,
                child: index < _currentStoryIndex
                    ? Container(color: Colors.white)
                    : index == _currentStoryIndex
                        ? AnimatedBuilder(
                            animation: _progressController ?? const AlwaysStoppedAnimation(0),
                            builder: (context, child) {
                              return LinearProgressIndicator(
                                value: _progressController?.value ?? 0,
                                backgroundColor: Colors.white.withOpacity(0.3),
                                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                              );
                            },
                          )
                        : Container(color: Colors.white.withOpacity(0.3)),
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildHeader() {
    if (_currentSellerIndex < 0 || _currentSellerIndex >= widget.allSellerStories.length) {
      return const SizedBox.shrink();
    }

    final sellerStories = widget.allSellerStories[_currentSellerIndex];
    final seller = sellerStories.seller;
    final story = _currentStory;

    return Row(
      children: [
        // Seller avatar
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.primary, width: 2),
            image: seller?.avatar != null
                ? DecorationImage(
                    image: NetworkImage(seller!.avatar!),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: seller?.avatar == null
              ? const Icon(Icons.person, color: Colors.white, size: 20)
              : null,
        ),
        const SizedBox(width: 12),
        
        // Seller name and time
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                seller?.firstName != null
                    ? '${seller!.firstName} ${seller.lastName ?? ''}'.trim()
                    : 'Seller',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              if (story?.createdAt != null)
                Text(
                  _formatTimeAgo(story!.createdAt!),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}
