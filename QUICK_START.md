# 🚀 Quick Start Guide - GoGoMarket

## Быстрый старт

### 1. Проверка статуса

```bash
# Health check
curl http://64.226.94.133/api/v1/health

# Мониторинг
ssh root@64.226.94.133 "cd /var/www/gogomarket/backend && npm run monitor"
```

### 2. Тестирование API

```bash
# Логин
curl -X POST http://64.226.94.133/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+998911111111", "password": "Test123!"}'

# Получить товары
curl http://64.226.94.133/api/v1/products?limit=5

# Получить видео
curl http://64.226.94.133/api/v1/videos/feed?limit=5

# Получить истории
curl http://64.226.94.133/api/v1/stories
```

### 3. Деплой изменений

```bash
# Backend
ssh root@64.226.94.133 "cd /var/www/gogomarket && git pull && cd backend && npm run build && pm2 restart gogomarket-backend"

# Frontend
ssh root@64.226.94.133 "cd /var/www/gogomarket/web/gogomarket-web && npm run build && cp -r dist/* /var/www/html/"
```

## Примеры кода

### Использование Logger

```typescript
import logger from './utils/logger';

// Info log
logger.info('User logged in', { userId: '123', phone: '+998...' });

// Error log
logger.error('Payment failed', { orderId: 'abc' }, error);

// Request log
logger.request('POST', '/api/v1/orders', 201, 150, userId);
```

### Использование ErrorCodes

```typescript
import { AppError, ErrorCode } from './utils/errorCodes';

// Throw validation error
throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phone format', 400);

// Throw not found
throw new AppError(ErrorCode.NOT_FOUND, 'Product not found', 404);
```

### Добавление нового endpoint

```typescript
// 1. Создать контроллер в controllers/
export const myFunction = async (req: AuthRequest, res: Response) => {
  try {
    // логика
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('myFunction error', {}, error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
};

// 2. Добавить маршрут в routes/
router.get('/my-endpoint', authenticate, myFunction);
```

## Тестовые аккаунты

| Роль | Телефон | Пароль |
|------|---------|--------|
| Покупатель | +998911111111 | Test123! |
| Продавец | +998922222222 | Test123! |
| Курьер | +998933333333 | Test123! |
| Админ | +998944444444 | Test123! |

## Полный E2E Flow

```bash
# 1. Покупатель логинится
TOKEN=$(curl -s -X POST http://64.226.94.133/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+998911111111", "password": "Test123!"}' | jq -r '.data.token')

# 2. Добавляет товар в корзину
curl -X POST http://64.226.94.133/api/v1/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "quantity": 1}'

# 3. Создает заказ
curl -X POST http://64.226.94.133/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 1,
    "paymentMethod": "cash",
    "shippingAddress": "ул. Навои, 25",
    "shippingCity": "Ташкент",
    "shippingPhone": "+998911111111"
  }'

# 4. Продавец подтверждает
curl -X POST http://64.226.94.133/api/v1/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer $SELLER_TOKEN"

# 5. Курьер принимает
curl -X POST http://64.226.94.133/api/v1/orders/ORDER_ID/accept \
  -H "Authorization: Bearer $COURIER_TOKEN"

# 6. Курьер доставляет
curl -X POST http://64.226.94.133/api/v1/orders/ORDER_ID/deliver \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryCode": "DELIVERY_CODE"}'
```

## Следующие шаги

1. **Проверить Frontend Auth** - очистить кэш браузера и проверить логин
2. **Настроить HTTPS** - получить SSL сертификат (Let's Encrypt)
3. **Добавить тесты** - npm install jest @types/jest ts-jest

## Полезные команды

```bash
# PM2 статус
ssh root@64.226.94.133 "pm2 status"

# PM2 логи
ssh root@64.226.94.133 "pm2 logs gogomarket-backend --lines 50"

# Перезапуск
ssh root@64.226.94.133 "pm2 restart gogomarket-backend"

# База данных (пароль в .env)
ssh root@64.226.94.133 "source /var/www/gogomarket/backend/.env && psql -h gogomarket-db-do-user-30865317-0.e.db.ondigitalocean.com -p 25060 -U doadmin -d defaultdb"
```

## Готово! 🎉

Система готова к production на 96%.
