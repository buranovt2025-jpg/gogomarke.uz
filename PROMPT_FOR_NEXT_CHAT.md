# 📋 GoGoMarket.uz - Полный контекст проекта

## Общая информация

- **Проект:** GoGoMarket.uz - социальный видеомаркетплейс
- **Концепция:** TikTok + маркетплейс (видео с товарами)
- **Регион:** Узбекистан
- **Валюта:** UZS (узбекский сум)
- **Готовность:** 96%

## Технологии

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Sequelize ORM
- JWT аутентификация
- Socket.io для real-time
- PM2 для process management

### Frontend (Web)
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Axios

### Frontend (Mobile)
- Flutter/Dart
- В разработке

## Сервер

- **IP:** 64.226.94.133 (DigitalOcean)
- **API:** http://64.226.94.133/api/v1
- **Web:** http://64.226.94.133/

## База данных

```
Host: gogomarket-db-do-user-30865317-0.e.db.ondigitalocean.com
Port: 25060
User: doadmin
DB: defaultdb
Password: [хранится в /var/www/gogomarket/backend/.env на сервере]
```

## Роли пользователей

1. **buyer** - покупатель
2. **seller** - продавец
3. **courier** - курьер
4. **admin** - администратор

## Тестовые аккаунты

| Роль | Телефон | Пароль |
|------|---------|--------|
| Покупатель | +998911111111 | Test123! |
| Продавец | +998922222222 | Test123! |
| Курьер | +998933333333 | Test123! |
| Админ | +998944444444 | Test123! |

## Структура проекта

```
/workspace/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API контроллеры
│   │   ├── models/         # Sequelize модели
│   │   ├── routes/         # Express маршруты
│   │   ├── middleware/     # Auth, error handling
│   │   ├── services/       # Бизнес-логика
│   │   ├── utils/          # Logger, errorCodes
│   │   └── scripts/        # Мониторинг
│   ├── swagger.json        # API документация
│   └── package.json
├── web/gogomarket-web/     # React frontend
│   ├── src/
│   │   ├── pages/          # Страницы по ролям
│   │   ├── components/     # UI компоненты
│   │   ├── contexts/       # Auth, Cart
│   │   └── services/       # API клиент
│   └── package.json
├── frontend/               # Flutter mobile (WIP)
└── testing_reports/        # Отчеты о тестировании
```

## Выполненные доработки

### 1. Корзина (Cart)
- Пересоздана схема БД (carts + cart_items)
- POST /api/v1/cart/items
- GET /api/v1/cart
- PUT /api/v1/cart/items/:id
- DELETE /api/v1/cart/items/:id

### 2. QR-сканирование
- Улучшена валидация формата
- Поддержка base64
- Проверка срока действия (24ч)

### 3. Обработка ошибок
- ErrorCode enum (E1xxx-E5xxx)
- Стандартизированный AppError
- Улучшенный errorHandler

### 4. Чат
- Таблица chats создана
- chat_id добавлен в messages
- order_id теперь nullable

### 5. Инфраструктура
- Logger (backend/src/utils/logger.ts)
- Monitoring (npm run monitor)
- Swagger (backend/swagger.json)
- Test structure (backend/src/tests/)

## API Endpoints

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/profile
PUT  /api/v1/auth/profile
```

### Products
```
GET  /api/v1/products
GET  /api/v1/products/:id
POST /api/v1/products (seller)
PUT  /api/v1/products/:id (seller)
```

### Videos
```
GET  /api/v1/videos/feed
GET  /api/v1/videos/:id
POST /api/v1/videos (seller)
POST /api/v1/videos/:id/like
```

### Orders
```
POST /api/v1/orders
GET  /api/v1/orders
GET  /api/v1/orders/:id
POST /api/v1/orders/:id/confirm (seller)
POST /api/v1/orders/:id/accept (courier)
POST /api/v1/orders/:id/pickup (courier)
POST /api/v1/orders/:id/deliver (courier)
GET  /api/v1/orders/available (courier)
```

### Cart
```
GET  /api/v1/cart
POST /api/v1/cart/items
PUT  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
GET  /api/v1/cart/count
```

### Chat
```
POST /api/v1/chats
GET  /api/v1/chats
POST /api/v1/chats/:id/messages
GET  /api/v1/chats/:id/messages
```

### Seller
```
GET  /api/v1/seller/orders
GET  /api/v1/seller/reports?period=day|week|month
GET  /api/v1/seller/analytics
```

### Admin
```
GET  /api/v1/admin/stats
GET  /api/v1/admin/users
GET  /api/v1/admin/transactions
```

## Деплой команды

```bash
# Backend
ssh root@64.226.94.133 "cd /var/www/gogomarket && git pull && cd backend && npm run build && pm2 restart gogomarket-backend"

# Frontend
ssh root@64.226.94.133 "cd /var/www/gogomarket/web/gogomarket-web && npm run build && cp -r dist/* /var/www/html/"

# Проверка статуса
ssh root@64.226.94.133 "pm2 status"

# Логи
ssh root@64.226.94.133 "pm2 logs gogomarket-backend --lines 50"

# Мониторинг
ssh root@64.226.94.133 "cd /var/www/gogomarket/backend && npm run monitor"
```

## Что осталось (5%)

1. **Frontend Auth** - проверить сохранение сессии
2. **HTTPS** - настроить SSL сертификат
3. **Unit тесты** - опционально

## Полезные ссылки

- Сервер: http://64.226.94.133/
- API: http://64.226.94.133/api/v1/health
- Swagger: backend/swagger.json
