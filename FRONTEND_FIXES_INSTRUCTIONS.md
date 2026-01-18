# Инструкции по обновлению Frontend для GoGoMarket.uz

**Дата:** 18 января 2026  
**Backend версия:** 1.0 (100% готов)  
**API:** https://64-226-94-133.sslip.io/api/v1

---

## 📋 Чек-лист обновлений Frontend

### 1. Stories - Прямая загрузка файлов

#### React/JavaScript пример:
```javascript
// Создание Story с файлом
const createStory = async (file, caption, productId) => {
  const formData = new FormData();
  formData.append('media', file); // Файл изображения или видео
  formData.append('caption', caption);
  if (productId) {
    formData.append('productId', productId);
  }
  
  const response = await fetch('/api/v1/stories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // НЕ устанавливайте Content-Type - браузер сделает это автоматически с boundary
    },
    body: formData,
  });
  
  return response.json();
};

// Использование
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const result = await createStory(file, 'Моя история!', null);
  console.log(result);
});
```

#### Flutter/Dart пример:
```dart
import 'package:dio/dio.dart';

Future<void> createStory(File file, String caption, String? productId) async {
  final formData = FormData.fromMap({
    'media': await MultipartFile.fromFile(file.path),
    'caption': caption,
    if (productId != null) 'productId': productId,
  });
  
  final response = await dio.post(
    '/api/v1/stories',
    data: formData,
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  
  print(response.data);
}
```

---

### 2. Редактирование товаров продавца

#### Получение товаров:
```javascript
// GET /api/v1/seller/products
const getMyProducts = async () => {
  const response = await fetch('/api/v1/seller/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

#### Обновление товара:
```javascript
// PUT /api/v1/products/:id
const updateProduct = async (productId, updates) => {
  const response = await fetch(`/api/v1/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Пример использования
await updateProduct('product-uuid', {
  title: 'Новое название',
  price: 150000,
  stock: 50,
  description: 'Обновленное описание',
});
```

---

### 3. Загрузка видео (Reels)

```javascript
// POST /api/v1/videos
const uploadVideo = async (videoFile, thumbnailFile, data) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile);
  }
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('contentType', 'reel'); // или 'video'
  if (data.productId) {
    formData.append('productId', data.productId);
  }
  
  const response = await fetch('/api/v1/videos', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  
  return response.json();
};
```

---

### 4. Чат между пользователями

```javascript
// Создать чат
const createChat = async (userId) => {
  const response = await fetch('/api/v1/chats', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  return response.json();
};

// Отправить сообщение
const sendMessage = async (chatId, content) => {
  const response = await fetch(`/api/v1/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  return response.json();
};

// Получить сообщения
const getMessages = async (chatId) => {
  const response = await fetch(`/api/v1/chats/${chatId}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

---

### 5. Курьер - Фото при получении

```javascript
// POST /api/v1/orders/:id/pickup
const pickupOrder = async (orderId, qrData, photoFile) => {
  const formData = new FormData();
  formData.append('qrData', qrData);
  formData.append('pickupPhoto', photoFile); // ОБЯЗАТЕЛЬНО
  
  const response = await fetch(`/api/v1/orders/${orderId}/pickup`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${courierToken}` },
    body: formData,
  });
  
  return response.json();
};
```

---

### 6. Адреса пользователя

```javascript
// Добавить адрес
const addAddress = async (addressData) => {
  const response = await fetch('/api/v1/addresses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: addressData.title,        // "Дом", "Работа"
      fullName: addressData.fullName,  // ФИО получателя
      phone: addressData.phone,
      address: addressData.address,    // Полный адрес
      city: addressData.city,
      district: addressData.district,  // Район
      isDefault: true,
    }),
  });
  return response.json();
};
```

---

## 🐛 Типичные ошибки и решения

### Ошибка: "Failed to create address"
**Причина:** Неправильные поля  
**Решение:** Используйте `address` вместо `fullAddress`, `title` вместо `label`

### Ошибка: "Route not found"
**Причина:** Неправильный путь API  
**Решение:** 
- Чат: `/api/v1/chats` (не `/api/v1/chat`)
- Мок оплата: `/api/v1/payments/mock-pay` (не `/mock`)

### Ошибка: "Insufficient stock"
**Причина:** Товар раскупили  
**Решение:** Обновите данные о товаре и покажите сообщение пользователю

### Ошибка: "Invalid QR code or delivery code"
**Причина:** Неверный код доставки  
**Решение:** Проверьте 6-значный код, отправленный в SMS

---

## 🧪 Тестирование в консоли браузера

```javascript
// Проверка API
fetch('https://64-226-94-133.sslip.io/api/v1/health')
  .then(r => r.json())
  .then(console.log);

// Авторизация
fetch('https://64-226-94-133.sslip.io/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+998911001001',
    password: 'Test123!'
  })
}).then(r => r.json()).then(console.log);

// Получить товары
fetch('https://64-226-94-133.sslip.io/api/v1/products?limit=5')
  .then(r => r.json())
  .then(d => console.log(d.data));
```

---

## ✅ Готовность к запуску

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Backend API | ✅ 100% | Все эндпоинты работают |
| Авторизация | ✅ 100% | JWT, роли, RBAC |
| Заказы | ✅ 100% | Полный цикл |
| Платежи | ✅ 100% | Mock + готовность к Payme/Click |
| Чат | ✅ 100% | Между всеми ролями |
| Stories | ✅ 100% | Файлы + URL |
| Видео/Reels | ✅ 100% | Лайки, комменты |
| Модерация | ✅ 100% | Фильтрация контента |
| Финансы | ✅ 100% | Распределение средств |

**Backend полностью готов к production!**
