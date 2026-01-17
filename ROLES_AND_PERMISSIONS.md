# Роли и Права Доступа — GoGoMarket

**Дата создания:** 17 января 2026  
**Версия:** 1.0

---

## Обзор системы ролей

GoGoMarket использует систему из 4 основных ролей пользователей:

| Роль | Код | Описание |
|------|-----|----------|
| Администратор | `admin` | Полное управление платформой |
| Продавец | `seller` | Продажа товаров через видео |
| Покупатель | `buyer` | Покупка товаров |
| Курьер | `courier` | Доставка заказов |

---

## 1. Администратор (admin)

### Описание
Администратор имеет полный доступ ко всем функциям платформы и отвечает за модерацию контента, управление пользователями и финансовый контроль.

### Права доступа

| Категория | Права |
|-----------|-------|
| **Пользователи** | Просмотр, редактирование, блокировка, удаление |
| **Товары** | Просмотр, модерация, удаление |
| **Заказы** | Просмотр всех заказов, изменение статуса |
| **Видео** | Просмотр, модерация, удаление |
| **Транзакции** | Просмотр всех транзакций |
| **Споры** | Рассмотрение, принятие решений |
| **Возвраты** | Одобрение, отклонение |
| **Тикеты** | Просмотр, назначение, закрытие |
| **Отчеты** | Просмотр жалоб, принятие мер |
| **Выводы** | Одобрение, отклонение выводов средств |
| **Категории** | Создание, редактирование, удаление |
| **Статистика** | Полный доступ к аналитике |

### API Endpoints

```
GET    /api/v1/admin/users          - Список пользователей
PATCH  /api/v1/admin/users/:id      - Редактирование пользователя
GET    /api/v1/admin/stats          - Общая статистика
GET    /api/v1/admin/transactions   - Все транзакции
GET    /api/v1/disputes             - Все споры
PATCH  /api/v1/disputes/:id/status  - Решение по спору
GET    /api/v1/returns/admin        - Все возвраты
PATCH  /api/v1/returns/:id          - Решение по возврату
GET    /api/v1/tickets/admin        - Все тикеты
PATCH  /api/v1/tickets/:id          - Обновление тикета
GET    /api/v1/reports/admin        - Все жалобы
PATCH  /api/v1/reports/:id          - Решение по жалобе
GET    /api/v1/withdrawals/admin    - Все запросы на вывод
PATCH  /api/v1/withdrawals/:id      - Одобрение/отклонение вывода
```

### Экраны в приложении

- AdminDashboard — Главная панель
- AdminUsers — Управление пользователями
- AdminOrders — Все заказы
- AdminTransactions — Транзакции
- AdminDisputes — Споры
- AdminReturns — Возвраты
- AdminTickets — Тикеты поддержки
- AdminReports — Жалобы
- AdminWithdrawals — Выводы средств
- AdminCategories — Категории товаров
- AdminModeration — Модерация контента
- AdminStoriesPage — Модерация историй
- FinancialOverview — Финансовый обзор

---

## 2. Продавец (seller)

### Описание
Продавец создает товары, загружает видео, управляет заказами и получает выплаты за продажи.

### Права доступа

| Категория | Права |
|-----------|-------|
| **Товары** | Создание, редактирование, удаление своих товаров |
| **Видео** | Загрузка, редактирование, удаление своих видео |
| **Истории** | Создание историй (24ч TTL) |
| **Заказы** | Просмотр и управление своими заказами |
| **Возвраты** | Просмотр запросов на возврат, ответ |
| **Споры** | Просмотр споров по своим заказам |
| **Купоны** | Создание, редактирование, удаление купонов |
| **Кошелек** | Просмотр баланса, запрос на вывод |
| **Аналитика** | Статистика продаж и просмотров |
| **Чат** | Общение с покупателями |
| **Профиль** | Редактирование профиля магазина |

### API Endpoints

```
# Товары
GET    /api/v1/products/seller      - Свои товары
POST   /api/v1/products             - Создать товар
PUT    /api/v1/products/:id         - Обновить товар
DELETE /api/v1/products/:id         - Удалить товар

# Видео
GET    /api/v1/videos/my            - Свои видео
POST   /api/v1/videos               - Загрузить видео
DELETE /api/v1/videos/:id           - Удалить видео

# Истории
GET    /api/v1/stories/my           - Свои истории
POST   /api/v1/stories              - Создать историю
DELETE /api/v1/stories/:id          - Удалить историю

# Заказы
GET    /api/v1/seller/orders        - Заказы на мои товары
POST   /api/v1/orders/:id/confirm   - Подтвердить заказ
POST   /api/v1/orders/:id/cancel    - Отменить заказ

# Возвраты
GET    /api/v1/returns              - Запросы на возврат
PATCH  /api/v1/returns/:id          - Ответить на возврат

# Споры
GET    /api/v1/disputes             - Споры по моим заказам

# Купоны
GET    /api/v1/coupons              - Мои купоны
POST   /api/v1/coupons              - Создать купон
PATCH  /api/v1/coupons/:id          - Обновить купон
DELETE /api/v1/coupons/:id          - Удалить купон

# Финансы
GET    /api/v1/payments/wallet      - Баланс кошелька
GET    /api/v1/withdrawals          - Мои выводы
POST   /api/v1/withdrawals          - Запросить вывод

# Аналитика
GET    /api/v1/seller/analytics     - Аналитика продаж

# Чат
GET    /api/v1/chat/:orderId/messages - Сообщения по заказу
POST   /api/v1/chat/:orderId/messages - Отправить сообщение
```

### Экраны в приложении

- SellerDashboard — Главная панель продавца
- SellerProducts — Управление товарами
- ProductForm — Создание/редактирование товара
- SellerOrders — Заказы
- SellerVideosPage — Управление видео
- CreateStoryPage — Создание историй
- SellerReturns — Возвраты
- SellerCoupons — Купоны
- SellerPayouts — Выводы средств
- SellerAnalytics — Аналитика
- ChatPage — Чат с покупателями

---

## 3. Покупатель (buyer)

### Описание
Покупатель просматривает товары и видео, совершает покупки, оставляет отзывы и общается с продавцами.

### Права доступа

| Категория | Права |
|-----------|-------|
| **Товары** | Просмотр, поиск, фильтрация |
| **Видео** | Просмотр ленты, комментирование |
| **Истории** | Просмотр историй продавцов |
| **Заказы** | Создание, отслеживание, отмена |
| **Избранное** | Добавление/удаление товаров |
| **Подписки** | Подписка на продавцов |
| **Отзывы** | Создание отзывов на купленные товары |
| **Возвраты** | Создание запросов на возврат |
| **Споры** | Создание споров |
| **Тикеты** | Создание обращений в поддержку |
| **Жалобы** | Жалобы на товары/видео/пользователей |
| **Чат** | Общение с продавцами |
| **Уведомления** | Просмотр уведомлений |
| **История** | Просмотр истории просмотров |

### API Endpoints

```
# Товары
GET    /api/v1/products             - Список товаров
GET    /api/v1/products/:id         - Детали товара

# Видео
GET    /api/v1/videos/feed          - Лента видео
GET    /api/v1/videos/:id/comments  - Комментарии к видео
POST   /api/v1/videos/:id/comments  - Добавить комментарий

# Истории
GET    /api/v1/stories              - Истории продавцов
POST   /api/v1/stories/:id/view     - Отметить просмотр

# Заказы
GET    /api/v1/orders               - Мои заказы
GET    /api/v1/orders/:id           - Детали заказа
POST   /api/v1/orders               - Создать заказ

# Избранное
GET    /api/v1/favorites            - Список избранного
POST   /api/v1/favorites            - Добавить в избранное
DELETE /api/v1/favorites/:id        - Удалить из избранного
GET    /api/v1/favorites/:id/check  - Проверить в избранном

# Подписки
GET    /api/v1/subscriptions        - Мои подписки
POST   /api/v1/subscriptions        - Подписаться
DELETE /api/v1/subscriptions/:id    - Отписаться
GET    /api/v1/subscriptions/:id/check - Проверить подписку

# Отзывы
GET    /api/v1/reviews/product/:id  - Отзывы на товар
POST   /api/v1/reviews              - Создать отзыв
GET    /api/v1/reviews/my           - Мои отзывы
DELETE /api/v1/reviews/:id          - Удалить отзыв

# Возвраты
POST   /api/v1/returns              - Запросить возврат
GET    /api/v1/returns              - Мои возвраты

# Споры
POST   /api/v1/disputes             - Создать спор
GET    /api/v1/disputes             - Мои споры

# Тикеты
POST   /api/v1/tickets              - Создать тикет
GET    /api/v1/tickets              - Мои тикеты

# Жалобы
POST   /api/v1/reports              - Создать жалобу

# Чат
GET    /api/v1/chat/:orderId/messages - Сообщения по заказу
POST   /api/v1/chat/:orderId/messages - Отправить сообщение

# Уведомления
GET    /api/v1/notifications        - Мои уведомления
PATCH  /api/v1/notifications/:id/read - Прочитать
POST   /api/v1/notifications/mark-all-read - Прочитать все

# История
GET    /api/v1/history              - История просмотров
POST   /api/v1/history              - Добавить в историю
DELETE /api/v1/history              - Очистить историю
```

### Экраны в приложении

- HomePage — Главная с товарами
- VideoFeedPage — Лента видео
- ProductsPage — Каталог товаров
- ProductDetailPage — Детали товара
- SellerStorePage — Магазин продавца
- CartPage — Корзина
- CheckoutPage — Оформление заказа
- OrdersPage — Мои заказы
- OrderTrackingPage — Отслеживание заказа
- FavoritesPage — Избранное
- DisputesPage — Споры
- CreateDisputePage — Создание спора
- ReturnsPage — Возвраты
- CreateReturnPage — Создание возврата
- SupportPage — Поддержка
- CreateTicketPage — Создание тикета
- ChatPage — Чат с продавцом
- NotificationsPage — Уведомления
- ViewHistoryPage — История просмотров
- Stories — Просмотр историй

---

## 4. Курьер (courier)

### Описание
Курьер принимает заказы на доставку, сканирует QR-коды при получении и передаче товара, получает выплаты за доставку.

### Права доступа

| Категория | Права |
|-----------|-------|
| **Заказы** | Просмотр доступных, принятие, доставка |
| **QR-коды** | Сканирование при pickup и delivery |
| **Выплаты** | Просмотр заработка, запрос вывода |
| **Статистика** | Своя статистика доставок |
| **Геолокация** | Обновление местоположения |

### API Endpoints

```
# Заказы
GET    /api/v1/orders/available     - Доступные заказы
POST   /api/v1/orders/:id/accept    - Принять заказ
POST   /api/v1/orders/:id/pickup    - Забрать у продавца (QR)
POST   /api/v1/orders/:id/deliver   - Доставить покупателю (QR/код)

# Статистика
GET    /api/v1/courier/stats        - Статистика курьера

# Выплаты
GET    /api/v1/withdrawals          - Мои выводы
POST   /api/v1/withdrawals          - Запросить вывод
```

### Экраны в приложении

- CourierDashboard — Главная панель курьера
- CourierPayouts — Выплаты

---

## Матрица прав доступа

| Функция | Admin | Seller | Buyer | Courier |
|---------|-------|--------|-------|---------|
| Просмотр товаров | ✅ | ✅ | ✅ | ❌ |
| Создание товаров | ❌ | ✅ | ❌ | ❌ |
| Управление пользователями | ✅ | ❌ | ❌ | ❌ |
| Создание заказов | ❌ | ❌ | ✅ | ❌ |
| Доставка заказов | ❌ | ❌ | ❌ | ✅ |
| Загрузка видео | ❌ | ✅ | ❌ | ❌ |
| Комментирование | ✅ | ✅ | ✅ | ❌ |
| Создание историй | ❌ | ✅ | ❌ | ❌ |
| Создание купонов | ❌ | ✅ | ❌ | ❌ |
| Рассмотрение споров | ✅ | ❌ | ❌ | ❌ |
| Вывод средств | ❌ | ✅ | ❌ | ✅ |
| Финансовая статистика | ✅ | ✅* | ❌ | ✅* |

*Только своя статистика

---

## Техническая реализация

### Middleware аутентификации

```typescript
// backend/src/middleware/authMiddleware.ts

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findByPk(decoded.userId);
  next();
};

export const authorize = (...roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
```

### Пример использования в роутах

```typescript
// Только для админов
router.get('/admin/users', authenticate, authorize('admin'), getUsers);

// Для продавцов и админов
router.get('/seller/orders', authenticate, authorize('seller', 'admin'), getOrders);

// Для всех авторизованных
router.get('/profile', authenticate, getProfile);
```

### Модель пользователя

```typescript
// backend/src/models/User.ts

interface User {
  id: string;
  phone: string;
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'seller' | 'buyer' | 'courier';
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  balance: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Регистрация и верификация

### Процесс регистрации

1. Пользователь вводит телефон и пароль
2. Выбирает роль (buyer/seller/courier)
3. Получает OTP по SMS
4. Подтверждает номер телефона
5. Для seller/courier требуется дополнительная верификация

### Верификация продавца

1. Загрузка документов (паспорт, свидетельство ИП)
2. Модерация администратором
3. Одобрение/отклонение
4. Уведомление о статусе

### Верификация курьера

1. Загрузка документов (паспорт, права)
2. Модерация администратором
3. Одобрение/отклонение
4. Уведомление о статусе

---

## Изменение роли

Изменение роли пользователя возможно только через администратора:

```typescript
// PATCH /api/v1/admin/users/:id
{
  "role": "seller"
}
```

---

*Документ создан: 17 января 2026*
