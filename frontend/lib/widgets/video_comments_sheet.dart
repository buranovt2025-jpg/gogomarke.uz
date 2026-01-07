import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class VideoComment {
  final String id;
  final String text;
  final String createdAt;
  final CommentUser? user;

  VideoComment({
    required this.id,
    required this.text,
    required this.createdAt,
    this.user,
  });

  factory VideoComment.fromJson(Map<String, dynamic> json) {
    return VideoComment(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      createdAt: json['createdAt'] ?? '',
      user: json['user'] != null ? CommentUser.fromJson(json['user']) : null,
    );
  }
}

class CommentUser {
  final String id;
  final String firstName;
  final String lastName;
  final String? avatar;

  CommentUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.avatar,
  });

  factory CommentUser.fromJson(Map<String, dynamic> json) {
    return CommentUser(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      avatar: json['avatar'],
    );
  }

  String get fullName => '$firstName $lastName'.trim();
}

class VideoCommentsSheet extends StatefulWidget {
  final String videoId;
  final bool isAuthenticated;

  const VideoCommentsSheet({
    super.key,
    required this.videoId,
    this.isAuthenticated = false,
  });

  @override
  State<VideoCommentsSheet> createState() => _VideoCommentsSheetState();
}

class _VideoCommentsSheetState extends State<VideoCommentsSheet> {
  final ApiService _apiService = ApiService();
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<VideoComment> _comments = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadComments() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.get('/videos/${widget.videoId}/comments');
      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> data = response['data'];
        setState(() {
          _comments = data.map((json) => VideoComment.fromJson(json)).toList();
        });
      }
    } catch (e) {
      debugPrint('Failed to load comments: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || !widget.isAuthenticated) return;

    setState(() => _isSubmitting = true);
    try {
      final response = await _apiService.post(
        '/videos/${widget.videoId}/comments',
        {'text': text},
      );
      if (response['success'] == true) {
        _commentController.clear();
        await _loadComments();
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      }
    } catch (e) {
      debugPrint('Failed to submit comment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Не удалось отправить комментарий')),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _deleteComment(String commentId) async {
    try {
      final response = await _apiService.delete(
        '/videos/${widget.videoId}/comments/$commentId',
      );
      if (response['success'] == true) {
        setState(() {
          _comments.removeWhere((c) => c.id == commentId);
        });
      }
    } catch (e) {
      debugPrint('Failed to delete comment: $e');
    }
  }

  String _formatTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'только что';
      if (diff.inMinutes < 60) return '${diff.inMinutes} мин назад';
      if (diff.inHours < 24) return '${diff.inHours} ч назад';
      if (diff.inDays < 7) return '${diff.inDays} дн назад';
      return '${date.day}.${date.month}.${date.year}';
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(child: _buildCommentsList()),
          if (widget.isAuthenticated) _buildCommentInput(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.grey200)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.comment_outlined, size: 20),
              const SizedBox(width: 8),
              Text(
                'Комментарии (${_comments.length})',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentsList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (_comments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.comment_outlined, size: 48, color: AppColors.grey400),
            const SizedBox(height: 16),
            Text(
              'Комментариев пока нет',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.grey500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.isAuthenticated
                  ? 'Будьте первым!'
                  : 'Войдите, чтобы оставить комментарий',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey400,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _comments.length,
      separatorBuilder: (_, __) => const Divider(height: 24),
      itemBuilder: (context, index) {
        final comment = _comments[index];
        return _buildCommentItem(comment);
      },
    );
  }

  Widget _buildCommentItem(VideoComment comment) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: AppColors.grey200,
          backgroundImage: comment.user?.avatar != null
              ? NetworkImage(comment.user!.avatar!)
              : null,
          child: comment.user?.avatar == null
              ? Icon(Icons.person, size: 18, color: AppColors.grey500)
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    comment.user?.fullName ?? 'Пользователь',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatTime(comment.createdAt),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.grey400,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                comment.text,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.grey700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.grey200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _commentController,
              decoration: InputDecoration(
                hintText: 'Напишите комментарий...',
                hintStyle: TextStyle(color: AppColors.grey400),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: AppColors.grey300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: AppColors.grey300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
              ),
              maxLines: 3,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _submitComment(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: _isSubmitting ? null : _submitComment,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send, color: AppColors.primary),
          ),
        ],
      ),
    );
  }
}
