# Технический отчет: Централизация финансовой логики

**Дата:** 17 января 2026  
**Проект:** GoGoMarket.uz

---

## 1. Главные ошибки в расчетах (до исправления)

### 1.1 Дублирование финансовой логики
Финансовые расчеты были разбросаны по нескольким контроллерам:

| Файл | Проблема |
|------|----------|
| `orderController.ts` | Расчет `totalAmount`, `platformCommission`, `sellerAmount` напрямую в контроллере |
| `adminController.ts` | Собственный расчет `totalRevenue` через `Transaction.sum()` |
| `paymentController.ts` | Отдельная логика `getFinancialOverview()` |
| `sellerController.ts` | Свой расчет `totalSales` через `Order.sum('sellerAmount')` |
| `courierController.ts` | Свой расчет `todayEarnings` через `Order.sum('courierFee')` |

**Результат:** Цифры в админке не совпадали с данными продавца/курьера.

### 1.2 КРИТИЧЕСКИЙ БАГ: Отсутствие распределения средств
**Файл:** `courierController.ts` → `deliverOrder()`

```typescript
// БЫЛО:
order.status = OrderStatus.DELIVERED;
order.deliveredAt = new Date();
await order.save();
// Средства НЕ распределялись!

// СТАЛО:
order.status = OrderStatus.DELIVERED;
order.deliveredAt = new Date();
order.paymentStatus = PaymentStatus.COMPLETED;
await order.save();
await financeService.distributeFunds(order); // Теперь средства распределяются
```

### 1.3 Отсутствие поддержки купонов
Расчет заказа в `createOrder()` не учитывал скидки по купонам и не распределял их пропорционально между продавцами.

### 1.4 Отсутствие State Machine для статусов
Переходы статусов заказа не были строго зафиксированы. Можно было перевести заказ из любого статуса в любой.

---

## 2. Созданные файлы

### 2.1 `backend/src/services/financeService.ts`
**Единый финансовый сервис** — центральный "мозг" для всех расчетов.

**Методы:**
- `calculateOrderTotals()` — расчет суммы одного заказа с купоном
- `calculateMultiSellerOrderTotals()` — расчет мульти-продавцового заказа с пропорциональным распределением скидки
- `calculateCommission()` — расчет комиссии платформы
- `calculateCourierFee()` — расчет оплаты курьера (фикс или %)
- `validateAndCalculateCouponDiscount()` — валидация и расчет скидки по купону
- `distributeFunds()` — распределение средств при доставке
- `reverseFunds()` — отмена средств при отмене заказа
- `getFinancialStats()` — статистика для админки
- `getSellerStats()` — статистика продавца
- `getCourierStats()` — статистика курьера
- `getTransactionHistory()` — история транзакций

### 2.2 `backend/src/services/orderStateMachine.ts`
**State Machine для статусов заказа.**

**Допустимые переходы:**
```
PENDING → CONFIRMED (продавец подтверждает)
PENDING → CANCELLED (отмена)
CONFIRMED → PICKED_UP (курьер забрал)
CONFIRMED → CANCELLED (отмена до pickup)
PICKED_UP → IN_TRANSIT (в пути)
PICKED_UP → DELIVERED (доставлен)
IN_TRANSIT → DELIVERED (доставлен)
```

**Методы:**
- `canTransition()` — проверка допустимости перехода
- `validateTransition()` — валидация с сообщением об ошибке
- `getValidNextStatuses()` — получение списка допустимых переходов
- `shouldDistributeFunds()` — нужно ли распределять средства
- `shouldReverseFunds()` — нужно ли отменять средства

---

## 3. Файлы, зависящие от financeService

| Файл | Изменения |
|------|-----------|
| `orderController.ts` | Использует `financeService.calculateOrderTotals()`, `distributeFunds()`, `reverseFunds()` |
| `adminController.ts` | Использует `financeService.getFinancialStats()`, `getTransactionHistory()` |
| `paymentController.ts` | Использует `financeService.getFinancialStats()` |
| `sellerController.ts` | Использует `financeService.getSellerStats()` |
| `courierController.ts` | Использует `financeService.getCourierStats()`, `distributeFunds()` |

---

## 4. Null Safety в админке

Добавлены проверки на пустоту данных в методах:
- `getUsers()` — возвращает `[]` вместо 500 ошибки
- `getOrders()` — возвращает `[]` вместо 500 ошибки
- `getTransactions()` — возвращает `[]` вместо 500 ошибки
- `getStats()` — использует `.catch(() => 0)` для счетчиков

---

## 5. Соответствие миграциям

Проект не использует файлы миграций — используется `sequelize.sync()`.

**Проверка моделей:**
| Модель | Поля для финансов | Статус |
|--------|-------------------|--------|
| `Order` | `totalAmount`, `courierFee`, `platformCommission`, `sellerAmount` | ✅ Корректно |
| `Transaction` | `type`, `amount`, `status` | ✅ Корректно |
| `User` | `availableBalance`, `pendingBalance`, `totalEarnings` | ✅ Корректно |
| `Coupon` | `discountType`, `discountValue`, `maxDiscount` | ✅ Корректно |

**Типы в `types/index.ts`:**
- `OrderStatus` — 7 статусов ✅
- `PaymentStatus` — 6 статусов ✅
- `TransactionType` — 8 типов ✅

---

## 6. Формула расчета

### Создание заказа:
```typescript
subtotal = unitPrice * quantity
discount = Math.min(couponDiscount, subtotal)
discountedSubtotal = subtotal - discount
platformCommission = discountedSubtotal * 0.10 (10%)
sellerAmount = discountedSubtotal - platformCommission
courierFee = 15000 UZS (фиксированно)
totalAmount = discountedSubtotal + courierFee
```

### Мульти-продавцовый заказ:
```typescript
// Пропорциональное распределение скидки:
proportionalDiscount = (itemSubtotal / totalSubtotal) * totalCouponDiscount
```

---

## 7. Резюме изменений

1. ✅ Создан единый `financeService.ts` — все расчеты в одном месте
2. ✅ Создан `orderStateMachine.ts` — строгий контроль переходов статусов
3. ✅ Исправлен КРИТИЧЕСКИЙ БАГ — `distributeFunds()` теперь вызывается при доставке
4. ✅ Добавлена поддержка купонов с пропорциональным распределением
5. ✅ Обновлены все контроллеры для использования `financeService`
6. ✅ Добавлен Null Safety в админ-методы
7. ✅ TypeScript компилируется без ошибок

---

## 8. Рекомендации на будущее

1. **Добавить миграции** — создать папку `migrations/` для версионирования схемы БД
2. **Добавить тесты** — unit-тесты для `financeService` и `orderStateMachine`
3. **Логирование** — добавить аудит-лог всех финансовых операций
4. **Алерты** — настроить уведомления при ошибках `distributeFunds()`
5. **Процентная доставка** — расширить `calculateCourierFee()` для поддержки % от суммы

---

*Отчет подготовлен автоматически.*
