# 🔐 Инструкция по созданию Production Keystore

**Проект:** GoGoMarket  
**Платформа:** Android  
**Дата:** 13 января 2026 г.  

---

## ⚠️ ВАЖНО

> **Keystore — это критически важный файл!**
> - Без него невозможно обновить приложение в Google Play
> - Потеря keystore = необходимость публикации нового приложения
> - Храните резервные копии в безопасном месте

---

## 📋 Шаг 1: Генерация Keystore

Выполните команду в терминале:

```bash
cd frontend/android

keytool -genkey -v -keystore gogomarket-release.keystore \
  -alias gogomarket \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Параметры:

| Параметр | Описание | Рекомендация |
|----------|----------|-------------|
| `-keystore` | Имя файла keystore | `gogomarket-release.keystore` |
| `-alias` | Псевдоним ключа | `gogomarket` |
| `-keyalg` | Алгоритм | RSA (стандарт) |
| `-keysize` | Размер ключа | 2048+ бит |
| `-validity` | Срок действия (дни) | 10000 (~27 лет) |

---

## 📋 Шаг 2: Заполнение данных

При генерации введите:

```
Enter keystore password: [СЕКРЕТНЫЙ_ПАРОЛЬ_1]
Re-enter new password: [СЕКРЕТНЫЙ_ПАРОЛЬ_1]

What is your first and last name?
  [Unknown]: GoGoMarket Team
What is the name of your organizational unit?
  [Unknown]: Mobile Development
What is the name of your organization?
  [Unknown]: GoGoMarket LLC
What is the name of your City or Locality?
  [Unknown]: Tashkent
What is the name of your State or Province?
  [Unknown]: Tashkent
What is the two-letter country code for this unit?
  [Unknown]: UZ

Is CN=GoGoMarket Team, OU=Mobile Development, O=GoGoMarket LLC, L=Tashkent, ST=Tashkent, C=UZ correct?
  [no]: yes

Enter key password for <gogomarket>
  (RETURN if same as keystore password): [СЕКРЕТНЫЙ_ПАРОЛЬ_2]
```

---

## 📋 Шаг 3: Создание key.properties

Создайте файл `frontend/android/key.properties`:

```properties
storePassword=ВАШ_ПАРОЛЬ_KEYSTORE
keyPassword=ВАШ_ПАРОЛЬ_KEY
keyAlias=gogomarket
storeFile=../gogomarket-release.keystore
```

**⚠️ Этот файл НЕ должен попасть в Git!**

---

## 📋 Шаг 4: Обновление .gitignore

Убедитесь, что в `frontend/android/.gitignore` есть:

```gitignore
# Signing
*.keystore
*.jks
key.properties
```

---

## 📋 Шаг 5: Проверка build.gradle.kts

Файл `frontend/android/app/build.gradle.kts` должен содержать:

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ...

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String?
            keyPassword = keystoreProperties["keyPassword"] as String?
            storeFile = keystoreProperties["storeFile"]?.let { file(it as String) }
            storePassword = keystoreProperties["storePassword"] as String?
        }
    }

    buildTypes {
        release {
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

---

## 📋 Шаг 6: Сборка Release APK

```bash
cd frontend
flutter build apk --release
```

Результат: `frontend/build/app/outputs/flutter-apk/app-release.apk`

---

## 🔒 Хранение и резервное копирование

### Рекомендуемые места хранения:

1. **1Password / LastPass** — для команды
2. **Защищенный USB-накопитель** — физический бэкап
3. **Зашифрованное облако** — Google Drive с шифрованием

### Что сохранить:

| Файл | Описание |
|------|----------|
| `gogomarket-release.keystore` | Основной keystore |
| `key.properties` | Пароли (зашифровать!) |
| Документ с паролями | В защищенном месте |

---

## 📊 Проверка SHA-1 (для Firebase)

```bash
keytool -list -v -keystore gogomarket-release.keystore -alias gogomarket
```

Полученный **SHA-1** нужно добавить в Firebase Console.

---

## ❓ FAQ

**Q: Забыл пароль от keystore?**  
A: К сожалению, восстановить невозможно. Нужно создавать новый keystore и публиковать приложение заново.

**Q: Как обновить приложение с новым keystore?**  
A: Невозможно. Google Play привязывает приложение к keystore. Единственный вариант — Google Play App Signing.

**Q: Включить Google Play App Signing?**  
A: Рекомендуется! Это позволит Google хранить master key, и вы сможете восстановить доступ.

---

_Инструкция создана: Cursor | Фаза 0 | F0.3_
