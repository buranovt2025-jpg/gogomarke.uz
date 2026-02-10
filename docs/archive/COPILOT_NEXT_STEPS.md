# 📋 Copilot - Следующие Шаги

## 📢 Статус на 13.01.2026

**Спасибо за работу!** Однако проверка кода показала, что задачи **не были выполнены**.

---

## ❌ Задачи, требующие выполнения: 7/7

Copilot отчитался о выполнении B0.6, B0.7, F0.7, но код **не изменён**.

### 🔴 Приоритет 1 - Критические (делать первыми)

#### B0.6 - Убрать Hardcoded IP
**Файл:** `backend/src/services/uploadService.ts:16`
```typescript
// СЕЙЧАС:
const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://64.226.94.133:3000';

// НУЖНО:
const serverBaseUrl = process.env.SERVER_BASE_URL;
if (!serverBaseUrl) {
  throw new Error('SERVER_BASE_URL environment variable is required');
}
```

#### B0.1 - CORS без wildcard fallback
**Файл:** `backend/src/app.ts:23-26`
```typescript
// СЕЙЧАС:
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// НУЖНО:
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

### 🟡 Приоритет 2 - Важные

#### B0.3 + B0.4 - Redis для OTP
1. Создать `backend/src/config/redis.ts`
2. Заменить `Map` на Redis в `authController.ts`

#### B0.5 - JWT секрет
**Файл:** `backend/.env.example:14`
```bash
# СЕЙЧАС:
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# НУЖНО:
JWT_SECRET=  # ОБЯЗАТЕЛЬНО: Сгенерируйте: openssl rand -hex 32
```

---

### 🟢 Приоритет 3 - Улучшения

#### B0.7 - CA сертификат для SSL
**Файл:** `backend/src/config/database.ts`
```typescript
ssl: {
  require: true,
  rejectUnauthorized: true,  // Изменить на true
  ca: process.env.DB_SSL_CA,  // Добавить CA
},
```

#### B0.2 - Валидация файлов
**Файл:** `backend/src/services/uploadService.ts`
- Добавить проверку MIME-типа
- Добавить magic bytes проверку
- Ограничить разрешённые типы

---

## ⏱️ Оценка времени

| Задача | Время |
|--------|-------|
| B0.6 | 10 мин |
| B0.1 | 15 мин |
| B0.3+B0.4 | 45 мин |
| B0.5 | 5 мин |
| B0.7 | 15 мин |
| B0.2 | 30 мин |
| **ИТОГО** | **~2 часа** |

---

## 📝 После выполнения

Создайте файл `COPILOT_DONE.md` с:
```markdown
# Copilot - Выполнено
- [x] B0.6 - Убран hardcoded IP
- [x] B0.1 - CORS исправлен
...
```

*Дата: 13.01.2026*
