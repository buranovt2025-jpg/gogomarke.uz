# Инструкции по деплою GoGoMarket Web

## Проблема
На сервере http://64.226.94.133/ используется старая сборка фронтенда с ошибками:
- `he.getStories is not a function`
- `he.getVideoFeed is not a function`
- `he.getToken is not a function`

## Решение
Нужно загрузить новую сборку на сервер.

## Шаги для деплоя

### 1. SSH на сервер
```bash
ssh root@64.226.94.133
```

### 2. Перейти в папку проекта
```bash
cd ~/gogomarket/web/gogomarket-web
# или где находится web приложение
```

### 3. Получить последние изменения
```bash
git fetch origin
git checkout cursor/-bc-b148334d-8181-4825-adae-a5b8088ae2a6-dfb7
# или merge в main
git pull
```

### 4. Установить зависимости и собрать
```bash
npm install
npm run build
```

### 5. Скопировать сборку в web-root
```bash
# Если используется nginx
sudo cp -r dist/* /var/www/html/
# или
sudo cp -r dist/* /var/www/gogomarket/

# Если используется другой путь - укажите его
```

### 6. Перезагрузить nginx (если используется)
```bash
sudo systemctl reload nginx
```

## Альтернативный способ - SCP

Если проект не клонирован на сервере, можно загрузить файлы напрямую:

### На локальной машине:
```bash
cd /workspace/web/gogomarket-web
npm run build
scp -r dist/* root@64.226.94.133:/var/www/html/
```

## Проверка
После деплоя откройте http://64.226.94.133/ и проверьте:
1. Страница загружается без ошибок в консоли
2. Stories и видео отображаются корректно

## Файлы изменённые в этой версии
- `.github/workflows/static.yml` - добавлена сборка React приложения
- `web/gogomarket-web/src/services/api.ts` - исправлен экспорт API сервиса
- `backend/src/controllers/sellerController.ts` - добавлены отчеты продавца
- `backend/src/controllers/adminController.ts` - добавлены массовые выплаты
- `backend/src/routes/sellerRoutes.ts` - новые routes для отчетов
- `backend/src/routes/adminRoutes.ts` - новые routes для выплат

## Коммиты
- `8390d4c` - отчеты продавца и массовые выплаты админа
- `bf2685b` - исправления workflow и экспорта API
