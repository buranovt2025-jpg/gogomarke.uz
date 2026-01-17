# GoGoMarket API Tests

## Структура тестов

```
src/tests/
├── __tests__/
│   └── example.test.ts    # Пример тестов
└── README.md              # Этот файл
```

## Запуск тестов

```bash
# Все тесты
npm test

# С coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Типы тестов

### Unit тесты
- Тестирование отдельных функций
- Валидация входных данных
- Расчеты (комиссии, итоги)

### Integration тесты
- Полный flow заказа
- Аутентификация
- CRUD операции

## Примеры тестов

### Auth
```typescript
it('should validate phone format', () => {
  const phone = '+998911111111';
  const isValid = /^\+998\d{9}$/.test(phone);
  expect(isValid).toBe(true);
});
```

### Cart
```typescript
it('should validate quantity is positive', () => {
  const quantity = 1;
  expect(quantity > 0).toBe(true);
});
```

### Orders
```typescript
it('should calculate platform commission (10%)', () => {
  const sellerAmount = 12000000;
  const commission = sellerAmount * 0.10;
  expect(commission).toBe(1200000);
});
```

## Конфигурация

Для запуска тестов требуется Jest:

```bash
npm install --save-dev jest @types/jest ts-jest
```

jest.config.js:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

## Тестовые данные

### Тестовые аккаунты
| Роль | Телефон | Пароль |
|------|---------|--------|
| Покупатель | +998911111111 | Test123! |
| Продавец | +998922222222 | Test123! |
| Курьер | +998933333333 | Test123! |
| Админ | +998944444444 | Test123! |

## CI/CD

Тесты автоматически запускаются при:
- Push в main/develop ветки
- Pull Request

## Добавление новых тестов

1. Создайте файл `*.test.ts` в `__tests__/`
2. Используйте describe/it структуру
3. Запустите `npm test` для проверки
