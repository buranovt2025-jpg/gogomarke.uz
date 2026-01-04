import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../providers/chat_provider.dart';
import '../../providers/auth_provider.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  @override
  void initState() {
    super.initState();
    _loadChats();
  }

  Future<void> _loadChats() async {
    await context.read<ChatProvider>().fetchChats(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
      ),
      body: Consumer<ChatProvider>(
        builder: (context, chatProvider, child) {
          if (chatProvider.isLoading && chatProvider.chats.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (chatProvider.chats.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.chat_bubble_outline, size: 80, color: AppColors.grey400),
                  const SizedBox(height: 16),
                  const Text('No messages yet', style: TextStyle(fontSize: 18, color: AppColors.grey600)),
                  const SizedBox(height: 8),
                  const Text('Start a conversation with a seller', style: TextStyle(color: AppColors.grey500)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadChats,
            child: ListView.builder(
              itemCount: chatProvider.chats.length,
              itemBuilder: (context, index) {
                final chat = chatProvider.chats[index];
                final currentUserId = context.read<AuthProvider>().user?.id;
                final otherUser = chat.buyerId == currentUserId ? chat.seller : chat.buyer;

                return ListTile(
                  leading: CircleAvatar(
                    radius: 24,
                    backgroundColor: AppColors.grey300,
                    backgroundImage: otherUser?.avatar != null
                        ? CachedNetworkImageProvider(otherUser!.avatar!)
                        : null,
                    child: otherUser?.avatar == null
                        ? const Icon(Icons.person, color: AppColors.grey600)
                        : null,
                  ),
                  title: Text(
                    otherUser?.fullName ?? 'User',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    chat.lastMessage?.content ?? 'No messages',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: chat.unreadCount > 0 ? AppColors.black : AppColors.grey500,
                      fontWeight: chat.unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _formatTime(chat.updatedAt),
                        style: const TextStyle(fontSize: 12, color: AppColors.grey500),
                      ),
                      if (chat.unreadCount > 0) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            chat.unreadCount.toString(),
                            style: const TextStyle(color: AppColors.white, fontSize: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                  onTap: () {
                    chatProvider.setCurrentChat(chat);
                    Navigator.pushNamed(context, '/chat/${chat.id}');
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inDays == 0) {
      return '${dateTime.hour.toString().padLeft(2, "0")}:${dateTime.minute.toString().padLeft(2, "0")}';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[dateTime.weekday - 1];
    } else {
      return '${dateTime.day}/${dateTime.month}';
    }
  }
}
