import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/support_provider.dart';
import '../../providers/auth_provider.dart';

class TicketDetailScreen extends StatefulWidget {
  final String ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SupportProvider>().fetchTicketDetails(widget.ticketId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
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
    final success = await context.read<SupportProvider>().sendMessage(widget.ticketId, content);
    if (success) {
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.read<AuthProvider>().user?.id;

    return Scaffold(
      appBar: AppBar(
        title: Consumer<SupportProvider>(
          builder: (context, provider, child) {
            final ticket = provider.currentTicket;
            return Text(ticket?.subject ?? 'Ticket Details');
          },
        ),
        actions: [
          Consumer<SupportProvider>(
            builder: (context, provider, child) {
              final ticket = provider.currentTicket;
              if (ticket == null || !ticket.isOpen) return const SizedBox.shrink();
              return IconButton(
                icon: const Icon(Icons.check_circle_outline),
                onPressed: () => _showCloseDialog(context),
                tooltip: 'Close Ticket',
              );
            },
          ),
        ],
      ),
      body: Consumer<SupportProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.currentTicket == null) {
            return const Center(child: CircularProgressIndicator());
          }

          final ticket = provider.currentTicket;
          if (ticket == null) {
            return const Center(child: Text('Ticket not found'));
          }

          return Column(
            children: [
              _buildTicketInfo(ticket),
              Expanded(
                child: ticket.messages.isEmpty
                    ? const Center(
                        child: Text('No messages yet', style: TextStyle(color: AppColors.grey500)),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: ticket.messages.length,
                        itemBuilder: (context, index) {
                          final message = ticket.messages[index];
                          final isMe = message.senderId == currentUserId;
                          return _buildMessageBubble(message, isMe);
                        },
                      ),
              ),
              if (ticket.isOpen) _buildMessageInput(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTicketInfo(dynamic ticket) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(ticket.status).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  ticket.statusLabel,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(ticket.status),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.grey200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  ticket.categoryLabel,
                  style: const TextStyle(fontSize: 12, color: AppColors.grey600),
                ),
              ),
              const Spacer(),
              Text(
                ticket.formattedDate,
                style: const TextStyle(fontSize: 12, color: AppColors.grey500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            ticket.description,
            style: const TextStyle(color: AppColors.grey600),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(dynamic message, bool isMe) {
    return Align(
      alignment: message.isSystem 
          ? Alignment.center 
          : (isMe ? Alignment.centerRight : Alignment.centerLeft),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: message.isSystem 
              ? double.infinity 
              : MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: message.isSystem
              ? AppColors.grey100
              : (isMe ? AppColors.primary : AppColors.grey200),
          borderRadius: message.isSystem
              ? BorderRadius.circular(8)
              : BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 16),
                ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMe && !message.isSystem)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  message.isFromAdmin ? 'Support' : 'You',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isMe ? AppColors.white.withValues(alpha: 0.7) : AppColors.grey600,
                  ),
                ),
              ),
            Text(
              message.content,
              style: TextStyle(
                color: message.isSystem
                    ? AppColors.grey600
                    : (isMe ? AppColors.white : AppColors.black),
                fontStyle: message.isSystem ? FontStyle.italic : FontStyle.normal,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              message.formattedTime,
              style: TextStyle(
                fontSize: 10,
                color: message.isSystem
                    ? AppColors.grey500
                    : (isMe ? AppColors.white.withValues(alpha: 0.7) : AppColors.grey500),
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
            color: Colors.black.withValues(alpha: 0.05),
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
                  hintText: 'Type your message...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: AppColors.grey100,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                textInputAction: TextInputAction.send,
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'open':
        return AppColors.primary;
      case 'in_progress':
        return Colors.blue;
      case 'resolved':
        return AppColors.success;
      case 'closed':
        return AppColors.grey500;
      default:
        return AppColors.grey500;
    }
  }

  void _showCloseDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Close Ticket'),
        content: const Text('Are you sure you want to close this ticket?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await context.read<SupportProvider>().closeTicket(widget.ticketId);
            },
            child: const Text('Close Ticket'),
          ),
        ],
      ),
    );
  }
}
