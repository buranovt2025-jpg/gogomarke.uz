# Инструкция: Исправление загрузки Рилсов и Историй

## Контекст проблемы

Не работает загрузка видео (рилсов) и историй через веб-приложение GoGoMarket.uz.

**Backend:** Готов, поддержка FormData есть
**Frontend:** Код обновлен, но может не работать - нужна диагностика

---

## Файлы для проверки

### 1. API Service (загрузка файлов)
```
web/gogomarket-web/src/services/api.ts
```

**Текущая реализация uploadFile (строки 378-403):**
```typescript
async uploadFile(file: File, folder: string = 'images') {
  const formData = new FormData();
  
  const isVideo = file.type.startsWith('video/') || folder === 'videos';
  const fieldName = isVideo ? 'video' : 'image';
  const endpoint = isVideo ? '/upload/video' : '/upload/image';
  
  formData.append(fieldName, file);
  if (folder && !isVideo) {
    formData.append('folder', folder);
  }
  
  const headers: HeadersInit = {};
  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return response.json();
}
```

### 2. Страница создания истории
```
web/gogomarket-web/src/pages/seller/CreateStoryPage.tsx
```

### 3. Страница создания видео/рилса
```
web/gogomarket-web/src/pages/seller/SellerVideosPage.tsx
```

---

## Диагностика через DevTools

### Шаг 1: Откройте Network tab
1. F12 → Network
2. Попробуйте загрузить файл
3. Найдите запрос к `/upload/video` или `/upload/image`

### Шаг 2: Проверьте запрос
- **Status:** Должен быть 200 или 201
- **Request Headers:** Должен быть `Authorization: Bearer ...`
- **Request Payload:** Должен быть `FormData` с полем `video` или `image`

### Шаг 3: Проверьте ответ
```json
// Успешный ответ:
{
  "success": true,
  "data": {
    "url": "https://..."
  }
}

// Ошибка:
{
  "success": false,
  "error": "..."
}
```

---

## Типичные ошибки и решения

### Ошибка 1: 401 Unauthorized
**Причина:** Токен не передается
**Решение:** Проверить что `this.token` установлен в api.ts

```typescript
// Проверка в консоли браузера:
localStorage.getItem('token')
```

### Ошибка 2: 400 Bad Request - "No file uploaded"
**Причина:** Неправильное имя поля в FormData
**Решение:** 
- Для видео: `formData.append('video', file)`
- Для изображения: `formData.append('image', file)`

### Ошибка 3: Content-Type header
**Причина:** Явно установлен Content-Type
**Решение:** НЕ устанавливать Content-Type для FormData - браузер сам добавит правильный

```typescript
// НЕПРАВИЛЬНО:
headers['Content-Type'] = 'multipart/form-data';

// ПРАВИЛЬНО:
// Не добавлять Content-Type вообще
```

### Ошибка 4: CORS
**Причина:** Backend не разрешает запросы с фронтенда
**Решение:** Проверить CORS настройки в backend/src/app.ts

---

## Код для тестирования в консоли браузера

### Тест загрузки изображения:
```javascript
const testImageUpload = async () => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  // Создаем тестовый файл
  const blob = new Blob(['test'], { type: 'image/png' });
  const file = new File([blob], 'test.png', { type: 'image/png' });
  
  formData.append('image', file);
  
  const response = await fetch('https://64-226-94-133.sslip.io/api/v1/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  console.log('Status:', response.status);
  console.log('Response:', await response.json());
};

testImageUpload();
```

### Тест загрузки видео:
```javascript
const testVideoUpload = async () => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  // Нужен реальный видеофайл
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    formData.append('video', file);
    
    const response = await fetch('https://64-226-94-133.sslip.io/api/v1/upload/video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Status:', response.status);
    console.log('Response:', await response.json());
  };
  input.click();
};

testVideoUpload();
```

---

## Backend эндпоинты

| Endpoint | Метод | Поле | Описание |
|----------|-------|------|----------|
| `/upload/image` | POST | `image` | Загрузка изображения |
| `/upload/video` | POST | `video` | Загрузка видео |
| `/upload/product-image` | POST | `image` | Изображение товара |

**Файл:** `backend/src/routes/uploadRoutes.ts`

---

## Проверка Backend

```bash
# SSH на сервер
ssh root@64.226.94.133

# Проверить логи
pm2 logs gogomarket-api

# Проверить статус
pm2 status
```

---

## Чек-лист исправления

- [ ] Проверить Network tab - есть ли запрос
- [ ] Проверить статус ответа (200/201/400/401/500)
- [ ] Проверить тело запроса - есть ли файл
- [ ] Проверить заголовки - есть ли Authorization
- [ ] Проверить ответ - что возвращает сервер
- [ ] Если 401 - проверить токен
- [ ] Если 400 - проверить имя поля (video/image)
- [ ] Если 500 - проверить логи backend

---

## Контакты и ресурсы

- **Репозиторий:** https://github.com/buranovt2025-jpg/gogomarke.uz
- **Ветка:** `cursor/-bc-c5dbac09-4d95-4ec5-822a-3e2053ac7ad7-924d`
- **Web:** https://buranovt2025-jpg.github.io/gogomarke.uz/
- **API:** https://64-226-94-133.sslip.io/api/v1
