# Запуск Backend GoGoMarket.uz

## Требования

- **Node.js** версии 18+ (рекомендуется LTS)
- **npm** версии 9+ (устанавливается вместе с Node.js)
- **PostgreSQL** (опционально, для работы с БД)

---

## Шаг 1: Установка Node.js

### Windows

1. Перейдите на https://nodejs.org/
2. Скачайте **LTS версию** (зеленая кнопка)
3. Запустите установщик `node-vXX.XX.X-x64.msi`
4. **ВАЖНО:** На экране "Tools for Native Modules" отметьте ✅ "Automatically install..."
5. Нажмите "Next" до конца установки
6. **Перезагрузите компьютер** или откройте новый терминал

### Проверка установки

Откройте **новый** терминал (PowerShell или CMD) и выполните:

```powershell
node --version
# Ожидается: v20.x.x или v18.x.x

npm --version  
# Ожидается: 10.x.x или 9.x.x
```

Если команды работают — переходите к Шагу 2.

---

## Шаг 2: Установка зависимостей

```powershell
# Перейти в папку backend
cd C:\Users\buran\gogomarke.uz\backend

# Установить зависимости (занимает 2-5 минут)
npm install
```

Ожидаемый результат:
```
added 507 packages in 15s
```

---

## Шаг 3: Настройка переменных окружения

```powershell
# Скопировать пример конфигурации
copy .env.example .env

# Отредактировать .env файл (опционально)
notepad .env
```

Минимальная конфигурация `.env`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=postgresql://postgres:password@localhost:5432/gogomarket
```

---

## Шаг 4: Запуск сервера

```powershell
npm run dev
```

Ожидаемый результат:
```
Server is running on port 3000
Database connection established successfully.
```

---

## Шаг 5: Проверка работы

Откройте браузер и перейдите на:
```
http://localhost:3000/api/v1/health
```

Или в терминале:
```powershell
curl http://localhost:3000/api/v1/health
```

Ожидаемый ответ:
```json
{"success":true,"message":"API is running"}
```

---

## Быстрый старт (все команды)

```powershell
# После установки Node.js:
cd C:\Users\buran\gogomarke.uz\backend
npm install
copy .env.example .env
npm run dev
```

---

## Troubleshooting

### Ошибка: "'npm' is not recognized"

**Причина:** Node.js не установлен или не в PATH

**Решение:**
1. Переустановите Node.js с https://nodejs.org/
2. Убедитесь, что выбрали "Add to PATH"
3. **Перезагрузите компьютер**
4. Откройте **новый** терминал

### Ошибка: "ENOENT: no such file or directory"

**Причина:** Неправильная папка

**Решение:**
```powershell
cd C:\Users\buran\gogomarke.uz\backend
dir  # Проверить, что видите package.json
```

### Ошибка: "Cannot connect to database"

**Причина:** PostgreSQL не запущен или неверные креденшелы

**Решение:**
1. Запустите PostgreSQL
2. Создайте базу данных:
```sql
CREATE DATABASE gogomarket;
```
3. Обновите DATABASE_URL в `.env`

### Ошибка: "Port 3000 already in use"

**Решение:**
```powershell
# Использовать другой порт:
$env:PORT=3001; npm run dev
```

---

## Полезные команды

```powershell
# Запуск в режиме разработки (с авто-перезагрузкой)
npm run dev

# Сборка TypeScript
npm run build

# Запуск продакшен версии
npm start

# Проверка типов TypeScript
npx tsc --noEmit

# Запуск линтера
npm run lint
```

---

## API Endpoints для тестирования

После запуска сервера:

| Метод | URL | Описание |
|-------|-----|----------|
| GET | /api/v1/health | Проверка статуса |
| POST | /api/v1/auth/register | Регистрация |
| POST | /api/v1/auth/login | Авторизация |
| GET | /api/v1/products | Список товаров |
| GET | /api/v1/admin/stats | Статистика (админ) |

---

## Чек-лист

- [ ] Node.js установлен (`node --version` работает)
- [ ] npm установлен (`npm --version` работает)
- [ ] Зависимости установлены (`npm install` успешно)
- [ ] Файл `.env` создан
- [ ] Сервер запускается (`npm run dev`)
- [ ] API отвечает (http://localhost:3000/api/v1/health)

---

## Контакты

- Репозиторий: https://github.com/buranovt2025-jpg/gogomarke.uz
- Сервер: 64.226.94.133
- Web: https://64-226-94-133.sslip.io/
