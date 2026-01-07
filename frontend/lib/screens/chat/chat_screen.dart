import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../providers/chat_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/socket_service.dart';
import '../../models/chat.dart';

class ChatScreen extends StatefulWidget {
  final String chatId;

  const ChatScreen({super.key, required this.chatId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isConnected = false;
  bool _isTyping = false;
  Timer? _typingTimer;
  Timer? _connectionCheckTimer;

  @override
  void initState() {
    super.initState();
    _connectSocket();
    _loadMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    _connectionCheckTimer?.cancel();
    socketService.leaveOrder(widget.chatId);
    socketService.off('new_message');
    socketService.off('user_typing');
    socketService.off('messages_read');
    super.dispose();
  }

  void _connectSocket() {
    final authProvider = context.read<AuthProvider>();
    final token = authProvider.token;
    
    if (token != null) {
      socketService.connect(token);
      
      // Check connection status periodically
      _connectionCheckTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) {
          setState(() {
            _isConnected = socketService.isConnected;
          });
        }
      });
      
      // Join order room after a short delay
      Future.delayed(const Duration(milliseconds: 500), () {
        socketService.joinOrder(widget.chatId);
      });
      
      // Listen for new messages
      socketService.on('new_message', _handleNewMessage);
      socketService.on('user_typing', _handleUserTyping);
      socketService.on('messages_read', _handleMessagesRead);
    }
  }

  void _handleNewMessage(dynamic data) {
    if (!mounted) return;
    final chatProvider = context.read<ChatProvider>();
    final message = ChatMessage.fromJson(data as Map<String, dynamic>);
    
    // Add message if not already present
    if (!chatProvider.messages.any((m) => m.id == message.id)) {
      chatProvider.messages.add(message);
      chatProvider.notifyListeners();
      _scrollToBottom();
    }
  }

  void _handleUserTyping(dynamic data) {
    if (!mounted) return;
    final currentUserId = context.read<AuthProvider>().user?.id;
    final typingData = data as Map<String, dynamic>;
    
    if (typingData['userId'] != currentUserId) {
      setState(() {
        _isTyping = typingData['isTyping'] as bool;
      });
    }
  }

  void _handleMessagesRead(dynamic data) {
    if (!mounted) return;
    final currentUserId = context.read<AuthProvider>().user?.id;
    final readData = data as Map<String, dynamic>;
    
    if (readData['readBy'] != currentUserId) {
      // Refresh messages to get updated read status from server
      final chatProvider = context.read<ChatProvider>();
      chatProvider.fetchMessages(widget.chatId, refresh: true);
    }
  }

  Future<void> _loadMessages() async {
    final chatProvider = context.read<ChatProvider>();
    await chatProvider.fetchMessages(widget.chatId, refresh: true);
    if (chatProvider.error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(chatProvider.error!),
          backgroundColor: AppColors.error,
        ),
      );
    }
    await chatProvider.markAsRead(widget.chatId);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

    Future<void> _sendMessage() async {
      final content = _messageController.text.trim();
      if (content.isEmpty) return;

      _messageController.clear();
    
      // Clear typing indicator
      _typingTimer?.cancel();
      socketService.sendTyping(widget.chatId, false);
    
      // Send via WebSocket if connected, otherwise fallback to REST API
      if (_isConnected) {
        // Get receiver ID from current chat
        final chatProvider = context.read<ChatProvider>();
        final currentUserId = context.read<AuthProvider>().user?.id;
        final chat = chatProvider.currentChat;
        final receiverId = chat?.buyerId == currentUserId ? chat?.sellerId : chat?.buyerId;
      
        if (receiverId != null) {
          socketService.sendMessage(widget.chatId, receiverId, content);
          _scrollToBottom();
        }
      } else {
        final chatProvider = context.read<ChatProvider>();
        final success = await chatProvider.sendMessage(widget.chatId, content);
        if (success) {
          _scrollToBottom();
        } else {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(chatProvider.error ?? 'Failed to send message'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }

    void _onTextChanged(String text) {
      if (_isConnected) {
        socketService.sendTyping(widget.chatId, true);
      
        _typingTimer?.cancel();
        _typingTimer = Timer(const Duration(seconds: 2), () {
          socketService.sendTyping(widget.chatId, false);
        });
      }
    }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.read<AuthProvider>().user?.id;

        return Scaffold(
          appBar: AppBar(
            title: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final chat = chatProvider.currentChat;
                final otherUser = chat?.buyerId == currentUserId ? chat?.seller : chat?.buyer;
                return Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: AppColors.grey300,
                      backgroundImage: otherUser?.avatar != null
                          ? CachedNetworkImageProvider(otherUser!.avatar!)
                          : null,
                      child: otherUser?.avatar == null
                          ? const Icon(Icons.person, size: 18, color: AppColors.grey600)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(otherUser?.fullName ?? 'Chat'),
                          if (_isTyping)
                            const Text(
                              'печатает...',
                              style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppColors.grey500),
                            ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Icon(
                  _isConnected ? Icons.wifi : Icons.wifi_off,
                  color: _isConnected ? Colors.green : AppColors.grey400,
                  size: 20,
                ),
              ),
            ],
          ),
      body: Column(
        children: [
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                if (chatProvider.isLoading && chatProvider.messages.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (chatProvider.messages.isEmpty) {
                  return const Center(
                    child: Text('No messages yet. Start the conversation!', style: TextStyle(color: AppColors.grey500)),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: chatProvider.messages.length,
                  itemBuilder: (context, index) {
                    final message = chatProvider.messages[index];
                    final isMe = message.senderId == currentUserId;
                    return _buildMessageBubble(message, isMe);
                  },
                );
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(dynamic message, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.grey200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: TextStyle(color: isMe ? AppColors.white : AppColors.black),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(message.createdAt),
              style: TextStyle(
                fontSize: 10,
                color: isMe ? AppColors.white.withOpacity(0.7) : AppColors.grey500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            decoration: InputDecoration(
                              hintText: 'Type a message...',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide.none,
                              ),
                              filled: true,
                              fillColor: AppColors.grey100,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            ),
                            textInputAction: TextInputAction.send,
                            onChanged: _onTextChanged,
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: AppColors.primary,
              child: IconButton(
                icon: const Icon(Icons.send, color: AppColors.white),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, "0")}:${dateTime.minute.toString().padLeft(2, "0")}';
  }
}
