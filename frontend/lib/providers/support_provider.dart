import 'package:flutter/foundation.dart';

import '../models/support_ticket.dart';
import '../services/api_service.dart';

class SupportProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<SupportTicket> _tickets = [];
  SupportTicket? _currentTicket;
  bool _isLoading = false;
  String? _error;

  List<SupportTicket> get tickets => _tickets;
  List<SupportTicket> get openTickets => _tickets.where((t) => t.isOpen).toList();
  List<SupportTicket> get closedTickets => _tickets.where((t) => !t.isOpen).toList();
  SupportTicket? get currentTicket => _currentTicket;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get openTicketCount => openTickets.length;

  Future<void> fetchTickets() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/support/tickets');
      if (response != null && response['tickets'] != null) {
        _tickets = (response['tickets'] as List)
            .map((json) => SupportTicket.fromJson(json))
            .toList();
        _tickets.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      }
      _error = null;
    } catch (e) {
      _error = 'Failed to load tickets';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchTicketDetails(String ticketId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/support/tickets/$ticketId');
      if (response != null && response['ticket'] != null) {
        _currentTicket = SupportTicket.fromJson(response['ticket']);
        
        final index = _tickets.indexWhere((t) => t.id == ticketId);
        if (index != -1) {
          _tickets[index] = _currentTicket!;
        }
      }
      _error = null;
    } catch (e) {
      _error = 'Failed to load ticket details';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createTicket({
    required String subject,
    required String description,
    required String category,
    String priority = 'medium',
    String? orderId,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/support/tickets', {
        'subject': subject,
        'description': description,
        'category': category,
        'priority': priority,
        'order_id': orderId,
      });

      if (response != null && response['ticket'] != null) {
        final newTicket = SupportTicket.fromJson(response['ticket']);
        _tickets.insert(0, newTicket);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Failed to create ticket';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> sendMessage(String ticketId, String content) async {
    try {
      final response = await _apiService.post('/support/tickets/$ticketId/messages', {
        'content': content,
      });

      if (response != null && response['message'] != null) {
        final newMessage = TicketMessage.fromJson(response['message']);
        
        if (_currentTicket != null && _currentTicket!.id == ticketId) {
          final updatedMessages = [..._currentTicket!.messages, newMessage];
          _currentTicket = SupportTicket(
            id: _currentTicket!.id,
            userId: _currentTicket!.userId,
            subject: _currentTicket!.subject,
            description: _currentTicket!.description,
            category: _currentTicket!.category,
            status: _currentTicket!.status,
            priority: _currentTicket!.priority,
            orderId: _currentTicket!.orderId,
            messages: updatedMessages,
            createdAt: _currentTicket!.createdAt,
            updatedAt: DateTime.now(),
          );
          notifyListeners();
        }
        return true;
      }
    } catch (e) {
      _error = 'Failed to send message';
      notifyListeners();
    }
    return false;
  }

  Future<bool> closeTicket(String ticketId) async {
    try {
      await _apiService.put('/support/tickets/$ticketId/close', {});
      
      final index = _tickets.indexWhere((t) => t.id == ticketId);
      if (index != -1) {
        _tickets[index] = SupportTicket(
          id: _tickets[index].id,
          userId: _tickets[index].userId,
          subject: _tickets[index].subject,
          description: _tickets[index].description,
          category: _tickets[index].category,
          status: 'closed',
          priority: _tickets[index].priority,
          orderId: _tickets[index].orderId,
          messages: _tickets[index].messages,
          createdAt: _tickets[index].createdAt,
          updatedAt: DateTime.now(),
          resolvedAt: DateTime.now(),
        );
      }
      
      if (_currentTicket?.id == ticketId) {
        _currentTicket = _tickets[index];
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to close ticket';
      notifyListeners();
      return false;
    }
  }

  void setCurrentTicket(SupportTicket? ticket) {
    _currentTicket = ticket;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
