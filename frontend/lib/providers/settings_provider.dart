import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  static const String _themeKey = 'theme_mode';
  static const String _notificationsKey = 'notifications_enabled';
  static const String _biometricKey = 'biometric_enabled';
  static const String _autoPlayVideosKey = 'auto_play_videos';
  static const String _dataUsageKey = 'data_usage_mode';
  static const String _currencyKey = 'currency';

  ThemeMode _themeMode = ThemeMode.system;
  bool _notificationsEnabled = true;
  bool _biometricEnabled = false;
  bool _autoPlayVideos = true;
  String _dataUsageMode = 'auto';
  String _currency = 'UZS';
  bool _isLoading = false;

  ThemeMode get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get biometricEnabled => _biometricEnabled;
  bool get autoPlayVideos => _autoPlayVideos;
  String get dataUsageMode => _dataUsageMode;
  String get currency => _currency;
  bool get isLoading => _isLoading;

  String get themeModeLabel {
    switch (_themeMode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }

  String get dataUsageModeLabel {
    switch (_dataUsageMode) {
      case 'wifi_only':
        return 'Wi-Fi Only';
      case 'always':
        return 'Always';
      case 'auto':
      default:
        return 'Auto';
    }
  }

  Future<void> loadSettings() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      
      final themeIndex = prefs.getInt(_themeKey) ?? 0;
      _themeMode = ThemeMode.values[themeIndex];
      
      _notificationsEnabled = prefs.getBool(_notificationsKey) ?? true;
      _biometricEnabled = prefs.getBool(_biometricKey) ?? false;
      _autoPlayVideos = prefs.getBool(_autoPlayVideosKey) ?? true;
      _dataUsageMode = prefs.getString(_dataUsageKey) ?? 'auto';
      _currency = prefs.getString(_currencyKey) ?? 'UZS';
    } catch (e) {
      debugPrint('Error loading settings: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_themeKey, mode.index);
    } catch (e) {
      debugPrint('Error saving theme mode: $e');
    }
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    _notificationsEnabled = enabled;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_notificationsKey, enabled);
    } catch (e) {
      debugPrint('Error saving notifications setting: $e');
    }
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    _biometricEnabled = enabled;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_biometricKey, enabled);
    } catch (e) {
      debugPrint('Error saving biometric setting: $e');
    }
  }

  Future<void> setAutoPlayVideos(bool enabled) async {
    _autoPlayVideos = enabled;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_autoPlayVideosKey, enabled);
    } catch (e) {
      debugPrint('Error saving auto play setting: $e');
    }
  }

  Future<void> setDataUsageMode(String mode) async {
    _dataUsageMode = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_dataUsageKey, mode);
    } catch (e) {
      debugPrint('Error saving data usage mode: $e');
    }
  }

  Future<void> setCurrency(String currency) async {
    _currency = currency;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_currencyKey, currency);
    } catch (e) {
      debugPrint('Error saving currency: $e');
    }
  }

  Future<void> resetSettings() async {
    _themeMode = ThemeMode.system;
    _notificationsEnabled = true;
    _biometricEnabled = false;
    _autoPlayVideos = true;
    _dataUsageMode = 'auto';
    _currency = 'UZS';
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_themeKey);
      await prefs.remove(_notificationsKey);
      await prefs.remove(_biometricKey);
      await prefs.remove(_autoPlayVideosKey);
      await prefs.remove(_dataUsageKey);
      await prefs.remove(_currencyKey);
    } catch (e) {
      debugPrint('Error resetting settings: $e');
    }
  }
}
