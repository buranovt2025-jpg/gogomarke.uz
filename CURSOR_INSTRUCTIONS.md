# 🖱️ Cursor — Инструкции для Frontend (Web + Mobile)

**Проект:** GoGoMarket  
**Роль:** Frontend разработка (React Web + Flutter Mobile)  
**Метка для отчетов:** `[CURSOR-REPORT]`  
**Дата создания:** 13 января 2026 г.

---

## 📋 Содержание

1. [Общая информация](#1-общая-информация)
2. [Задачи Фазы 0](#2-задачи-фазы-0-критические-исправления-безопасности)
3. [Детальные инструкции](#3-детальные-инструкции)
4. [Формат отчета](#4-формат-отчета)
5. [Чеклист выполнения](#5-чеклист-выполнения)
6. [Координация с Copilot](#6-координация-с-copilot)
7. [Пример отчета](#7-пример-отчета)

---

## 1. Общая информация

### Структура проекта

```
frontend/                          # Flutter Mobile App
├── lib/
│   ├── config/
│   │   └── api_config.dart        # ⚠️ ТВОЙ ФАЙЛ - URL API
│   ├── services/
│   │   └── api_service.dart
│   ├── providers/
│   └── ...
├── android/
│   └── app/
│       └── src/
│           └── main/
│               ├── AndroidManifest.xml    # ⚠️ ТВОЙ ФАЙЛ
│               └── res/
│                   └── xml/
│                       └── network_security_config.xml  # ⚠️ СОЗДАТЬ
│       └── build.gradle.kts       # ⚠️ ТВОЙ ФАЙЛ - signing
└── pubspec.yaml

web/                               # React Web App
├── src/
│   ├── api/
│   │   └── api.ts                 # ⚠️ ТВОЙ ФАЙЛ - URL API
│   ├── contexts/
│   ├── components/
│   └── ...
├── .env                           # ⚠️ ТВОЙ ФАЙЛ
└── package.json
```

### Технологии

**Mobile (Flutter):**
- Flutter 3.x
- Dart
- Provider для state management
- Dio для HTTP

**Web (React):**
- React 18
- TypeScript
- Vite
- Tailwind CSS

### Правила работы

1. **Все изменения в отдельной ветке:** `cursor/phase0-security`
2. **НЕ трогай backend файлы** (backend/)
3. **Коммитируй каждую задачу отдельно**
4. **Тестируй перед коммитом**
5. **Отчитывайся после каждой задачи**

---

## 2. Задачи Фазы 0 (Критические исправления безопасности)

### 📊 Обзор задач

| ID | Задача | Приоритет | Срок | Платформа | Файлы |
|----|--------|-----------|------|-----------|-------|
| F0.1 | Переключить API на HTTPS | P0 | 0.5 дня | Mobile | `api_config.dart` |
| F0.2 | Убрать usesCleartextTraffic | P0 | 0.5 дня | Mobile | `AndroidManifest.xml` |
| F0.3 | Создать production keystore | P0 | 1 день | Mobile | `build.gradle.kts` |
| F0.4 | Настроить release signing | P0 | 0.5 дня | Mobile | `build.gradle.kts` |
| F0.5 | Ограничить Firebase API ключи | P0 | 0.5 дня | Mobile | Firebase Console |
| F0.6 | Добавить network_security_config | P0 | 0.5 дня | Mobile | `res/xml/` |
| F0.7 | Обновить API URL в Web | P1 | 0.5 дня | Web | `api.ts`, `.env` |

### 🔥 Порядок выполнения

```
Mobile:
1. F0.3 (keystore) → 2. F0.4 (signing) → 3. F0.1 (HTTPS)
                                               ↓
4. F0.6 (network config) → 5. F0.2 (cleartext) → 6. F0.5 (Firebase)

Web (параллельно):
7. F0.7 (API URL)
```

---

## 3. Детальные инструкции

### 📱 Mobile (Flutter) задачи

---

### 📌 F0.1 — Переключить API на HTTPS

**Проблема:**  
Приложение использует HTTP и hardcoded IP `64.226.94.133`.

**Текущий код (примерно в `api_config.dart`):**
```dart
class ApiConfig {
  static const String baseUrl = 'http://64.226.94.133:3001';
}
```

**Требуемые изменения:**

1. Создать конфигурацию для разных окружений (`lib/config/api_config.dart`):

```dart
import 'package:flutter/foundation.dart';

enum Environment { development, staging, production }

class ApiConfig {
  static Environment _environment = kReleaseMode 
      ? Environment.production 
      : Environment.development;

  static void setEnvironment(Environment env) {
    _environment = env;
  }

  static String get baseUrl {
    switch (_environment) {
      case Environment.development:
        return 'http://localhost:3001';
      case Environment.staging:
        return 'https://staging-api.gogomarke.uz';
      case Environment.production:
        return 'https://api.gogomarke.uz';
    }
  }

  static String get wsUrl {
    switch (_environment) {
      case Environment.development:
        return 'ws://localhost:3001';
      case Environment.staging:
        return 'wss://staging-api.gogomarke.uz';
      case Environment.production:
        return 'wss://api.gogomarke.uz';
    }
  }

  static bool get isProduction => _environment == Environment.production;
  
  // Таймауты
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
```

2. Обновить использование в сервисах:
```dart
// В api_service.dart
final dio = Dio(BaseOptions(
  baseUrl: ApiConfig.baseUrl,
  connectTimeout: ApiConfig.connectTimeout,
  receiveTimeout: ApiConfig.receiveTimeout,
));
```

**Тестирование:**
```bash
# В debug режиме должен использовать development URL
flutter run --debug

# В release режиме должен использовать production URL
flutter run --release
```

**Файлы для изменения:**
- `frontend/lib/config/api_config.dart`
- `frontend/lib/services/api_service.dart`

---

### 📌 F0.2 — Убрать usesCleartextTraffic=true

**Проблема:**  
В AndroidManifest.xml разрешен незашифрованный HTTP трафик.

**Текущий код:**
```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

**Требуемые изменения:**

1. Убрать или установить в `false`:
```xml
<application
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

**⚠️ ВАЖНО:** Эту задачу делать ПОСЛЕ F0.1 и F0.6, иначе приложение перестанет работать!

**Файлы для изменения:**
- `frontend/android/app/src/main/AndroidManifest.xml`

---

### 📌 F0.3 — Создать production keystore

**Проблема:**  
Приложение подписано debug ключом, нельзя публиковать в Play Store.

**Требуемые действия:**

1. Сгенерировать production keystore:
```bash
cd frontend/android

keytool -genkey -v \
  -keystore gogomarket-release.keystore \
  -alias gogomarket \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <СИЛЬНЫЙ_ПАРОЛЬ> \
  -keypass <СИЛЬНЫЙ_ПАРОЛЬ> \
  -dname "CN=GoGoMarket, OU=Mobile, O=GoGoMarke LLC, L=Tashkent, ST=Tashkent, C=UZ"
```

2. Создать файл `key.properties` (НЕ коммитить в git!):
```properties
storePassword=<СИЛЬНЫЙ_ПАРОЛЬ>
keyPassword=<СИЛЬНЫЙ_ПАРОЛЬ>
keyAlias=gogomarket
storeFile=gogomarket-release.keystore
```

3. Добавить `key.properties` в `.gitignore`:
```gitignore
# Keystore
*.keystore
key.properties
```

**⚠️ ВАЖНО:**
- Сохрани keystore и пароли в безопасном месте!
- Потеря keystore = невозможность обновить приложение в Play Store
- Никогда не коммить keystore и пароли в git

**Файлы для создания:**
- `frontend/android/gogomarket-release.keystore` (НЕ в git)
- `frontend/android/key.properties` (НЕ в git)

**Файлы для изменения:**
- `frontend/android/.gitignore`

---

### 📌 F0.4 — Настроить release signing config

**Проблема:**  
Release build не настроен для production подписи.

**Требуемые изменения в `build.gradle.kts`:**

```kotlin
import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

// Загрузка ключей
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "uz.gogomarke.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "uz.gogomarke.app"
        minSdk = 21
        targetSdk = 34
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
            // Для debug можно оставить HTTP
            manifestPlaceholders["usesCleartextTraffic"] = "true"
        }
        
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
            // Запретить HTTP в production
            manifestPlaceholders["usesCleartextTraffic"] = "false"
        }
    }
}
```

**Тестирование:**
```bash
# Сборка release APK
flutter build apk --release

# Проверка подписи
jarsigner -verify -verbose -certs build/app/outputs/flutter-apk/app-release.apk
```

**Файлы для изменения:**
- `frontend/android/app/build.gradle.kts`

---

### 📌 F0.5 — Ограничить Firebase API ключи

**Проблема:**  
Firebase API ключи в коде не ограничены, могут быть использованы злоумышленниками.

**Требуемые действия (в Firebase Console):**

1. Перейти в [Firebase Console](https://console.firebase.google.com/)
2. Выбрать проект GoGoMarket
3. Settings → Project settings → General
4. Найти Android приложение
5. Настроить API restrictions:
   - В Google Cloud Console
   - APIs & Services → Credentials
   - Выбрать Android API Key
   - Добавить ограничения:
     - Application restrictions: Android apps
     - SHA-1 fingerprint: добавить fingerprints для debug и release
     - Package name: `uz.gogomarke.app`

6. Получить SHA-1 fingerprints:
```bash
# Debug
cd frontend/android
keytool -list -v -alias androiddebugkey \
  -keystore ~/.android/debug.keystore \
  -storepass android

# Release
keytool -list -v -alias gogomarket \
  -keystore gogomarket-release.keystore
```

**Документировать:**
- Записать SHA-1 fingerprints в документацию
- Убедиться, что ключи ограничены по package name

---

### 📌 F0.6 — Добавить network_security_config.xml

**Проблема:**  
Нет конфигурации сетевой безопасности.

**Создать файл `frontend/android/app/src/main/res/xml/network_security_config.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Production: только HTTPS -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <!-- Исключение для development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain> <!-- Android Emulator -->
        <domain includeSubdomains="true">192.168.</domain> <!-- Local network -->
    </domain-config>

    <!-- Production domains -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">gogomarke.uz</domain>
        <domain includeSubdomains="true">api.gogomarke.uz</domain>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

**Обновить AndroidManifest.xml:**
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

**Файлы для создания:**
- `frontend/android/app/src/main/res/xml/network_security_config.xml`

**Файлы для изменения:**
- `frontend/android/app/src/main/AndroidManifest.xml`

---

### 🌐 Web (React) задачи

---

### 📌 F0.7 — Обновить API URL в Web

**Проблема:**  
Возможно hardcoded IP или HTTP в web приложении.

**Проверить и обновить:**

1. Найти все hardcoded URL:
```bash
grep -rn "64.226.94.133" web/
grep -rn "http://" web/src/
```

2. Обновить `.env`:
```env
VITE_API_URL=https://api.gogomarke.uz
VITE_WS_URL=wss://api.gogomarke.uz
```

3. Обновить `api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

4. Создать `.env.example`:
```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Production:
# VITE_API_URL=https://api.gogomarke.uz
# VITE_WS_URL=wss://api.gogomarke.uz
```

**Файлы для изменения:**
- `web/.env`
- `web/.env.example` (создать)
- `web/src/api/api.ts`

---

## 4. Формат отчета

### Обязательные поля

Каждый отчет ДОЛЖЕН содержать:

```markdown
## [CURSOR-REPORT]

**Дата:** YYYY-MM-DD HH:MM (UTC+5)
**Задача:** ID и название задачи
**Платформа:** Mobile / Web / Обе
**Статус:** ✅ Завершено | ⏳ В процессе | 🚫 Заблокировано

### Выполненные действия
- [ ] Действие 1
- [ ] Действие 2

### Измененные файлы
| Файл | Платформа | Тип изменения |
|------|-----------|---------------|
| `path/to/file` | Mobile/Web | Модификация / Создание / Удаление |

### Проблемы и решения
| Проблема | Решение |
|----------|----------|
| Описание | Как решил |

### Коммит
```
git commit -m "feat(security): описание изменений"
```

### Следующие шаги
1. Следующая задача
2. ...

### Время работы
- Начало: HH:MM
- Окончание: HH:MM
- Всего: X часов Y минут
```

---

## 5. Чеклист выполнения

### Глобальный чеклист Фазы 0 (Frontend)

#### Mobile (Flutter)

- [ ] **F0.1** API использует HTTPS
  - [ ] `api_config.dart` обновлен
  - [ ] Environment-based URLs настроены
  - [ ] Тест в release режиме пройден

- [ ] **F0.2** usesCleartextTraffic=false
  - [ ] AndroidManifest.xml обновлен
  - [ ] Приложение работает без HTTP

- [ ] **F0.3** Production keystore создан
  - [ ] Keystore сгенерирован
  - [ ] key.properties создан
  - [ ] Пароли сохранены в безопасном месте
  - [ ] .gitignore обновлен

- [ ] **F0.4** Release signing настроен
  - [ ] build.gradle.kts обновлен
  - [ ] Release APK собирается
  - [ ] APK подписан production ключом

- [ ] **F0.5** Firebase API ключи ограничены
  - [ ] SHA-1 fingerprints добавлены
  - [ ] Package name ограничение установлено
  - [ ] Документация обновлена

- [ ] **F0.6** network_security_config добавлен
  - [ ] XML файл создан
  - [ ] AndroidManifest.xml ссылается на конфиг
  - [ ] HTTPS работает в production

#### Web (React)

- [ ] **F0.7** API URL обновлен
  - [ ] Нет hardcoded IP
  - [ ] .env настроен
  - [ ] .env.example создан
  - [ ] HTTPS используется в production

---

## 6. Координация с Copilot

### ⚠️ Файлы, которые трогает ТОЛЬКО Cursor (Frontend)

```
frontend/                        # Flutter
├── lib/                         ← ТОЛЬКО ТЫ
├── android/
│   ├── app/
│   │   ├── src/main/            ← ТОЛЬКО ТЫ
│   │   └── build.gradle.kts     ← ТОЛЬКО ТЫ
│   └── .gitignore               ← ТОЛЬКО ТЫ
└── pubspec.yaml                 ← ТОЛЬКО ТЫ

web/                             # React
├── src/                         ← ТОЛЬКО ТЫ
├── .env                         ← ТОЛЬКО ТЫ
└── package.json                 ← ТОЛЬКО ТЫ
```

### ❌ Файлы, которые трогает ТОЛЬКО Copilot (Backend)

```
backend/                         ← НЕ ТРОГАЙ
```

### 🔄 Точки синхронизации

| Событие | Действие |
|---------|----------|
| Backend изменил API URL | Обновить `api_config.dart` и `api.ts` |
| Backend изменил формат ответа | Обновить типы в frontend |
| Backend добавил новый endpoint | Добавить в api сервисы |
| Нужен новый env для backend | Запросить у Copilot |

### ⏰ Когда ждать Backend

| Моя задача | Зависимость от Backend | Действие |
|------------|------------------------|----------|
| F0.1 (HTTPS) | Backend должен поднять HTTPS | Ждать B0.1 (CORS) |
| F0.2 (cleartext) | API должен работать по HTTPS | Ждать B0.1 |
| F0.7 (Web API) | Backend API URL | Ждать B0.6 (IP) |

### 🌿 Работа с Git

```bash
# Твоя ветка
git checkout -b cursor/phase0-security

# После каждой задачи
git add .
git commit -m "feat(security): F0.X - описание"

# Перед созданием PR - получить изменения
git fetch origin
git rebase origin/main

# Push
git push origin cursor/phase0-security
```

### Избежание конфликтов

1. **Никогда не редактируй файлы Copilot** (backend/)
2. **Каждая задача = отдельный коммит**
3. **При конфликте в общих файлах** — обсуди с Copilot
4. **Синхронизация после завершения фазы**

---

## 7. Пример отчета

```markdown
## [CURSOR-REPORT]

**Дата:** 2026-01-14 11:00 (UTC+5)  
**Задача:** F0.3 — Создать production keystore  
**Платформа:** Mobile  
**Статус:** ✅ Завершено

### Выполненные действия
- [x] Сгенерирован production keystore с 2048-bit RSA
- [x] Создан key.properties с паролями
- [x] Keystore и пароли сохранены в безопасном месте (менеджер паролей)
- [x] Обновлен .gitignore для исключения keystore файлов
- [x] Проверена подпись через keytool -list

### Измененные файлы
| Файл | Платформа | Тип изменения |
|------|-----------|---------------|
| `frontend/android/.gitignore` | Mobile | Модификация |
| `frontend/android/gogomarket-release.keystore` | Mobile | Создание (не в git) |
| `frontend/android/key.properties` | Mobile | Создание (не в git) |

### Проблемы и решения
| Проблема | Решение |
|----------|----------|
| Не было установлено keytool | Использовал keytool из Android Studio JDK |

### Коммит
```
git commit -m "chore(android): F0.3 - добавить gitignore для keystore

- Исключить *.keystore из git
- Исключить key.properties из git
- Keystore создан локально

Security: keystore хранится отдельно от репозитория"
```

### Безопасность
⚠️ **Keystore credentials:**
- Сохранены в: [Менеджер паролей / Vault]
- SHA-1 (release): `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`
- Package: `uz.gogomarke.app`

### Следующие шаги
1. F0.4 — Настроить release signing config
2. F0.1 — Переключить API на HTTPS (после Backend)

### Время работы
- Начало: 10:00
- Окончание: 11:00
- Всего: 1 час
```

---

## 📚 Полезные команды

### Flutter (Mobile)

```bash
# Запуск в debug режиме
flutter run

# Сборка release APK
flutter build apk --release

# Сборка App Bundle для Play Store
flutter build appbundle --release

# Проверка подписи APK
jarsigner -verify -verbose -certs build/app/outputs/flutter-apk/app-release.apk

# Получить SHA-1 fingerprint
keytool -list -v -alias gogomarket -keystore android/gogomarket-release.keystore

# Анализ размера приложения
flutter build apk --analyze-size
```

### React (Web)

```bash
# Запуск в dev режиме
npm run dev

# Сборка production
npm run build

# Поиск hardcoded значений
grep -rn "64.226.94.133" src/
grep -rn "http://" src/

# Проверка типов
npm run type-check
```

---

**Приступай к работе!** Начни с задачи **F0.3** (keystore) — это независимая задача, которую можно делать параллельно с Backend.

---

*Документ создан: 13 января 2026 г.*
