# 🚀 COPILOT: НАЧНИ ЗДЕСЬ

> **Этот файл содержит ВСЁ необходимое. Другие файлы читать НЕ нужно.**

---

## ⚡ КРИТИЧЕСКАЯ ЗАДАЧА (сделать ПЕРВОЙ)

### B0.6: Убрать hardcoded IP

**Файл:** `backend/src/services/uploadService.ts`

**Найти и заменить:**
```typescript
// БЫЛО (найти это):
const serverUrl = `http://64.226.94.133:${process.env.PORT || 3000}`;

// СТАЛО (заменить на):
const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
```

**После изменения добавить в `.env.example`:**
```
SERVER_URL=https://api.gogomarket.uz
```

---

## 📋 ОСТАЛЬНЫЕ ЗАДАЧИ (по порядку)

### B0.1: Настройка CORS

**Файл:** `backend/src/app.ts`

```typescript
// Найти секцию CORS и заменить на:
const allowedOrigins = [
  'https://gogomarket.uz',
  'https://www.gogomarket.uz',
  'https://admin.gogomarket.uz',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### B0.2: Валидация загрузки файлов

**Файл:** `backend/src/services/uploadService.ts`

**Добавить в начало файла:**
```typescript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

**Добавить функцию валидации:**
```typescript
async function validateFile(buffer: Buffer, filename: string): Promise<void> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
    throw new Error('Invalid file type');
  }
}
```

---

### B0.3: Redis для OTP

**Установить:** `npm install redis`

**Файл:** `backend/src/controllers/authController.ts`

```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redis.connect();

// Сохранить OTP:
await redis.setEx(`otp:${phone}`, 300, otpCode); // 5 минут

// Получить OTP:
const storedOtp = await redis.get(`otp:${phone}`);

// Удалить после использования:
await redis.del(`otp:${phone}`);
```

---

### B0.4: Безопасный JWT

**Файл:** `.env` и `.env.example`
```
JWT_SECRET=<сгенерировать 64-символьный ключ: openssl rand -hex 32>
```

**Файл:** `backend/src/config/index.ts`
```typescript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

### B0.5: SSL для PostgreSQL

**Файл:** `backend/src/config/database.ts`
```typescript
ssl: {
  rejectUnauthorized: process.env.NODE_ENV === 'production',
  ca: process.env.DB_CA_CERT
}
```

---

### B0.7: HTTPS

Настроить через Nginx или cloud provider (DigitalOcean).

---

## ✅ ПОСЛЕ ВЫПОЛНЕНИЯ

Создай файл `COPILOT_DONE.md`:
```markdown
# Copilot завершил задачи

## Выполнено:
- [ ] B0.6: Убран hardcoded IP
- [ ] B0.1: CORS настроен
- [ ] B0.2: Валидация файлов
- [ ] B0.3: Redis для OTP
- [ ] B0.4: JWT secret
- [ ] B0.5: PostgreSQL SSL
- [ ] B0.7: HTTPS (инструкции)

## Изменённые файлы:
- backend/src/services/uploadService.ts
- backend/src/app.ts
- backend/src/controllers/authController.ts
- backend/src/config/database.ts
- .env.example
```

---

## 📞 КОНТАКТ

После завершения задач, Cursor сможет продолжить работу над F0.7 (Web API URL).
