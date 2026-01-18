# Задание для следующего чата: GoGoMarket.uz

## Контекст проекта

**GoGoMarket.uz** — социальный маркетплейс с видео-контентом, похожий на TikTok Shop.

### Технический стек
- **Backend**: Node.js + Express + TypeScript + Sequelize ORM
- **Database**: PostgreSQL
- **Frontend Web**: React + Vite + TypeScript + Tailwind CSS
- **Frontend Mobile**: Flutter (Dart)
- **File Storage**: DigitalOcean Spaces (S3-compatible)
- **Server**: DigitalOcean Droplet (64.226.94.133)

---

## Что уже сделано

### 1. Централизация финансовой логики ✅
- Создан `backend/src/services/financeService.ts` — единый центр расчетов
- Создан `backend/src/services/orderStateMachine.ts` — контроль статусов заказов
- Исправлен критический баг: теперь средства распределяются при доставке
- Все контроллеры используют financeService

### 2. Созданы SQL миграции ✅
- Файл: `backend/migrations/001_initial_schema.sql`
- Содержит 24 таблицы и все ENUM типы

### 3. Технический отчет ✅
- Файл: `backend/FINANCE_AUDIT_REPORT.md`

---

## Задания с приоритетами

### Приоритет 1: Выполнить миграции БД
```bash
# Подключиться к PostgreSQL и выполнить:
psql -U postgres -d gogomarket -f backend/migrations/001_initial_schema.sql

# Или через pgAdmin:
# 1. Открыть backend/migrations/001_initial_schema.sql
# 2. Выполнить SQL скрипт
# 3. Проверить создание таблиц
```

**Проверка:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Должно быть 24 таблицы
```

### Приоритет 2: Запустить и протестировать Backend
```bash
cd backend
npm install
npm run dev
```

**Проверка:**
```bash
curl http://localhost:3000/api/v1/health
# Ответ: {"success":true,"message":"API is running"}
```

### Приоритет 3: Проверить соответствие миграций коду
Убедиться, что все поля в миграциях соответствуют моделям:

| Модель | Файл |
|--------|------|
| User | `src/models/User.ts` |
| Product | `src/models/Product.ts` |
| Order | `src/models/Order.ts` |
| Transaction | `src/models/Transaction.ts` |
| Coupon | `src/models/Coupon.ts` |

### Приоритет 4: Настроить HTTPS и домен (опционально)
```bash
# На сервере 64.226.94.133:
# 1. Настроить DNS для gogomarke.uz → 64.226.94.133
# 2. Получить SSL сертификат через certbot
```

---

## Структура проекта

```
gogomarke.uz/
├── backend/
│   ├── src/
│   │   ├── controllers/     # REST API контроллеры
│   │   ├── models/          # Sequelize модели (24 шт)
│   │   ├── services/        # Бизнес-логика
│   │   │   ├── financeService.ts      # Финансовые расчеты
│   │   │   └── orderStateMachine.ts   # Статусы заказов
│   │   ├── routes/          # Express маршруты
│   │   └── types/           # TypeScript типы
│   └── migrations/
│       └── 001_initial_schema.sql
├── frontend/                # Flutter mobile app
├── web/
│   └── gogomarket-web/      # React web app
└── ASSIGNMENT_FOR_NEXT_CHAT.md  # Этот файл
```

---

## Команды для работы

### Backend
```bash
cd backend
npm install                 # Установка зависимостей
npm run dev                 # Запуск в режиме разработки
npm run build               # Сборка TypeScript
npx tsc --noEmit            # Проверка типов
```

### Frontend Web
```bash
cd web/gogomarket-web
npm install
npm run dev                 # Запуск на http://localhost:5173
npm run build               # Сборка для продакшена
```

### Frontend Mobile
```bash
cd frontend
flutter pub get
flutter run                 # Запуск на эмуляторе/устройстве
flutter build apk           # Сборка APK
```

---

## Чек-лист выполнения

- [ ] Миграции БД выполнены
- [ ] Backend запускается без ошибок
- [ ] API /health возвращает 200
- [ ] Web-приложение открывается
- [ ] TypeScript компилируется без ошибок

---

## API Endpoints для тестирования

```bash
# Health check
GET /api/v1/health

# Авторизация
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/send-otp
POST /api/v1/auth/verify-otp

# Продукты
GET /api/v1/products
GET /api/v1/products/:id

# Заказы
GET /api/v1/orders
POST /api/v1/orders

# Админка
GET /api/v1/admin/stats
GET /api/v1/admin/users
GET /api/v1/admin/orders
```

---

## Формат отчета

После выполнения задания, напишите:

```
## Отчет о выполнении

### Миграции БД
- Статус: [выполнено/не выполнено]
- Создано таблиц: [число]
- Ошибки: [если есть]

### Backend
- Статус: [работает/не работает]
- Порт: [3000]
- Ошибки: [если есть]

### Рекомендации
- [список рекомендаций]
```

---

## Контакты

- Репозиторий: https://github.com/buranovt2025-jpg/gogomarke.uz
- Ветка: `cursor/-bc-c5dbac09-4d95-4ec5-822a-3e2053ac7ad7-924d`
- Сервер: 64.226.94.133
