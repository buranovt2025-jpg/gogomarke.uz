# 🤖 GitHub Copilot — Инструкции для Backend

**Проект:** GoGoMarket  
**Роль:** Backend разработка (Node.js, Express, TypeScript, PostgreSQL)  
**Метка для отчетов:** `[COPILOT-REPORT]`  
**Дата создания:** 13 января 2026 г.

---

## 📋 Содержание

1. [Общая информация](#1-общая-информация)
2. [Задачи Фазы 0](#2-задачи-фазы-0-критические-исправления-безопасности)
3. [Детальные инструкции](#3-детальные-инструкции)
4. [Формат отчета](#4-формат-отчета)
5. [Чеклист выполнения](#5-чеклист-выполнения)
6. [Координация с Cursor](#6-координация-с-cursor)
7. [Пример отчета](#7-пример-отчета)

---

## 1. Общая информация

### Структура проекта

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts      # ⚠️ ТВОЙ ФАЙЛ - OTP логика
│   │   ├── productController.ts
│   │   └── ...
│   ├── services/
│   │   ├── uploadService.ts       # ⚠️ ТВОЙ ФАЙЛ - валидация файлов
│   │   ├── socketService.ts       # ⚠️ ТВОЙ ФАЙЛ - CORS WebSocket
│   │   └── ...
│   ├── config/
│   │   └── database.ts            # ⚠️ ТВОЙ ФАЙЛ - SSL БД
│   ├── app.ts                     # ⚠️ ТВОЙ ФАЙЛ - CORS настройка
│   └── ...
├── .env                           # ⚠️ ТВОЙ ФАЙЛ - переменные окружения
└── package.json
```

### Технологии

- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Cache:** Redis (нужно установить)
- **Storage:** DigitalOcean Spaces (S3-совместимый)

### Правила работы

1. **Все изменения в отдельной ветке:** `copilot/phase0-security`
2. **НЕ трогай frontend файлы** (web/, frontend/)
3. **Коммитируй каждую задачу отдельно**
4. **Тестируй перед коммитом**
5. **Отчитывайся после каждой задачи**

---

## 2. Задачи Фазы 0 (Критические исправления безопасности)

### 📊 Обзор задач

| ID | Задача | Приоритет | Срок | Файлы |
|----|--------|-----------|------|-------|
| B0.1 | Настроить CORS | P0 | 0.5 дня | `app.ts`, `socketService.ts` |
| B0.2 | Валидация MIME-type файлов | P0 | 1.5 дня | `uploadService.ts` |
| B0.3 | Установить Redis | P0 | 0.5 дня | - |
| B0.4 | Перенести OTP в Redis | P0 | 1 день | `authController.ts` |
| B0.5 | Криптостойкий JWT секрет | P0 | 0.5 дня | `.env` |
| B0.6 | Убрать hardcoded IP | P0 | 0.5 дня | `uploadService.ts`, другие |
| B0.7 | Исправить SSL БД | P0 | 0.5 дня | `database.ts` |

### 🔥 Порядок выполнения

```
1. B0.5 (JWT) → 2. B0.1 (CORS) → 3. B0.6 (IP) → 4. B0.7 (SSL)
                                      ↓
5. B0.3 (Redis) → 6. B0.4 (OTP в Redis) → 7. B0.2 (Файлы)
```

---

## 3. Детальные инструкции

### 📌 B0.1 — Настроить CORS на конкретные домены

**Проблема:**  
CORS настроен на `*` (любой домен), что позволяет CSRF атаки.

**Текущий код (примерно):**
```typescript
app.use(cors());
// или
app.use(cors({ origin: '*' }));
```

**Требуемые изменения:**

```typescript
// app.ts
const allowedOrigins = [
  process.env.WEB_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  process.env.MOBILE_URL || 'http://localhost:3000',
  // Production домены
  'https://gogomarke.uz',
  'https://admin.gogomarke.uz',
  'https://seller.gogomarke.uz'
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

**Также обновить WebSocket (socketService.ts):**
```typescript
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
```

**Тестирование:**
```bash
# Должен вернуть данные
curl -H "Origin: https://gogomarke.uz" http://localhost:3001/api/health

# Должен вернуть ошибку CORS
curl -H "Origin: https://evil-site.com" http://localhost:3001/api/health
```

**Файлы для изменения:**
- `backend/src/app.ts`
- `backend/src/services/socketService.ts`

---

### 📌 B0.2 — Добавить валидацию MIME-type файлов

**Проблема:**  
Сейчас проверяется только расширение файла, не реальный MIME-type.

**Требуемые изменения:**

1. Установить пакет:
```bash
npm install file-type
```

2. Обновить `uploadService.ts`:
```typescript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  documents: ['application/pdf']
};

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,    // 10MB
  video: 100 * 1024 * 1024,   // 100MB
  document: 5 * 1024 * 1024   // 5MB
};

async function validateFile(buffer: Buffer, expectedType: 'image' | 'video' | 'document'): Promise<{
  valid: boolean;
  mimeType?: string;
  error?: string;
}> {
  // Проверка размера
  if (buffer.length > MAX_FILE_SIZES[expectedType]) {
    return {
      valid: false,
      error: `Файл слишком большой. Максимум: ${MAX_FILE_SIZES[expectedType] / 1024 / 1024}MB`
    };
  }

  // Проверка реального MIME-type через magic bytes
  const fileType = await fileTypeFromBuffer(buffer);
  
  if (!fileType) {
    return { valid: false, error: 'Не удалось определить тип файла' };
  }

  const allowedTypes = expectedType === 'image' 
    ? ALLOWED_MIME_TYPES.images 
    : expectedType === 'video' 
      ? ALLOWED_MIME_TYPES.videos 
      : ALLOWED_MIME_TYPES.documents;

  if (!allowedTypes.includes(fileType.mime)) {
    return {
      valid: false,
      error: `Недопустимый тип файла: ${fileType.mime}. Разрешены: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true, mimeType: fileType.mime };
}

// Использование в uploadFile:
export async function uploadFile(file: Express.Multer.File, type: 'image' | 'video' | 'document') {
  const validation = await validateFile(file.buffer, type);
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // ... существующий код загрузки
}
```

**Тестирование:**
```bash
# Попытка загрузить .exe с переименованием в .jpg - должна быть ошибка
curl -X POST -F "file=@malicious.jpg" http://localhost:3001/api/upload/image
```

**Файлы для изменения:**
- `backend/src/services/uploadService.ts`
- `backend/package.json` (добавить file-type)

---

### 📌 B0.3 — Установить и настроить Redis

**Требуемые действия:**

1. Установить Redis (если не установлен):
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

2. Установить npm пакет:
```bash
npm install redis
npm install @types/redis --save-dev
```

3. Создать конфигурацию Redis (`backend/src/config/redis.ts`):
```typescript
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: слишком много попыток переподключения');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => console.error('Redis Error:', err));
  redisClient.on('connect', () => console.log('Redis: подключено'));
  redisClient.on('reconnecting', () => console.log('Redis: переподключение...'));

  await redisClient.connect();
  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
```

4. Добавить в `.env`:
```env
REDIS_URL=redis://localhost:6379
```

**Тестирование:**
```bash
redis-cli ping  # Должен вернуть PONG
```

**Файлы для создания/изменения:**
- `backend/src/config/redis.ts` (создать)
- `backend/.env` (добавить REDIS_URL)
- `backend/package.json` (добавить redis)

---

### 📌 B0.4 — Перенести OTP хранилище в Redis

**Проблема:**  
OTP хранится в переменной в памяти (Map или Object). При перезапуске сервера все OTP теряются.

**Требуемые изменения в `authController.ts`:**

```typescript
import { getRedisClient } from '../config/redis';

const OTP_PREFIX = 'otp:';
const OTP_TTL = 300; // 5 минут

// Сохранение OTP
async function saveOTP(phone: string, otp: string): Promise<void> {
  const redis = await getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  
  await redis.setEx(key, OTP_TTL, JSON.stringify({
    code: otp,
    attempts: 0,
    createdAt: Date.now()
  }));
}

// Получение OTP
async function getOTP(phone: string): Promise<{
  code: string;
  attempts: number;
  createdAt: number;
} | null> {
  const redis = await getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  const data = await redis.get(key);
  
  return data ? JSON.parse(data) : null;
}

// Увеличение счетчика попыток
async function incrementOTPAttempts(phone: string): Promise<number> {
  const redis = await getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  const data = await getOTP(phone);
  
  if (!data) return -1;
  
  data.attempts += 1;
  const ttl = await redis.ttl(key);
  await redis.setEx(key, ttl > 0 ? ttl : OTP_TTL, JSON.stringify(data));
  
  return data.attempts;
}

// Удаление OTP после успешной верификации
async function deleteOTP(phone: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.del(`${OTP_PREFIX}${phone}`);
}

// Обновить sendOTP endpoint
export async function sendOTP(req: Request, res: Response) {
  const { phone } = req.body;
  
  // Генерация 6-значного OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Сохранение в Redis
  await saveOTP(phone, otp);
  
  // Отправка SMS (Eskiz.uz)
  // await sendSMS(phone, `Ваш код: ${otp}`);
  
  res.json({ success: true, message: 'OTP отправлен' });
}

// Обновить verifyOTP endpoint
export async function verifyOTP(req: Request, res: Response) {
  const { phone, code } = req.body;
  
  const otpData = await getOTP(phone);
  
  if (!otpData) {
    return res.status(400).json({ error: 'OTP не найден или истек' });
  }
  
  // Проверка количества попыток
  if (otpData.attempts >= 3) {
    await deleteOTP(phone);
    return res.status(429).json({ error: 'Слишком много попыток. Запросите новый код.' });
  }
  
  if (otpData.code !== code) {
    await incrementOTPAttempts(phone);
    return res.status(400).json({ error: 'Неверный код' });
  }
  
  // OTP верный - удаляем и авторизуем
  await deleteOTP(phone);
  
  // ... логика создания/входа пользователя и выдачи JWT
}
```

**Тестирование:**
```bash
# Проверка что OTP сохраняется в Redis
redis-cli keys "otp:*"

# Проверка TTL
redis-cli ttl "otp:+998901234567"
```

**Файлы для изменения:**
- `backend/src/controllers/authController.ts`

---

### 📌 B0.5 — Сгенерировать криптостойкий JWT секрет

**Проблема:**  
JWT_SECRET может быть слабым (например, "secret" или короткая строка).

**Требуемые изменения:**

1. Сгенерировать новый секрет:
```bash
# Генерация 256-bit ключа
openssl rand -hex 32
# или
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Обновить `.env`:
```env
# СТАРОЕ:
# JWT_SECRET=secret

# НОВОЕ (пример, сгенерируй свой!):
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Также добавить время жизни токенов
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d
```

3. Обновить код генерации токена (если нужно):
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET должен быть не менее 64 символов');
}

function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m' }
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES || '7d' }
  );
}
```

**Файлы для изменения:**
- `backend/.env`
- `backend/src/utils/jwt.ts` или `authController.ts`

---

### 📌 B0.6 — Убрать hardcoded IP

**Проблема:**  
В коде присутствует hardcoded IP `64.226.94.133`.

**Найти все вхождения:**
```bash
grep -rn "64.226.94.133" backend/
```

**Требуемые изменения:**

1. Добавить в `.env`:
```env
API_BASE_URL=https://api.gogomarke.uz
DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
```

2. Заменить hardcoded значения:
```typescript
// БЫЛО:
const apiUrl = 'http://64.226.94.133:3001';

// СТАЛО:
const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
```

**Файлы для изменения:**
- `backend/src/services/uploadService.ts`
- Любые другие файлы с hardcoded IP

---

### 📌 B0.7 — Исправить SSL конфигурацию БД

**Проблема:**  
В конфигурации БД стоит `rejectUnauthorized: false`, что отключает проверку SSL сертификата.

**Текущий код (примерно):**
```typescript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false  // ⚠️ НЕБЕЗОПАСНО
    }
  }
});
```

**Требуемые изменения (`database.ts`):**
```typescript
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

const dialectOptions = isProduction ? {
  ssl: {
    require: true,
    rejectUnauthorized: true,
    // Если нужен CA сертификат
    // ca: fs.readFileSync(path.join(__dirname, '../certs/ca-certificate.crt')).toString()
  }
} : {};

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: isProduction ? false : console.log,
  dialectOptions,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

**Файлы для изменения:**
- `backend/src/config/database.ts`

---

## 4. Формат отчета

### Обязательные поля

Каждый отчет ДОЛЖЕН содержать:

```markdown
## [COPILOT-REPORT]

**Дата:** YYYY-MM-DD HH:MM (UTC+5)
**Задача:** ID и название задачи
**Статус:** ✅ Завершено | ⏳ В процессе | 🚫 Заблокировано

### Выполненные действия
- [ ] Действие 1
- [ ] Действие 2

### Измененные файлы
| Файл | Тип изменения |
|------|---------------|
| `path/to/file.ts` | Модификация / Создание / Удаление |

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

### Глобальный чеклист Фазы 0 (Backend)

- [ ] **B0.1** CORS ограничен конкретными доменами
  - [ ] `app.ts` обновлен
  - [ ] `socketService.ts` обновлен
  - [ ] Тест пройден

- [ ] **B0.2** Валидация MIME-type работает
  - [ ] Пакет `file-type` установлен
  - [ ] `uploadService.ts` обновлен
  - [ ] Тест с вредоносным файлом пройден

- [ ] **B0.3** Redis установлен и настроен
  - [ ] Redis сервер работает
  - [ ] Пакет `redis` установлен
  - [ ] `config/redis.ts` создан
  - [ ] Подключение работает

- [ ] **B0.4** OTP хранится в Redis
  - [ ] `authController.ts` обновлен
  - [ ] OTP сохраняется с TTL
  - [ ] Лимит попыток работает
  - [ ] Тест пройден

- [ ] **B0.5** JWT секрет криптостойкий
  - [ ] Новый секрет сгенерирован (256 bit)
  - [ ] `.env` обновлен
  - [ ] Валидация длины добавлена

- [ ] **B0.6** Нет hardcoded IP
  - [ ] Все IP найдены через grep
  - [ ] Заменены на env переменные
  - [ ] `.env` обновлен

- [ ] **B0.7** SSL БД корректно настроен
  - [ ] `rejectUnauthorized: true` для production
  - [ ] CA сертификат добавлен (если нужен)

---

## 6. Координация с Cursor

### ⚠️ Файлы, которые трогает ТОЛЬКО Copilot (Backend)

```
backend/
├── src/
│   ├── controllers/*.ts     ← ТОЛЬКО ТЫ
│   ├── services/*.ts        ← ТОЛЬКО ТЫ
│   ├── config/*.ts          ← ТОЛЬКО ТЫ
│   ├── middleware/*.ts      ← ТОЛЬКО ТЫ
│   ├── models/*.ts          ← ТОЛЬКО ТЫ
│   ├── routes/*.ts          ← ТОЛЬКО ТЫ
│   ├── utils/*.ts           ← ТОЛЬКО ТЫ
│   └── app.ts               ← ТОЛЬКО ТЫ
├── .env                     ← ТОЛЬКО ТЫ
└── package.json             ← ТОЛЬКО ТЫ
```

### ❌ Файлы, которые трогает ТОЛЬКО Cursor (Frontend)

```
web/                         ← НЕ ТРОГАЙ
frontend/                    ← НЕ ТРОГАЙ
```

### 🔄 Точки синхронизации

| Событие | Действие |
|---------|----------|
| Изменение API endpoints | Уведомить Cursor для обновления frontend |
| Изменение формата ответа API | Уведомить Cursor |
| Новые env переменные | Документировать в `.env.example` |
| Изменение CORS origins | Уведомить Cursor о новых доменах |

### 🌿 Работа с Git

```bash
# Твоя ветка
git checkout -b copilot/phase0-security

# После каждой задачи
git add .
git commit -m "feat(security): B0.X - описание"

# Перед созданием PR - получить изменения
git fetch origin
git rebase origin/main

# Push
git push origin copilot/phase0-security
```

### Избежание конфликтов

1. **Никогда не редактируй файлы Cursor** (web/, frontend/)
2. **Каждая задача = отдельный коммит**
3. **При конфликте в общих файлах** — обсуди с Cursor
4. **Синхронизация после завершения фазы**

---

## 7. Пример отчета

```markdown
## [COPILOT-REPORT]

**Дата:** 2026-01-14 10:30 (UTC+5)  
**Задача:** B0.1 — Настроить CORS на конкретные домены  
**Статус:** ✅ Завершено

### Выполненные действия
- [x] Создан массив allowedOrigins с доменами
- [x] Обновлена CORS конфигурация в app.ts
- [x] Обновлен WebSocket CORS в socketService.ts
- [x] Добавлены env переменные WEB_URL, ADMIN_URL
- [x] Проведено тестирование с curl

### Измененные файлы
| Файл | Тип изменения |
|------|---------------|
| `backend/src/app.ts` | Модификация |
| `backend/src/services/socketService.ts` | Модификация |
| `backend/.env.example` | Модификация |

### Проблемы и решения
| Проблема | Решение |
|----------|----------|
| Mobile app отправляет запросы без Origin header | Добавил проверку `if (!origin) return callback(null, true)` |

### Коммит
```
git commit -m "feat(security): B0.1 - настроить CORS на конкретные домены

- Ограничить CORS только разрешенными доменами
- Обновить WebSocket CORS
- Добавить env переменные для доменов

Closes #SEC-001"
```

### Следующие шаги
1. B0.5 — Сгенерировать криптостойкий JWT секрет
2. B0.6 — Убрать hardcoded IP

### Время работы
- Начало: 09:00
- Окончание: 10:30
- Всего: 1 час 30 минут
```

---

## 📚 Полезные команды

```bash
# Запуск backend в dev режиме
npm run dev

# Проверка типов TypeScript
npm run type-check

# Запуск тестов
npm test

# Проверка Redis
redis-cli ping

# Поиск hardcoded значений
grep -rn "64.226.94.133" backend/
grep -rn "hardcoded" backend/

# Проверка CORS
curl -H "Origin: https://gogomarke.uz" -I http://localhost:3001/api/health
```

---

**Приступай к работе!** Начни с задачи **B0.5** (JWT секрет), это самая быстрая и независимая задача.

---

*Документ создан: 13 января 2026 г.*
