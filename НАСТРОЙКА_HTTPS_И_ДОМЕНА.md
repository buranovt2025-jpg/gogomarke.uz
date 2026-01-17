# Настройка HTTPS и Домена — GoGoMarket

**Дата создания:** 17 января 2026  
**Сервер:** 64.226.94.133 (DigitalOcean Droplet)  
**Домен:** gogomarke.uz

---

## Содержание

1. [Предварительные требования](#1-предварительные-требования)
2. [Настройка DNS](#2-настройка-dns)
3. [Установка SSL сертификата](#3-установка-ssl-сертификата)
4. [Настройка Nginx](#4-настройка-nginx)
5. [Обновление конфигурации приложения](#5-обновление-конфигурации-приложения)
6. [Проверка работоспособности](#6-проверка-работоспособности)
7. [Автоматическое обновление сертификата](#7-автоматическое-обновление-сертификата)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Предварительные требования

### На сервере должны быть установлены:

- Nginx
- Certbot (Let's Encrypt)
- Node.js (для backend)

### Проверка установки:

```bash
ssh root@64.226.94.133

# Проверить Nginx
nginx -v

# Проверить Certbot
certbot --version

# Если Certbot не установлен:
apt update
apt install certbot python3-certbot-nginx -y
```

---

## 2. Настройка DNS

### Шаг 1: Войти в панель управления доменом

Войдите в панель управления DNS у вашего регистратора домена.

### Шаг 2: Добавить A-записи

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| A | @ | 64.226.94.133 | 3600 |
| A | www | 64.226.94.133 | 3600 |
| A | api | 64.226.94.133 | 3600 |

### Шаг 3: Проверить DNS

```bash
# Проверить распространение DNS (может занять до 24 часов)
dig gogomarke.uz +short
dig api.gogomarke.uz +short
dig www.gogomarke.uz +short

# Все должны вернуть: 64.226.94.133
```

### Альтернатива: Использовать Cloudflare

1. Добавить домен в Cloudflare
2. Изменить NS-серверы у регистратора
3. Добавить A-записи в Cloudflare
4. Включить "Proxied" для защиты от DDoS

---

## 3. Установка SSL сертификата

### Автоматический способ (рекомендуется)

Используйте готовый скрипт:

```bash
# Скопировать скрипт на сервер
scp scripts/setup-https.sh root@64.226.94.133:/root/

# Запустить на сервере
ssh root@64.226.94.133 "chmod +x /root/setup-https.sh && /root/setup-https.sh gogomarke.uz"
```

### Ручной способ

```bash
ssh root@64.226.94.133

# Получить сертификат для основного домена
certbot --nginx -d gogomarke.uz -d www.gogomarke.uz

# Получить сертификат для API поддомена
certbot --nginx -d api.gogomarke.uz

# Следовать инструкциям:
# 1. Ввести email для уведомлений
# 2. Согласиться с условиями (A)
# 3. Выбрать redirect HTTP to HTTPS (рекомендуется)
```

---

## 4. Настройка Nginx

### Конфигурация для основного сайта

Создать файл `/etc/nginx/sites-available/gogomarke.uz`:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name gogomarke.uz www.gogomarke.uz;
    return 301 https://$server_name$request_uri;
}

# HTTPS для веб-приложения
server {
    listen 443 ssl http2;
    server_name gogomarke.uz www.gogomarke.uz;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/gogomarke.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gogomarke.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Корень веб-приложения
    root /var/www/gogomarket/web/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Статические файлы
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Конфигурация для API

Создать файл `/etc/nginx/sites-available/api.gogomarke.uz`:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name api.gogomarke.uz;
    return 301 https://$server_name$request_uri;
}

# HTTPS для API
server {
    listen 443 ssl http2;
    server_name api.gogomarke.uz;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/api.gogomarke.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gogomarke.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy к Node.js backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/gogomarket/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Увеличить лимит загрузки файлов
    client_max_body_size 100M;
}
```

### Активация конфигурации

```bash
# Создать символические ссылки
ln -s /etc/nginx/sites-available/gogomarke.uz /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/api.gogomarke.uz /etc/nginx/sites-enabled/

# Проверить конфигурацию
nginx -t

# Перезапустить Nginx
systemctl restart nginx
```

---

## 5. Обновление конфигурации приложения

### Backend (.env)

```bash
# На сервере: /var/www/gogomarket/backend/.env

# Обновить URL
SERVER_BASE_URL=https://api.gogomarke.uz
CORS_ORIGIN=https://gogomarke.uz,https://www.gogomarke.uz

# Перезапустить backend
pm2 restart all
```

### Web (.env)

```bash
# На сервере: /var/www/gogomarket/web/.env

VITE_API_URL=https://api.gogomarke.uz/api/v1
VITE_WS_URL=wss://api.gogomarke.uz

# Пересобрать
npm run build
```

### Mobile (api_config.dart)

```dart
// frontend/lib/config/api_config.dart

class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://api.gogomarke.uz/api/v1',
  );
  
  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'wss://api.gogomarke.uz',
  );
}
```

### Использование скрипта для обновления

```bash
# Локально
./scripts/update-domain-config.sh gogomarke.uz

# Затем закоммитить и запушить
git add .
git commit -m "chore: update domain to gogomarke.uz"
git push
```

---

## 6. Проверка работоспособности

### Проверка SSL

```bash
# Проверить сертификат
curl -vI https://gogomarke.uz 2>&1 | grep -A 5 "SSL certificate"

# Онлайн проверка
# https://www.ssllabs.com/ssltest/analyze.html?d=gogomarke.uz
```

### Проверка API

```bash
# Health check
curl https://api.gogomarke.uz/api/v1/health

# Должен вернуть:
# {"status":"ok","timestamp":"..."}
```

### Проверка WebSocket

```javascript
// В консоли браузера
const ws = new WebSocket('wss://api.gogomarke.uz');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

### Проверка редиректа HTTP -> HTTPS

```bash
curl -I http://gogomarke.uz

# Должен вернуть:
# HTTP/1.1 301 Moved Permanently
# Location: https://gogomarke.uz/
```

---

## 7. Автоматическое обновление сертификата

Let's Encrypt сертификаты действуют 90 дней. Certbot автоматически настраивает cron для обновления.

### Проверка автообновления

```bash
# Проверить таймер
systemctl status certbot.timer

# Тестовое обновление (без реального обновления)
certbot renew --dry-run
```

### Ручное обновление (если нужно)

```bash
certbot renew

# Перезапустить Nginx после обновления
systemctl restart nginx
```

---

## 8. Troubleshooting

### Проблема: Certbot не может получить сертификат

```bash
# Убедиться, что порт 80 открыт
ufw allow 80
ufw allow 443

# Проверить, что Nginx работает
systemctl status nginx

# Проверить DNS
dig gogomarke.uz
```

### Проблема: ERR_SSL_PROTOCOL_ERROR

```bash
# Проверить путь к сертификатам
ls -la /etc/letsencrypt/live/gogomarke.uz/

# Проверить права
chmod 755 /etc/letsencrypt/live/
chmod 755 /etc/letsencrypt/archive/
```

### Проблема: 502 Bad Gateway

```bash
# Проверить, что backend работает
pm2 status
pm2 logs

# Проверить, что слушает правильный порт
netstat -tlnp | grep 3000
```

### Проблема: WebSocket не подключается

```bash
# Проверить конфигурацию Nginx
nginx -t

# Проверить логи
tail -f /var/log/nginx/error.log
```

### Проблема: Mixed Content

Убедитесь, что все URL в приложении используют HTTPS:

```bash
# Найти HTTP URL в коде
grep -rn "http://" web/src/
grep -rn "http://" frontend/lib/
```

---

## Быстрые команды

```bash
# === На локальной машине ===

# Скопировать скрипты на сервер
scp scripts/*.sh root@64.226.94.133:/root/

# === На сервере ===

# Подключиться
ssh root@64.226.94.133

# Установить HTTPS
/root/setup-https.sh gogomarke.uz

# Перезапустить сервисы
systemctl restart nginx
pm2 restart all

# Проверить логи
tail -f /var/log/nginx/error.log
pm2 logs

# Статус сервисов
systemctl status nginx
pm2 status
```

---

## Полезные ссылки

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)

---

*Документ создан: 17 января 2026*
