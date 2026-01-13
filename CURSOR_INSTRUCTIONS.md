# Cursor Instructions — Front-end & Mobile (Phase 0)

**Проект:** GoGoMarket.uz — Social Video Marketplace  
**Дата:** Январь 2026  
**Версия:** 1.0  
**Ответственность:** Front-end (Flutter Mobile) & Web разработка  
**Фаза:** 0 — Критические исправления безопасности (БЛОКЕРЫ)

---

## 🎯 Цель Фазы 0

Устранить критические уязвимости безопасности в мобильном приложении (Flutter) и веб-интерфейсе, чтобы сделать платформу безопасной для запуска.

**Срок выполнения:** 4-5 дней  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ (БЛОКЕРЫ)

---

## 📋 Задачи Front-end/Mobile (F0.1 — F0.7)

### F0.1: Переключить API на HTTPS
**Срок:** 0.5 дня  
**Файл:** `frontend/lib/config/api_config.dart`  
**Зависимости:** Backend должен уже работать на HTTPS

**Проблема:**  
API использует HTTP вместо HTTPS, что позволяет перехватывать данные в незашифрованном виде.

**Задача:**
1. Найти все упоминания `http://` в коде:
   ```bash
   grep -r "http://" frontend/lib/
   ```
2. Обновить `api_config.dart`:
   ```dart
   class ApiConfig {
     // Development
     static const String DEV_BASE_URL = 'https://dev-api.gogomarket.uz';
     
     // Production
     static const String PROD_BASE_URL = 'https://api.gogomarket.uz';
     
     // Current environment
     static const bool IS_PRODUCTION = bool.fromEnvironment('dart.vm.product');
     
     static String get baseUrl => IS_PRODUCTION ? PROD_BASE_URL : DEV_BASE_URL;
     
     // WebSocket
     static String get wsUrl => baseUrl.replaceFirst('https://', 'wss://');
   }
   ```
3. Убедиться, что все HTTP клиенты используют HTTPS:
   ```dart
   final response = await http.get(
     Uri.parse('${ApiConfig.baseUrl}/api/v1/products'),
   );
   ```

**Проверка:**
- Все API запросы используют HTTPS
- WebSocket использует WSS (secure)
- Нет hardcoded `http://64.226.94.133`

---

### F0.2: Отключить cleartext traffic
**Срок:** 0.5 дня  
**Файл:** `frontend/android/app/src/main/AndroidManifest.xml`  
**Зависимости:** F0.1 (API должен быть на HTTPS)

**Проблема:**  
`android:usesCleartextTraffic="true"` разрешает незашифрованный HTTP трафик, что небезопасно.

**Задача:**
1. Открыть `AndroidManifest.xml`
2. Найти и удалить или установить в `false`:
   ```xml
   <application
       android:label="GoGoMarket"
       android:name="${applicationName}"
       android:icon="@mipmap/ic_launcher"
       android:usesCleartextTraffic="false">
       <!-- остальная конфигурация -->
   </application>
   ```
3. **ВАЖНО:** Убедиться, что F0.1 выполнен, иначе приложение не сможет соединиться с API

**Проверка:**
- HTTP запросы блокируются
- HTTPS запросы работают нормально

---

### F0.3: Добавить Network Security Configuration
**Срок:** 0.5 дня  
**Файл:** `frontend/android/app/src/main/res/xml/network_security_config.xml` (создать новый)

**Задача:**
1. Создать папку `frontend/android/app/src/main/res/xml/` если её нет
2. Создать файл `network_security_config.xml`:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <network-security-config>
       <!-- Production configuration -->
       <domain-config cleartextTrafficPermitted="false">
           <domain includeSubdomains="true">gogomarket.uz</domain>
           <domain includeSubdomains="true">api.gogomarket.uz</domain>
           <trust-anchors>
               <certificates src="system" />
           </trust-anchors>
       </domain-config>
       
       <!-- Allow localhost only for debug builds -->
       <domain-config cleartextTrafficPermitted="true">
           <domain includeSubdomains="true">localhost</domain>
           <domain includeSubdomains="true">10.0.2.2</domain>
           <domain includeSubdomains="true">127.0.0.1</domain>
       </domain-config>
       
       <!-- Base configuration -->
       <base-config cleartextTrafficPermitted="false">
           <trust-anchors>
               <certificates src="system" />
           </trust-anchors>
       </base-config>
   </network-security-config>
   ```
3. Подключить конфигурацию в `AndroidManifest.xml`:
   ```xml
   <application
       android:networkSecurityConfig="@xml/network_security_config"
       android:usesCleartextTraffic="false">
       <!-- ... -->
   </application>
   ```

**Проверка:**
- Приложение работает только с HTTPS в production
- Localhost работает в debug режиме

---

### F0.4: Создать production keystore
**Срок:** 1 день  
**Файлы:** `frontend/android/app/key.properties` (создать), `frontend/android/keystore/` (создать)

**Проблема:**  
Release build использует debug signing key, что не позволяет публиковать приложение в Google Play.

**Задача:**
1. Создать папку для keystore:
   ```bash
   mkdir -p frontend/android/keystore
   ```
2. Сгенерировать production keystore:
   ```bash
   cd frontend/android/keystore
   keytool -genkey -v -keystore gogomarket-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias gogomarket-key
   ```
3. При генерации ввести:
   - **Password:** Надежный пароль (сохранить в безопасном месте!)
   - **Name:** GoGoMarket LLC
   - **Organization:** GoGoMarket
   - **Country:** UZ
4. Создать файл `frontend/android/key.properties`:
   ```properties
   storePassword=<ваш пароль>
   keyPassword=<ваш пароль>
   keyAlias=gogomarket-key
   storeFile=../keystore/gogomarket-release.jks
   ```
5. **ВАЖНО:** Добавить в `.gitignore`:
   ```
   # Keystore files
   *.jks
   *.keystore
   key.properties
   ```

**Проверка:**
- Keystore файл создан
- `key.properties` не коммитится в Git
- Backup keystore в безопасном месте

---

### F0.5: Настроить release signing config
**Срок:** 0.5 дня  
**Файл:** `frontend/android/app/build.gradle.kts` (или `build.gradle`)  
**Зависимости:** F0.4

**Задача:**
1. Открыть `frontend/android/app/build.gradle.kts`
2. Добавить загрузку `key.properties`:
   ```kotlin
   // Перед блоком android
   val keystorePropertiesFile = rootProject.file("key.properties")
   val keystoreProperties = Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(FileInputStream(keystorePropertiesFile))
   }
   ```
3. Добавить signing config:
   ```kotlin
   android {
       // ...
       
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
           getByName("release") {
               signingConfig = signingConfigs.getByName("release")
               isMinifyEnabled = true
               isShrinkResources = true
               proguardFiles(
                   getDefaultProguardFile("proguard-android-optimize.txt"),
                   "proguard-rules.pro"
               )
           }
       }
   }
   ```

**Проверка:**
- Release build собирается с production ключом
- Debug build использует debug ключ

---

### F0.6: Ограничить Firebase API ключи
**Срок:** 0.5 дня  
**Где:** Firebase Console (https://console.firebase.google.com)

**Проблема:**  
Firebase API ключи не имеют ограничений, что позволяет злоупотреблять ими.

**Задача:**
1. Зайти в Firebase Console
2. Перейти в Project Settings → General
3. Для каждого API ключа:
   - Web API Key: ограничить по HTTP referrers (домены сайта)
   - Android API Key: ограничить по package name (`uz.gogomarket.app`)
   - iOS API Key: ограничить по bundle ID
4. Настроить ограничения API:
   - Разрешить только необходимые APIs (FCM, Firestore, Analytics)
5. Включить App Check для дополнительной защиты

**Проверка:**
- API ключи работают только с разрешенных доменов/приложений
- Сторонние приложения не могут использовать ключи

---

### F0.7: Добавить необходимые permissions для Android
**Срок:** 0.5 дня  
**Файл:** `frontend/android/app/src/main/AndroidManifest.xml`

**Проблема:**  
Неполный набор permissions может привести к сбоям функций.

**Задача:**
1. Проверить и добавить необходимые permissions в `AndroidManifest.xml`:
   ```xml
   <manifest xmlns:android="http://schemas.android.com/apk/res/android">
       <!-- Обязательные permissions -->
       <uses-permission android:name="android.permission.INTERNET" />
       <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
       
       <!-- Для камеры (съемка видео/фото) -->
       <uses-permission android:name="android.permission.CAMERA" />
       <uses-feature android:name="android.hardware.camera" android:required="false" />
       <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
       
       <!-- Для галереи и загрузки файлов -->
       <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
           android:maxSdkVersion="32" />
       <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
           android:maxSdkVersion="29" />
       <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
       <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
       
       <!-- Для геолокации (трекинг курьера) -->
       <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
       <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
       
       <!-- Для Push-уведомлений -->
       <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
       
       <!-- Для биометрии -->
       <uses-permission android:name="android.permission.USE_BIOMETRIC" />
       <uses-permission android:name="android.permission.USE_FINGERPRINT" />
       
       <application>
           <!-- ... -->
       </application>
   </manifest>
   ```
2. Для iOS обновить `frontend/ios/Runner/Info.plist`:
   ```xml
   <dict>
       <!-- ... -->
       
       <!-- Camera -->
       <key>NSCameraUsageDescription</key>
       <string>Нужна камера для съемки видео и фото товаров</string>
       
       <!-- Photo Library -->
       <key>NSPhotoLibraryUsageDescription</key>
       <string>Нужен доступ к галерее для выбора фото и видео</string>
       
       <!-- Location -->
       <key>NSLocationWhenInUseUsageDescription</key>
       <string>Нужна геолокация для отслеживания доставки</string>
       
       <!-- Face ID -->
       <key>NSFaceIDUsageDescription</key>
       <string>Используется для быстрой и безопасной оплаты</string>
   </dict>
   ```

**Проверка:**
- Все функции приложения работают без ошибок permissions
- Пользователю показываются понятные запросы на доступ

---

## 📂 Файлы для изменения

| Файл | Задачи | Приоритет |
|------|--------|-----------|
| `frontend/lib/config/api_config.dart` | F0.1 (HTTPS API) | 🔴 Критический |
| `frontend/android/app/src/main/AndroidManifest.xml` | F0.2 (cleartext), F0.7 (permissions) | 🔴 Критический |
| `frontend/android/app/src/main/res/xml/network_security_config.xml` | F0.3 — **создать новый** | 🔴 Критический |
| `frontend/android/keystore/gogomarket-release.jks` | F0.4 — **создать новый** | 🔴 Критический |
| `frontend/android/key.properties` | F0.4 — **создать новый** (не коммитить!) | 🔴 Критический |
| `frontend/android/app/build.gradle.kts` | F0.5 (signing config) | 🔴 Критический |
| Firebase Console | F0.6 (API ключи) | 🟠 Высокий |
| `frontend/ios/Runner/Info.plist` | F0.7 (iOS permissions) | 🟠 Высокий |
| `frontend/.gitignore` | Добавить `*.jks`, `key.properties` | 🔴 Критический |

---

## 🔀 Рекомендации по работе с ветками

### Ветка для работы
```bash
git checkout -b feature/frontend-security-phase0
```

### Коммиты
Используйте осмысленные сообщения коммитов:

```bash
git commit -m "feat(security): switch API to HTTPS (F0.1)"
git commit -m "feat(security): disable cleartext traffic (F0.2)"
git commit -m "feat(security): add network security config (F0.3)"
git commit -m "feat(security): generate production keystore (F0.4)"
git commit -m "feat(build): configure release signing (F0.5)"
git commit -m "feat(security): restrict Firebase API keys (F0.6)"
git commit -m "feat(permissions): add required Android/iOS permissions (F0.7)"
```

### Pull Request
После завершения всех задач:
1. Push ветки на GitHub
2. Создать Pull Request в `main`
3. Заполнить шаблон отчета (см. ниже)
4. Запросить код-ревью

---

## 📊 Пример отчёта [CURSOR-REPORT]

После выполнения задач заполните отчёт в формате:

```markdown
# [CURSOR-REPORT] Frontend & Mobile Security Phase 0

**Дата:** <дата>  
**Разработчик:** <имя>  
**Ветка:** feature/frontend-security-phase0  
**Статус:** ✅ Завершено / ⚠️ В процессе / ❌ Заблокировано

---

## ✅ Выполненные задачи

### F0.1: API на HTTPS
- **Статус:** ✅ Завершено
- **Файлы:** `frontend/lib/config/api_config.dart`
- **Изменения:**
  - Заменены все `http://` на `https://`
  - Убраны hardcoded IP адреса
  - Настроен baseUrl для dev и prod окружений
  - WebSocket переведен на `wss://`
- **Проверка:** ✅ Все API запросы используют HTTPS

### F0.2: Отключен cleartext traffic
- **Статус:** ✅ Завершено
- **Файлы:** `frontend/android/app/src/main/AndroidManifest.xml`
- **Изменения:**
  - `android:usesCleartextTraffic="false"`
- **Проверка:** ✅ HTTP запросы блокируются

### F0.3: Network Security Config
- **Статус:** ✅ Завершено
- **Файлы:** `frontend/android/app/src/main/res/xml/network_security_config.xml`
- **Изменения:**
  - Создан network security config
  - HTTPS обязателен для production доменов
  - Localhost разрешен только для debug
- **Проверка:** ✅ Конфигурация применяется

### F0.4: Production Keystore
- **Статус:** ✅ Завершено
- **Файлы:** `frontend/android/keystore/gogomarket-release.jks`, `frontend/android/key.properties`
- **Изменения:**
  - Сгенерирован production keystore (2048-bit RSA, 10000 дней)
  - Создан `key.properties`
  - Добавлено в `.gitignore`
  - Backup keystore сохранен в [безопасное место]
- **Проверка:** ✅ Keystore создан и защищен

### F0.5: Release Signing Config
- **Статус:** ✅ Завершено
- **Файлы:** `frontend/android/app/build.gradle.kts`
- **Изменения:**
  - Добавлена загрузка `key.properties`
  - Настроен signing config для release
  - Включены minify и shrinkResources
- **Проверка:** ✅ Release build подписывается production ключом

### F0.6: Firebase API Keys
- **Статус:** ✅ Завершено
- **Где:** Firebase Console
- **Изменения:**
  - Web API Key: ограничен доменами `gogomarket.uz`, `*.gogomarket.uz`
  - Android API Key: ограничен package `uz.gogomarket.app`
  - iOS API Key: ограничен bundle ID
  - Разрешены только FCM, Firestore, Analytics APIs
- **Проверка:** ✅ API ключи защищены

### F0.7: Permissions
- **Статус:** ✅ Завершено
- **Файлы:** `frontend/android/app/src/main/AndroidManifest.xml`, `frontend/ios/Runner/Info.plist`
- **Изменения:**
  - Добавлены permissions для камеры, галереи, геолокации, биометрии
  - Добавлены описания для iOS (Usage Descriptions)
- **Проверка:** ✅ Все функции работают без ошибок

---

## 🔧 Дополнительные изменения

### Обновлен .gitignore
```gitignore
# Android signing
*.jks
*.keystore
key.properties

# Environment
.env
.env.local
```

---

## 📦 Сборка приложения

### Debug build
```bash
cd frontend
flutter build apk --debug
# Файл: build/app/outputs/flutter-apk/app-debug.apk
```

### Release build
```bash
cd frontend
flutter build apk --release
# Файл: build/app/outputs/flutter-apk/app-release.apk
```

### iOS
```bash
cd frontend
flutter build ios --release
```

---

## 🧪 Тестирование

### Функциональное тестирование
- [x] HTTPS: Все API запросы работают через HTTPS
- [x] Cleartext: HTTP запросы блокируются
- [x] Network config: HTTPS обязателен в production
- [x] Signing: Release APK подписан production ключом
- [x] Firebase: API ключи работают только с приложения
- [x] Permissions: Камера, галерея, геолокация работают

### Тестирование безопасности
- [x] Man-in-the-Middle: HTTPS защищает от перехвата
- [x] Certificate Pinning: Планируется в Phase 2 (F2.8)
- [x] Reverse Engineering: ProGuard планируется в Phase 3

### Тестовые устройства
- [ ] Android 10 (API 29)
- [ ] Android 11 (API 30)
- [ ] Android 12+ (API 31+)
- [ ] iOS 14+
- [ ] iOS 15+

---

## 📸 Скриншоты

### До изменений
<Скриншоты с HTTP, если есть>

### После изменений
<Скриншоты с HTTPS работой>

---

## ⚠️ Важные замечания

### Keystore Security
- ⚠️ **КРИТИЧЕСКИ ВАЖНО:** Backup файла `gogomarket-release.jks` и паролей
- 🔒 Хранить keystore в безопасном месте (не в Git!)
- 📝 Пароли задокументированы в [безопасное место]
- 🔄 Если keystore потеряется — невозможно обновить приложение в Store

### API Migration
- ⚠️ Убедиться что backend уже работает на HTTPS перед релизом
- ⚠️ Проверить что SSL сертификаты валидны
- ⚠️ WebSocket должен использовать WSS

---

## ❌ Проблемы и решения

### Проблема 1: Ошибка "Cleartext communication not permitted"
**Решение:** Убедиться что F0.1 (HTTPS API) выполнен, и все URL используют `https://`

### Проблема 2: Release build не подписывается
**Решение:** Проверить что `key.properties` находится в `frontend/android/` и содержит правильные пути

### Проблема 3: Firebase не работает после ограничений
**Решение:** Проверить что package name точно соответствует `uz.gogomarket.app`

---

## 📌 Следующие шаги

После завершения Phase 0:
- [ ] Код-ревью
- [ ] Тестирование QA на реальных устройствах
- [ ] Загрузка в Google Play Console (Internal Testing)
- [ ] Загрузка в TestFlight (iOS)
- [ ] Синхронизация с Backend командой

---

## 🔗 Ссылки

- Pull Request: #<номер PR>
- Связанные issues: #<если есть>
- Документация: [Master Action Plan](/audit_reports/master_action_plan.md)
- Backend Phase 0: [COPILOT_INSTRUCTIONS.md](/COPILOT_INSTRUCTIONS.md)

---

## 🔄 Синхронизация с Backend

| Frontend задача | Зависимость от Backend | Статус |
|-----------------|------------------------|--------|
| F0.1 (HTTPS API) | Backend должен работать на HTTPS | ⏳ Ожидание |
| F0.2 (cleartext) | Backend на HTTPS | ⏳ Ожидание |

**Встреча для синхронизации:** <дата и время>

---

**Подпись:** <ваше имя>  
**Дата завершения:** <дата>
```

---

## 🎯 Критерии завершения Фазы 0

Фаза 0 считается завершенной, когда:

- [x] F0.1: Все API запросы используют HTTPS
- [x] F0.2: Cleartext traffic отключен
- [x] F0.3: Network Security Config настроен
- [x] F0.4: Production keystore создан и сохранен
- [x] F0.5: Release signing config настроен
- [x] F0.6: Firebase API ключи ограничены
- [x] F0.7: Все необходимые permissions добавлены
- [x] Release APK собирается успешно
- [x] Keystore в безопасном месте (backup!)
- [x] `.gitignore` обновлен
- [x] Код-ревью пройдено
- [x] Отчет заполнен

---

## 🔒 Политика безопасности

**ВАЖНО:**
- ❌ **НИКОГДА** не коммитить `*.jks`, `*.keystore`, `key.properties` в Git
- ❌ **НИКОГДА** не делиться паролями keystore публично
- ✅ Всегда делать backup keystore после создания
- ✅ Хранить пароли в защищенном password manager
- ✅ Проверять `.gitignore` перед каждым коммитом

---

## 📞 Контакты и помощь

При возникновении вопросов:
1. Проверить [Master Action Plan](/audit_reports/master_action_plan.md)
2. Проверить [Mobile App Audit](/audit_reports/mobile_app_audit.md)
3. Связаться с Backend командой для синхронизации API
4. Обратиться к команде в Slack/Telegram

---

## 🔄 Точки синхронизации с Back-end

Обязательная синхронизация с Backend командой:

| Этап | Что проверить | Когда |
|------|---------------|-------|
| Перед F0.1 | Backend работает на HTTPS с валидным SSL | До начала |
| После F0.1 | Все эндпоинты отвечают через HTTPS | После F0.1 |
| После F0.2 | Mobile app соединяется с API | После F0.2 |
| После F0.5 | Release build готов для тестирования | После F0.5 |
| Перед релизом | Полная интеграция Frontend + Backend | Перед Phase 1 |

**Рекомендация:** Ежедневные stand-up встречи для координации

---

## 📱 Тестирование на устройствах

### Минимальный набор для тестирования
- **Android:**
  - Android 10 (Samsung Galaxy)
  - Android 12+ (Pixel или современный Xiaomi/Redmi)
- **iOS:**
  - iOS 14+ (iPhone 8 или новее)

### Что тестировать
1. **Connectivity:**
   - [ ] API запросы работают через HTTPS
   - [ ] HTTP запросы блокируются
   - [ ] WebSocket (WSS) работает
2. **Security:**
   - [ ] Сертификат SSL валиден
   - [ ] Firebase работает с ограниченными ключами
3. **Permissions:**
   - [ ] Камера запрашивается и работает
   - [ ] Галерея запрашивается и работает
   - [ ] Геолокация работает (для трекинга)
   - [ ] Биометрия работает (Face ID / Touch ID)
4. **Build:**
   - [ ] Release APK подписан правильным ключом
   - [ ] Приложение запускается без ошибок

---

## 🚀 Чек-лист для релиза в Store

### Google Play (Android)
- [ ] Release APK подписан production keystore
- [ ] Package name: `uz.gogomarket.app`
- [ ] Version code увеличен
- [ ] ProGuard правила настроены (Phase 3)
- [ ] Screenshots подготовлены
- [ ] Privacy Policy URL добавлен
- [ ] Тестирование на Internal Testing track

### App Store (iOS)
- [ ] iOS build подписан distribution certificate
- [ ] Bundle ID правильный
- [ ] Version number увеличен
- [ ] App Icons всех размеров
- [ ] Screenshots для всех размеров экранов
- [ ] Privacy Policy URL добавлен
- [ ] Тестирование через TestFlight

---

**Документ создан:** Январь 2026  
**Последнее обновление:** <дата>  
**Версия:** 1.0
