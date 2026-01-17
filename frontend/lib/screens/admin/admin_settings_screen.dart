import 'package:flutter/material.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class AdminSettingsScreen extends StatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  State<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends State<AdminSettingsScreen> {
  bool _maintenanceMode = false;
  bool _registrationEnabled = true;
  bool _emailVerificationRequired = true;
  bool _smsVerificationEnabled = true;
  double _platformFee = 5.0;
  double _deliveryBaseFee = 10000;
  int _maxProductsPerSeller = 100;
  int _maxImagesSizePerProduct = 5;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Настройки системы'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // System Status Card
          _buildSectionCard(
            title: 'Статус системы',
            icon: Icons.settings_applications,
            children: [
              SwitchListTile(
                title: const Text('Режим обслуживания'),
                subtitle: const Text('Закрыть доступ для пользователей'),
                value: _maintenanceMode,
                onChanged: (value) {
                  setState(() => _maintenanceMode = value);
                  _showSaveSnackBar();
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Registration Settings
          _buildSectionCard(
            title: 'Регистрация и верификация',
            icon: Icons.person_add,
            children: [
              SwitchListTile(
                title: const Text('Регистрация открыта'),
                subtitle: const Text('Разрешить новым пользователям регистрироваться'),
                value: _registrationEnabled,
                onChanged: (value) {
                  setState(() => _registrationEnabled = value);
                  _showSaveSnackBar();
                },
              ),
              const Divider(),
              SwitchListTile(
                title: const Text('Верификация Email'),
                subtitle: const Text('Требовать подтверждение email'),
                value: _emailVerificationRequired,
                onChanged: (value) {
                  setState(() => _emailVerificationRequired = value);
                  _showSaveSnackBar();
                },
              ),
              const Divider(),
              SwitchListTile(
                title: const Text('SMS верификация'),
                subtitle: const Text('Верификация по SMS'),
                value: _smsVerificationEnabled,
                onChanged: (value) {
                  setState(() => _smsVerificationEnabled = value);
                  _showSaveSnackBar();
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Financial Settings
          _buildSectionCard(
            title: 'Финансовые настройки',
            icon: Icons.attach_money,
            children: [
              ListTile(
                title: const Text('Комиссия платформы'),
                subtitle: Text('$_platformFee%'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => _showEditDialog(
                    'Комиссия платформы (%)',
                    _platformFee.toString(),
                    (value) {
                      setState(() => _platformFee = double.tryParse(value) ?? 5.0);
                      _showSaveSnackBar();
                    },
                  ),
                ),
              ),
              const Divider(),
              ListTile(
                title: const Text('Базовая стоимость доставки'),
                subtitle: Text('${_deliveryBaseFee.toStringAsFixed(0)} сум'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => _showEditDialog(
                    'Базовая стоимость доставки (сум)',
                    _deliveryBaseFee.toString(),
                    (value) {
                      setState(() => _deliveryBaseFee = double.tryParse(value) ?? 10000);
                      _showSaveSnackBar();
                    },
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Product Settings
          _buildSectionCard(
            title: 'Настройки товаров',
            icon: Icons.inventory,
            children: [
              ListTile(
                title: const Text('Макс. товаров у продавца'),
                subtitle: Text('$_maxProductsPerSeller товаров'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => _showEditDialog(
                    'Максимум товаров на продавца',
                    _maxProductsPerSeller.toString(),
                    (value) {
                      setState(() => _maxProductsPerSeller = int.tryParse(value) ?? 100);
                      _showSaveSnackBar();
                    },
                  ),
                ),
              ),
              const Divider(),
              ListTile(
                title: const Text('Макс. изображений на товар'),
                subtitle: Text('$_maxImagesSizePerProduct изображений'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => _showEditDialog(
                    'Максимум изображений на товар',
                    _maxImagesSizePerProduct.toString(),
                    (value) {
                      setState(() => _maxImagesSizePerProduct = int.tryParse(value) ?? 5);
                      _showSaveSnackBar();
                    },
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Admin Actions
          _buildSectionCard(
            title: 'Действия администратора',
            icon: Icons.admin_panel_settings,
            children: [
              ListTile(
                leading: const Icon(Icons.refresh, color: Colors.blue),
                title: const Text('Очистить кэш'),
                subtitle: const Text('Очистить системный кэш'),
                onTap: () {
                  _showConfirmDialog(
                    'Очистить кэш?',
                    'Это действие очистит весь системный кэш.',
                    () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Кэш очищен')),
                      );
                    },
                  );
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.sync, color: Colors.green),
                title: const Text('Синхронизация данных'),
                subtitle: const Text('Синхронизировать данные с бэкендом'),
                onTap: () {
                  _showConfirmDialog(
                    'Синхронизировать данные?',
                    'Это может занять некоторое время.',
                    () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Синхронизация запущена')),
                      );
                    },
                  );
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.backup, color: Colors.orange),
                title: const Text('Создать бэкап'),
                subtitle: const Text('Создать резервную копию базы данных'),
                onTap: () {
                  _showConfirmDialog(
                    'Создать бэкап?',
                    'Будет создана резервная копия всех данных.',
                    () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Бэкап создан')),
                      );
                    },
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Danger Zone
          _buildSectionCard(
            title: 'Опасная зона',
            icon: Icons.warning,
            titleColor: Colors.red,
            children: [
              ListTile(
                leading: const Icon(Icons.delete_forever, color: Colors.red),
                title: const Text('Очистить тестовые данные', 
                  style: TextStyle(color: Colors.red)),
                subtitle: const Text('Удалить все тестовые данные'),
                onTap: () {
                  _showConfirmDialog(
                    'Удалить тестовые данные?',
                    'Это действие необратимо!',
                    () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Тестовые данные удалены')),
                      );
                    },
                    isDangerous: true,
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
    Color? titleColor,
  }) {
    return Card(
      elevation: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(icon, color: titleColor ?? Theme.of(context).primaryColor),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: titleColor,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ...children,
        ],
      ),
    );
  }

  void _showEditDialog(String title, String currentValue, Function(String) onSave) {
    final controller = TextEditingController(text: currentValue);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () {
              onSave(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
  }

  void _showConfirmDialog(String title, String message, VoidCallback onConfirm, {bool isDangerous = false}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            style: isDangerous 
              ? ElevatedButton.styleFrom(backgroundColor: Colors.red)
              : null,
            onPressed: () {
              Navigator.pop(context);
              onConfirm();
            },
            child: Text(isDangerous ? 'Удалить' : 'Подтвердить'),
          ),
        ],
      ),
    );
  }

  void _showSaveSnackBar() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Настройки сохранены'),
        duration: Duration(seconds: 1),
      ),
    );
  }
}
