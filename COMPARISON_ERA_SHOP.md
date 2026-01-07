# GoGoMarket vs Era Shop - Полное сравнение

**Дата анализа:** 7 января 2026
**Цель:** Определить что есть, чего не хватает, и приоритеты реализации

---

## Общая статистика

| Метрика | Era Shop | GoGoMarket | Разница |
|---------|----------|------------|---------|
| Flutter Views | 94 | ~50 | -44 |
| Controllers/Providers | 70+ | 23 | -47 |
| Backend Models | 32 | 21 | -11 |
| Backend Routes | 30 | 24 | -6 |
| API Endpoints | 150+ | ~100 | -50 |
| Языки локализации | 20 | 3 | -17 |
| UI Strings | 435+ | ~90 | -345 |

---

## Технологический стек

| Компонент | Era Shop | GoGoMarket |
|-----------|----------|------------|
| Mobile Framework | Flutter 3.x + GetX | Flutter 3.x + Provider |
| Backend | Node.js + Express.js | Node.js + Express.js + TypeScript |
| Database | MongoDB + Mongoose | PostgreSQL + Sequelize |
| Admin Panel | React + Redux + MUI | React + Context + Radix UI + Tailwind |
| Real-time | Socket.io | Socket.io |
| Live Streaming | Zego SDK | НЕТ |
| Push | Firebase Cloud Messaging | Firebase Cloud Messaging |
| Payments | Stripe, Razorpay, FlutterWave | Payme, Click (Узбекистан) |
| File Storage | Firebase Storage | AWS S3 |

---

## Что ЕСТЬ у GoGoMarket

### Основной функционал
- E-commerce маркетплейс (товары, категории, корзина, заказы)
- 4 роли пользователей (Buyer, Seller, Courier, Admin)
- Видео/Рилсы (без Live Streaming)
- Stories (истории) - уникально!
- Push-уведомления (Firebase)
- Чат покупатель-продавец (Socket.io)
- Рейтинги и отзывы
- Купоны/промокоды
- Кошелёк продавца с выводом средств
- Избранное/Wishlist
- Адреса доставки
- Dark/Light темы
- 3 языка (ru/en/uz)

### Уникальные фичи GoGoMarket (нет в Era Shop)
- **Роль Courier** - отдельная роль курьера с дашбордом
- **QR-коды** для подтверждения доставки (sellerQrCode, courierQrCode, deliveryCode)
- **Споры (Disputes)** - полный flow разрешения споров
- **Возвраты (Returns)** - система возвратов товаров
- **Тикеты поддержки** - система обращений в поддержку
- **История просмотров** - ViewHistory
- **Сравнение товаров** - CompareProvider
- **AI-extraction** - aiExtractedTitle, aiExtractedPrice, aiExtractedDescription в Video модели
- **Платежи Payme/Click** - локализация для Узбекистана
- **TypeScript backend** - типизация на сервере

---

## Чего НЕТ у GoGoMarket (есть в Era Shop)

### Высокий приоритет (MVP)

| Функция | Описание | Сложность |
|---------|----------|-----------|
| Forgot Password | Восстановление пароля через OTP/Email | Легко |
| Google Sign-In | Авторизация через Google | Средне |
| Apple Sign-In | Авторизация через Apple | Средне |
| SubCategories | Подкатегории товаров | Легко |
| Attributes | Размеры, цвета и другие атрибуты товаров | Средне |
| Product Moderation | Approve/Reject flow для товаров | Средне |
| Seller Request | Заявки на становление продавцом | Средне |

### Средний приоритет

| Функция | Описание | Сложность |
|---------|----------|-----------|
| FAQ | Часто задаваемые вопросы | Легко |
| New Collection | Флаг "новая коллекция" для товаров | Легко |
| Top Selling | Топ продаж | Легко |
| Popular Products | Популярные товары | Легко |
| Just For You | Рекомендации для пользователя | Средне |
| Search History | История поиска | Легко |
| Delete Account | Удаление аккаунта (GDPR) | Легко |
| Firebase Crashlytics | Отчёты об ошибках | Легко |
| Bank Details | Банковские реквизиты продавца | Легко |

### Низкий приоритет (после MVP)

| Функция | Описание | Сложность |
|---------|----------|-----------|
| Live Streaming | Zego SDK для live продаж | Сложно |
| Stripe | Международные платежи | Средне |
| Razorpay | Международные платежи | Средне |
| FlutterWave | Международные платежи | Средне |
| +17 языков | Расширение локализации | Долго |
| Cron Job | Автоматизация выплат в конце месяца | Средне |
| Email (Nodemailer) | Email уведомления | Легко |
| isFakeData | Демо-режим с тестовыми данными | Легко |
| Gender Select | Выбор пола в профиле | Легко |

---

## Сравнение моделей данных

### User Model
| Поле | Era Shop | GoGoMarket |
|------|----------|------------|
| firstName, lastName | Есть | Есть (name) |
| email | Есть | Есть |
| phone | Есть | Есть |
| password | Есть | Есть |
| image/avatar | Есть | Есть |
| gender | Есть | НЕТ |
| dob | Есть | НЕТ |
| loginType (google/apple/email) | Есть | НЕТ |
| followers/following | Есть | Есть (через Subscription) |
| notification settings | Есть | НЕТ |
| isBlock | Есть | Есть |
| isSeller | Есть | Есть (role) |
| refund | Есть | НЕТ |

### Product Model
| Поле | Era Shop | GoGoMarket |
|------|----------|------------|
| name, description | Есть | Есть |
| price | Есть | Есть |
| images | Есть | Есть |
| category | Есть | Есть |
| subCategory | Есть | НЕТ |
| attributes | Есть | НЕТ (есть ProductVariant) |
| quantity/stock | Есть | Есть |
| isOutOfStock | Есть | Есть |
| isNewCollection | Есть | НЕТ |
| isSelect (for live) | Есть | НЕТ |
| createStatus (moderation) | Есть | НЕТ |
| updateStatus (moderation) | Есть | НЕТ |
| sold | Есть | НЕТ |
| searchCount | Есть | НЕТ |

### Order Model
| Поле | Era Shop | GoGoMarket |
|------|----------|------------|
| orderId | Есть | Есть (orderNumber) |
| userId | Есть | Есть (buyerId) |
| items | Есть | Есть (productId) |
| status | Есть | Есть |
| shippingAddress | Есть | Есть |
| paymentGateway | Есть | Есть (paymentMethod) |
| promoCode | Есть | НЕТ |
| trackingId | Есть | НЕТ |
| trackingLink | Есть | НЕТ |
| deliveredServiceName | Есть | НЕТ |
| commissionPerProduct | Есть | Есть (platformCommission) |
| sellerQrCode | НЕТ | Есть |
| courierQrCode | НЕТ | Есть |
| deliveryCode | НЕТ | Есть |
| courierFee | НЕТ | Есть |

---

## Сравнение API Endpoints

### Auth/User
| Endpoint | Era Shop | GoGoMarket |
|----------|----------|------------|
| POST /login | Есть | Есть |
| POST /register | Есть | Есть |
| POST /verify-otp | Есть | Есть |
| GET /profile | Есть | Есть |
| PATCH /update | Есть | Есть |
| POST /checkUser | Есть | НЕТ |
| POST /checkPassword | Есть | НЕТ |
| POST /forgotPassword | Есть | НЕТ |
| DELETE /deleteAccount | Есть | НЕТ |
| GET /topCustomers | Есть | НЕТ |

### Product
| Endpoint | Era Shop | GoGoMarket |
|----------|----------|------------|
| CRUD | Есть | Есть |
| GET /categories | Есть | Есть |
| GET /subCategories | Есть | НЕТ |
| POST /search | Есть | Есть |
| GET /searchHistory | Есть | НЕТ |
| POST /filter | Есть | Частично |
| PATCH /acceptRequest | Есть | НЕТ |
| PATCH /isNewCollection | Есть | НЕТ |
| GET /topSelling | Есть | НЕТ |
| GET /popular | Есть | НЕТ |
| GET /justForYou | Есть | НЕТ |
| PATCH /selectForLive | Есть | НЕТ |

### Order
| Endpoint | Era Shop | GoGoMarket |
|----------|----------|------------|
| CRUD | Есть | Есть |
| PATCH /cancel | Есть | Есть |
| GET /orderCount | Есть | Есть |
| GET /recentOrders | Есть | Есть |
| PATCH /updateTracking | Есть | НЕТ |

---

## Сравнение Flutter зависимостей

### Авторизация
| Пакет | Era Shop | GoGoMarket |
|-------|----------|------------|
| firebase_auth | Есть | НЕТ |
| google_sign_in | Есть | НЕТ |
| sign_in_with_apple | Есть | НЕТ |
| firebase_core | Есть | Есть |
| firebase_messaging | Есть | Есть |

### Live Streaming
| Пакет | Era Shop | GoGoMarket |
|-------|----------|------------|
| zego_express_engine | Есть | НЕТ |

### Платежи
| Пакет | Era Shop | GoGoMarket |
|-------|----------|------------|
| flutter_stripe | Есть | НЕТ |
| razorpay_flutter | Есть | НЕТ |
| flutterwave_standard | Есть | НЕТ |

### Общие (есть у обоих)
- socket_io_client
- cached_network_image
- video_player + chewie
- shimmer
- connectivity_plus
- url_launcher
- image_picker
- intl

### GoGoMarket уникальные
- qr_flutter + mobile_scanner (QR коды)
- local_auth (биометрия)
- geolocator (геолокация)
- flutter_secure_storage
- camera (прямая съёмка)
- share_plus

---

## Сравнение Admin Panel

### Модули
| Модуль | Era Shop | GoGoMarket |
|--------|----------|------------|
| Dashboard | Есть | Есть |
| Users | Есть | Есть |
| Products | Есть | Есть |
| Orders | Есть | Есть |
| Categories | Есть | Есть |
| SubCategories | Есть | НЕТ |
| Sellers | Есть | Есть (через Users) |
| SellerRequest | Есть | НЕТ |
| Withdrawals | Есть | Есть |
| Bank | Есть | НЕТ |
| PromoCode | Есть | НЕТ (есть в backend) |
| FAQ | Есть | НЕТ |
| Attributes | Есть | НЕТ |
| Settings | Есть | НЕТ |
| FakeProduct/Reels | Есть | НЕТ |
| LiveSeller | Есть | НЕТ |
| Disputes | НЕТ | Есть |
| Returns | НЕТ | Есть |
| Tickets | НЕТ | Есть |
| Reports | НЕТ | Есть |
| Stories | НЕТ | Есть |
| Transactions | НЕТ | Есть |

---

## Локализация

### Era Shop (20 языков)
English, Hindi, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Chinese, Japanese, Korean, Turkish, Indonesian, Bengali, Tamil, Telugu, Urdu, Swahili

### GoGoMarket (3 языка)
English, Russian, Uzbek

### UI Strings
- Era Shop: 435+ строк
- GoGoMarket: ~90 строк

---

## Рекомендуемый план реализации

### Фаза 1: Критические функции (1-2 недели)
1. Forgot Password flow (backend + frontend)
2. SubCategories (model + API + UI)
3. Attributes для товаров (sizes, colors)
4. Product Moderation (approve/reject)

### Фаза 2: Улучшения UX (2-3 недели)
5. Google Sign-In
6. FAQ
7. Search History
8. New Collection / Top Selling / Popular
9. Delete Account (GDPR)
10. Firebase Crashlytics

### Фаза 3: Расширение (3-4 недели)
11. Seller Request flow
12. Bank Details для продавцов
13. Email уведомления (Nodemailer)
14. Cron Job для автоматизации выплат
15. Расширение локализации (+5-10 языков)

### Фаза 4: Premium функции (4+ недель)
16. Live Streaming (Zego SDK)
17. Международные платежи (Stripe/Razorpay)
18. Just For You рекомендации
19. Полная локализация (20 языков)

---

## Выводы

**GoGoMarket - это ~70% от Era Shop по функционалу**, но с более современным стеком:
- TypeScript вместо JavaScript
- PostgreSQL вместо MongoDB
- Provider вместо GetX
- Radix UI вместо Material UI

**Уникальные преимущества GoGoMarket:**
- Роль курьера с полным flow
- QR-коды для доставки
- Споры и возвраты
- Локализация для Узбекистана (Payme/Click)

**Главное что нужно добавить:**
1. Forgot Password (критично для UX)
2. SubCategories + Attributes (критично для каталога)
3. Product Moderation (критично для качества)
4. Google Sign-In (удобство авторизации)

**Live Streaming** - это отдельный большой проект, который можно реализовать после MVP.

---

*Документ создан: 7 января 2026*
*Автор: Devin AI*
