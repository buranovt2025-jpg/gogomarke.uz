import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/locale_provider.dart';
import '../../providers/settings_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SettingsProvider>().loadSettings();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: Consumer<SettingsProvider>(
        builder: (context, settingsProvider, child) {
          return ListView(
            children: [
              _buildSectionHeader(context, 'General'),
              Consumer<LocaleProvider>(
                builder: (context, localeProvider, child) {
                  return ListTile(
                    leading: const Icon(Icons.language),
                    title: const Text('Language'),
                    subtitle: Text(localeProvider.currentLanguageName),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _showLanguageDialog(context),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.dark_mode_outlined),
                title: const Text('Theme'),
                subtitle: Text(settingsProvider.themeModeLabel),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showThemeDialog(context, settingsProvider),
              ),
              ListTile(
                leading: const Icon(Icons.notifications_outlined),
                title: const Text('Notifications'),
                trailing: Switch(
                  value: settingsProvider.notificationsEnabled,
                  onChanged: (value) => settingsProvider.setNotificationsEnabled(value),
                ),
              ),
              _buildSectionHeader(context, 'Video'),
              ListTile(
                leading: const Icon(Icons.play_circle_outline),
                title: const Text('Auto-play Videos'),
                trailing: Switch(
                  value: settingsProvider.autoPlayVideos,
                  onChanged: (value) => settingsProvider.setAutoPlayVideos(value),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.data_usage),
                title: const Text('Data Usage'),
                subtitle: Text(settingsProvider.dataUsageModeLabel),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showDataUsageDialog(context, settingsProvider),
              ),
              _buildSectionHeader(context, 'Security'),
              ListTile(
                leading: const Icon(Icons.lock_outline),
                title: const Text('Change Password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Password change coming soon')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.fingerprint),
                title: const Text('Biometric Login'),
                trailing: Switch(
                  value: settingsProvider.biometricEnabled,
                  onChanged: (value) => settingsProvider.setBiometricEnabled(value),
                ),
              ),
              _buildSectionHeader(context, 'About'),
              ListTile(
                leading: const Icon(Icons.description_outlined),
                title: const Text('Terms of Service'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Terms of Service coming soon')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined),
                title: const Text('Privacy Policy'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Privacy Policy coming soon')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('App Version'),
                subtitle: const Text('1.0.0'),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: OutlinedButton(
                  onPressed: () => _showResetDialog(context, settingsProvider),
                  child: const Text('Reset to Defaults'),
                ),
              ),
              const SizedBox(height: 32),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
          color: AppColors.grey600,
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('English'),
              onTap: () {
                context.read<LocaleProvider>().setLocale(const Locale('en'));
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('Русский'),
              onTap: () {
                context.read<LocaleProvider>().setLocale(const Locale('ru'));
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text("O'zbekcha"),
              onTap: () {
                context.read<LocaleProvider>().setLocale(const Locale('uz'));
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showThemeDialog(BuildContext context, SettingsProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Theme'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<ThemeMode>(
              title: const Text('System'),
              value: ThemeMode.system,
              groupValue: provider.themeMode,
              onChanged: (value) {
                provider.setThemeMode(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<ThemeMode>(
              title: const Text('Light'),
              value: ThemeMode.light,
              groupValue: provider.themeMode,
              onChanged: (value) {
                provider.setThemeMode(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<ThemeMode>(
              title: const Text('Dark'),
              value: ThemeMode.dark,
              groupValue: provider.themeMode,
              onChanged: (value) {
                provider.setThemeMode(value!);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showDataUsageDialog(BuildContext context, SettingsProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Data Usage'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('Auto'),
              subtitle: const Text('Use Wi-Fi when available'),
              value: 'auto',
              groupValue: provider.dataUsageMode,
              onChanged: (value) {
                provider.setDataUsageMode(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('Wi-Fi Only'),
              subtitle: const Text('Only download on Wi-Fi'),
              value: 'wifi_only',
              groupValue: provider.dataUsageMode,
              onChanged: (value) {
                provider.setDataUsageMode(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('Always'),
              subtitle: const Text('Use mobile data freely'),
              value: 'always',
              groupValue: provider.dataUsageMode,
              onChanged: (value) {
                provider.setDataUsageMode(value!);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showResetDialog(BuildContext context, SettingsProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Settings'),
        content: const Text('Are you sure you want to reset all settings to their default values?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              provider.resetSettings();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Settings reset to defaults')),
              );
            },
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }
}
