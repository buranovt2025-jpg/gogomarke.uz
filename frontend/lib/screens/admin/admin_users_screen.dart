import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/admin_provider.dart';
import '../../models/user.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedRole;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    final provider = context.read<AdminProvider>();
    await provider.fetchUsers(role: _selectedRole, search: _searchController.text);
  }

  void _showUserActions(User user) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(
                user.isActive ? Icons.block : Icons.check_circle,
                color: user.isActive ? Colors.red : Colors.green,
              ),
              title: Text(user.isActive ? 'Заблокировать' : 'Разблокировать'),
              onTap: () {
                Navigator.pop(context);
                _toggleUserStatus(user);
              },
            ),
            ListTile(
              leading: const Icon(Icons.swap_horiz),
              title: const Text('Изменить роль'),
              onTap: () {
                Navigator.pop(context);
                _showRoleDialog(user);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleUserStatus(User user) async {
    final provider = context.read<AdminProvider>();
    final success = await provider.updateUser(user.id, isActive: !user.isActive);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Статус изменен' : provider.error ?? 'Ошибка'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
  }

  void _showRoleDialog(User user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Изменить роль'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildRoleOption('buyer', 'Покупатель', user),
            _buildRoleOption('seller', 'Продавец', user),
            _buildRoleOption('courier', 'Курьер', user),
            _buildRoleOption('admin', 'Админ', user),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleOption(String role, String label, User user) {
    return ListTile(
      title: Text(label),
      leading: Radio<String>(
        value: role,
        groupValue: user.role.name,
        onChanged: (value) async {
          Navigator.pop(context);
          if (value != null && value != user.role.name) {
            final provider = context.read<AdminProvider>();
            final success = await provider.updateUser(user.id, role: value);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(success ? 'Роль изменена' : provider.error ?? 'Ошибка'),
                  backgroundColor: success ? Colors.green : Colors.red,
                ),
              );
            }
          }
        },
      ),
    );
  }

  String _getRoleLabel(UserRole role) {
    switch (role) {
      case UserRole.buyer: return 'Покупатель';
      case UserRole.seller: return 'Продавец';
      case UserRole.courier: return 'Курьер';
      case UserRole.admin: return 'Админ';
    }
  }

  Color _getRoleColor(UserRole role) {
    switch (role) {
      case UserRole.buyer: return Colors.blue;
      case UserRole.seller: return Colors.green;
      case UserRole.courier: return Colors.orange;
      case UserRole.admin: return Colors.purple;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Пользователи')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Поиск по имени или телефону',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () { _searchController.clear(); _loadUsers(); },
                    ),
                  ),
                  onSubmitted: (_) => _loadUsers(),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(null, 'Все'),
                      const SizedBox(width: 8),
                      _buildFilterChip('buyer', 'Покупатели'),
                      const SizedBox(width: 8),
                      _buildFilterChip('seller', 'Продавцы'),
                      const SizedBox(width: 8),
                      _buildFilterChip('courier', 'Курьеры'),
                      const SizedBox(width: 8),
                      _buildFilterChip('admin', 'Админы'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Consumer<AdminProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) return const Center(child: CircularProgressIndicator());
                if (provider.users.isEmpty) return const Center(child: Text('Пользователи не найдены'));
                return RefreshIndicator(
                  onRefresh: _loadUsers,
                  child: ListView.builder(
                    itemCount: provider.users.length,
                    itemBuilder: (context, index) {
                      final user = provider.users[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _getRoleColor(user.role),
                            child: Text(
                              (user.firstName.isNotEmpty ? user.firstName[0] : user.phone[0]).toUpperCase(),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          title: Text(user.fullName.isNotEmpty ? user.fullName : user.phone),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user.phone),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _getRoleColor(user.role).withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(_getRoleLabel(user.role), style: TextStyle(fontSize: 12, color: _getRoleColor(user.role))),
                                  ),
                                  if (!user.isActive) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                                      child: const Text('Заблокирован', style: TextStyle(fontSize: 12, color: Colors.red)),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                          trailing: IconButton(icon: const Icon(Icons.more_vert), onPressed: () => _showUserActions(user)),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String? role, String label) {
    return FilterChip(
      label: Text(label),
      selected: _selectedRole == role,
      onSelected: (selected) { setState(() { _selectedRole = selected ? role : null; }); _loadUsers(); },
    );
  }
}
