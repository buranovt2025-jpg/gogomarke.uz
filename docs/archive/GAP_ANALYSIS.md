# GoGoMarket.uz - Gap Analysis

**Дата:** 4 января 2026  
**Версия:** 1.0

---

## Обзор текущего состояния

### Backend (Node.js/Express/TypeScript)
- **API Routes:** auth, products, videos, orders
- **Models:** User, Product, Video, Order, Transaction, Dispute, Review, Address
- **Deployed:** https://64-226-94-133.sslip.io/api/v1

### Frontend (Flutter)
- **Screens:** 20+ экранов (splash, onboarding, auth, main, home, video_feed, product_detail, cart, checkout, orders, profile, seller_dashboard, courier_dashboard, qr_scanner)
- **Services:** api_service, biometric_service, qr_service, offline_service

### Web (React + Vite + Tailwind)
- **Pages:** buyer (home, products, product_detail, cart, checkout, orders), seller (dashboard, products, product_form), admin (dashboard, users, orders, transactions)

---

## Gap Analysis по User Journeys

### 1. ONBOARDING & AUTH

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Регистрация по телефону | DONE | backend/authController, Flutter/register_screen, Web/RegisterPage | - |
| 2 | OTP верификация | PARTIAL | backend/authController (mock), Flutter/otp_screen | Подключить Eskiz.uz SMS |
| 3 | Логин по телефону/паролю | DONE | backend/authController, Flutter/login_screen, Web/LoginPage | - |
| 4 | Роли (buyer/seller/courier/admin) | DONE | backend/User model, middleware/auth | - |
| 5 | Переключение ролей | MISSING | - | Добавить UI переключателя + API endpoint |
| 6 | Регистрация продавца (документы) | MISSING | - | Форма загрузки документов, верификация |
| 7 | Регистрация курьера (документы) | MISSING | - | Форма загрузки документов, верификация |
| 8 | Верификация админом | MISSING | - | Admin UI для проверки документов |
| 9 | Локализация RU/UZ/EN | PARTIAL | Flutter/app_localizations | Web локализация отсутствует |

### 2. DISCOVERY (Video Feed + Products)

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Лента рилсов (вертикальный скролл) | PARTIAL | Flutter/video_feed_screen, Web/HomePage | Реальные видео, бесконечный скролл |
| 2 | Умный поиск с фильтрами | PARTIAL | Web/ProductsPage (категории) | Фильтры по цене, наличию, рейтингу |
| 3 | Страница продавца (магазин) | MISSING | - | Seller profile page с товарами/видео |
| 4 | Карточка товара | DONE | Flutter/product_detail_screen, Web/ProductDetailPage | - |
| 5 | Варианты товара (размер, цвет) | MISSING | - | UI выбора вариантов, backend variants |
| 6 | Сторис (24 часа) | MISSING | - | Stories model, UI, auto-delete |
| 7 | Подписка на продавцов | MISSING | - | Subscriptions model, follow/unfollow API |
| 8 | Избранное (товары/видео) | MISSING | - | Favorites model, UI |
| 9 | Комментарии под видео | MISSING | - | Comments model, UI |
| 10 | Рекомендации | MISSING | - | Recommendation engine |
| 11 | История просмотров | MISSING | - | ViewHistory model |

### 3. CART & CHECKOUT

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Корзина (добавление/удаление) | PARTIAL | Flutter/cart_screen, Web/CartPage | Синхронизация с backend |
| 2 | Изменение количества | DONE | Web/CartPage | Flutter cart |
| 3 | Промокоды/купоны | MISSING | - | Coupon model, validation API |
| 4 | Адресная книга | PARTIAL | backend/Address model, Flutter/addresses_screen | CRUD API, выбор при checkout |
| 5 | Геолокация | MISSING | - | Geolocation service |
| 6 | Способы доставки | PARTIAL | Hardcoded courier | Самовывоз, пункты выдачи |
| 7 | Оформление заказа | DONE | Flutter/checkout_screen, Web/CheckoutPage | - |

### 4. PAYMENT

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Наличные курьеру (COD) | DONE | backend/orderController | - |
| 2 | Payme интеграция | MISSING | - | Payme SDK, webhook |
| 3 | Click интеграция | MISSING | - | Click SDK, webhook |
| 4 | Escrow (безопасная сделка) | PARTIAL | backend/Transaction model | Логика удержания/разморозки |
| 5 | Face ID / биометрия | PARTIAL | Flutter/biometric_service | Интеграция в checkout |

### 5. ORDER LIFECYCLE

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Создание заказа | DONE | backend/orderController.createOrder | - |
| 2 | Подтверждение продавцом | DONE | backend/orderController.confirmOrder | - |
| 3 | Назначение курьера | DONE | backend/orderController.assignCourier | - |
| 4 | QR-код забора (seller→courier) | DONE | backend/qrService, orderController.scanPickupQr | - |
| 5 | QR-код доставки (courier→buyer) | DONE | backend/orderController.confirmDelivery | - |
| 6 | Статусы заказа | DONE | backend/types (OrderStatus enum) | - |
| 7 | Отмена заказа | DONE | backend/orderController.cancelOrder | - |
| 8 | История заказов | DONE | Flutter/orders_screen, Web/OrdersPage | - |
| 9 | Трекинг на карте | MISSING | - | Realtime location, map UI |
| 10 | Push-уведомления | MISSING | - | FCM/APNs integration |

### 6. COURIER FLOW

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Список назначенных заказов | DONE | backend/orderController.getOrders | - |
| 2 | Доступные заказы | DONE | backend/orderController.getAvailableOrdersForCourier | - |
| 3 | Принять заказ | DONE | backend/orderController.acceptOrderAsCourier | - |
| 4 | QR сканер | DONE | Flutter/qr_scanner_screen | - |
| 5 | Переход в навигатор | MISSING | - | Deep link to Yandex/2GIS/Google Maps |
| 6 | Геолокация realtime | MISSING | - | Location tracking service |
| 7 | Прием наличных (COD) | PARTIAL | backend logic | UI подтверждения суммы |
| 8 | Чат с покупателем | MISSING | - | Chat model, realtime messaging |
| 9 | Чат с продавцом | MISSING | - | Chat model, realtime messaging |
| 10 | Онлайн/оффлайн статус | MISSING | - | Status toggle, availability |
| 11 | Баланс и выплаты | MISSING | - | Courier wallet UI |
| 12 | Несколько заказов (маршрут) | MISSING | - | Multi-order routing |

### 7. SELLER FLOW

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Панель продавца | PARTIAL | Flutter/seller_dashboard_screen, Web/SellerDashboard | Полная статистика |
| 2 | Добавление товара | DONE | Web/ProductForm | Flutter форма |
| 3 | Редактирование товара | DONE | Web/ProductForm | Flutter форма |
| 4 | Удаление/скрытие товара | DONE | backend/productController | - |
| 5 | Варианты товара | MISSING | - | Variants model, UI |
| 6 | Загрузка видео/рилсов | PARTIAL | backend/videoController | Media upload service |
| 7 | Создание сторис | MISSING | - | Stories functionality |
| 8 | AI-заполнение из речи | MISSING | - | Speech-to-Text API |
| 9 | Управление заказами | PARTIAL | backend/orderController | Seller orders UI |
| 10 | Чат с покупателем | MISSING | - | Chat functionality |
| 11 | Создание купонов | MISSING | - | Coupon management |
| 12 | Аналитика продаж | MISSING | - | Analytics dashboard |
| 13 | Вывод средств | MISSING | - | Payout requests |
| 14 | Live-трансляции | MISSING | - | Live streaming |

### 8. ADMIN FLOW

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Дашборд | PARTIAL | Web/AdminDashboard | Полные метрики |
| 2 | Управление пользователями | PARTIAL | Web/AdminUsers | Верификация, блокировка |
| 3 | Управление заказами | PARTIAL | Web/AdminOrders | Переназначение, споры |
| 4 | Транзакции | PARTIAL | Web/AdminTransactions | Выплаты, корректировки |
| 5 | Модерация контента | MISSING | - | Content moderation queue |
| 6 | Управление категориями | MISSING | - | Categories CRUD |
| 7 | Споры и возвраты | MISSING | - | Dispute resolution UI |
| 8 | RBAC (роли админов) | MISSING | - | Admin roles/permissions |
| 9 | Баннеры и реклама | MISSING | - | Banner management |
| 10 | Push-рассылки | MISSING | - | Mass notifications |
| 11 | Складской модуль | MISSING | - | Warehouse management |
| 12 | Аудит-лог | MISSING | - | Action logging |

### 9. AFTER-SALES

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Отзывы с фото/видео | PARTIAL | backend/Review model | UI для отзывов |
| 2 | Рейтинг товаров | PARTIAL | backend/Product.rating | Расчет среднего |
| 3 | Возвраты | MISSING | - | Return request flow |
| 4 | Споры | PARTIAL | backend/Dispute model | Dispute UI, resolution |
| 5 | Жалобы на контент | MISSING | - | Report functionality |
| 6 | Поддержка (тикеты) | MISSING | - | Support ticket system |

### 10. TECHNICAL

| # | Требование | Статус | Где реализовано | Что доделать |
|---|------------|--------|-----------------|--------------|
| 1 | Офлайн режим | PARTIAL | Flutter/offline_service | Полная синхронизация |
| 2 | Push-уведомления | MISSING | - | FCM/APNs setup |
| 3 | Media upload (S3/Spaces) | MISSING | - | File upload service |
| 4 | Локализация Web | MISSING | - | i18n для React |
| 5 | Deep links | MISSING | - | Universal links |

---

## Сводка по статусам

| Статус | Количество | Процент |
|--------|------------|---------|
| DONE | 28 | 27% |
| PARTIAL | 24 | 23% |
| MISSING | 52 | 50% |
| **Всего** | **104** | **100%** |

---

## Приоритеты для MVP

### P0 - Критично для запуска
1. SMS верификация (Eskiz.uz)
2. Payme/Click интеграция
3. Media upload (DO Spaces)
4. Push-уведомления
5. Чат (buyer↔seller, buyer↔courier)

### P1 - Важно для UX
1. Варианты товара (размер, цвет)
2. Избранное
3. Подписки на продавцов
4. Трекинг на карте
5. Seller orders management UI

### P2 - После MVP
1. AI-заполнение карточек
2. Live-трансляции
3. Рекомендации
4. Складской модуль
5. RBAC для админов

---

*Документ создан: 4 января 2026*
