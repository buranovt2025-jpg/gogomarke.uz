#!/bin/bash

#===============================================================================
# GoGoMarket - HTTPS Setup Script
# Автоматическая настройка SSL сертификатов с Let's Encrypt
#
# Использование: ./setup-https.sh <domain>
# Пример: ./setup-https.sh gogomarke.uz
#===============================================================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логирование
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка аргументов
if [ -z "$1" ]; then
    log_error "Укажите домен!"
    echo "Использование: $0 <domain>"
    echo "Пример: $0 gogomarke.uz"
    exit 1
fi

DOMAIN=$1
API_DOMAIN="api.$DOMAIN"
WWW_DOMAIN="www.$DOMAIN"
EMAIL="${2:-admin@$DOMAIN}"

log_info "============================================"
log_info "GoGoMarket HTTPS Setup"
log_info "============================================"
log_info "Domain: $DOMAIN"
log_info "API Domain: $API_DOMAIN"
log_info "Email: $EMAIL"
log_info "============================================"

# Проверка root
if [ "$EUID" -ne 0 ]; then
    log_error "Запустите скрипт от имени root (sudo)"
    exit 1
fi

# Проверка DNS
log_info "Проверка DNS записей..."

check_dns() {
    local domain=$1
    local ip=$(dig +short $domain | head -1)
    if [ -z "$ip" ]; then
        log_error "DNS запись для $domain не найдена!"
        return 1
    fi
    log_success "DNS для $domain -> $ip"
    return 0
}

DNS_OK=true
check_dns $DOMAIN || DNS_OK=false
check_dns $API_DOMAIN || DNS_OK=false

if [ "$DNS_OK" = false ]; then
    log_error "Исправьте DNS записи перед продолжением!"
    echo ""
    echo "Необходимые A-записи:"
    echo "  $DOMAIN -> <IP сервера>"
    echo "  $API_DOMAIN -> <IP сервера>"
    exit 1
fi

# Установка зависимостей
log_info "Установка зависимостей..."

apt update -qq
apt install -y -qq nginx certbot python3-certbot-nginx

log_success "Зависимости установлены"

# Создание временной конфигурации Nginx
log_info "Создание временной конфигурации Nginx..."

# Конфигурация для основного домена
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        root /var/www/gogomarket/web/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Конфигурация для API
cat > /etc/nginx/sites-available/$API_DOMAIN << EOF
server {
    listen 80;
    server_name $API_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Активация конфигураций
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/

# Удаление default если существует
rm -f /etc/nginx/sites-enabled/default

# Проверка и перезапуск Nginx
nginx -t
systemctl restart nginx

log_success "Временная конфигурация Nginx создана"

# Получение сертификатов
log_info "Получение SSL сертификатов..."

# Сертификат для основного домена
log_info "Получение сертификата для $DOMAIN..."
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

# Сертификат для API
log_info "Получение сертификата для $API_DOMAIN..."
certbot --nginx -d $API_DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

log_success "SSL сертификаты получены"

# Создание финальной конфигурации Nginx
log_info "Создание финальной конфигурации Nginx..."

# Финальная конфигурация для основного домена
cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER WWW_DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER WWW_DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/gogomarket/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Заменить плейсхолдеры
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN
sed -i "s/WWW_DOMAIN_PLACEHOLDER/$WWW_DOMAIN/g" /etc/nginx/sites-available/$DOMAIN

# Финальная конфигурация для API
cat > /etc/nginx/sites-available/$API_DOMAIN << 'EOF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name API_DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name API_DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/API_DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/API_DOMAIN_PLACEHOLDER/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
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

    # WebSocket
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

    client_max_body_size 100M;
}
EOF

# Заменить плейсхолдеры
sed -i "s/API_DOMAIN_PLACEHOLDER/$API_DOMAIN/g" /etc/nginx/sites-available/$API_DOMAIN

# Исправить escape для $uri
sed -i 's/\$uri/$uri/g' /etc/nginx/sites-available/$DOMAIN
sed -i 's/\$uri/$uri/g' /etc/nginx/sites-available/$API_DOMAIN

# Проверка и перезапуск Nginx
log_info "Применение финальной конфигурации..."
nginx -t
systemctl restart nginx

log_success "Nginx настроен"

# Обновление backend .env
log_info "Обновление конфигурации backend..."

BACKEND_ENV="/var/www/gogomarket/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    # Обновить SERVER_BASE_URL
    if grep -q "SERVER_BASE_URL" $BACKEND_ENV; then
        sed -i "s|SERVER_BASE_URL=.*|SERVER_BASE_URL=https://$API_DOMAIN|g" $BACKEND_ENV
    else
        echo "SERVER_BASE_URL=https://$API_DOMAIN" >> $BACKEND_ENV
    fi
    
    # Обновить CORS_ORIGIN
    if grep -q "CORS_ORIGIN" $BACKEND_ENV; then
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN,https://$WWW_DOMAIN|g" $BACKEND_ENV
    else
        echo "CORS_ORIGIN=https://$DOMAIN,https://$WWW_DOMAIN" >> $BACKEND_ENV
    fi
    
    log_success "Backend .env обновлен"
else
    log_warning "Backend .env не найден: $BACKEND_ENV"
fi

# Перезапуск backend
if command -v pm2 &> /dev/null; then
    log_info "Перезапуск backend (PM2)..."
    pm2 restart all || true
    log_success "Backend перезапущен"
fi

# Настройка автообновления сертификатов
log_info "Настройка автообновления сертификатов..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Тест обновления
certbot renew --dry-run

log_success "Автообновление настроено"

# Финальная проверка
log_info "============================================"
log_info "Проверка настройки..."
log_info "============================================"

echo ""
log_info "Проверка HTTPS для $DOMAIN..."
curl -sI https://$DOMAIN | head -3

echo ""
log_info "Проверка HTTPS для $API_DOMAIN..."
curl -sI https://$API_DOMAIN | head -3

echo ""
log_info "Проверка API health..."
curl -s https://$API_DOMAIN/api/v1/health || echo "API health check не отвечает (возможно, backend не запущен)"

echo ""
log_success "============================================"
log_success "HTTPS настройка завершена!"
log_success "============================================"
echo ""
echo "Сайт: https://$DOMAIN"
echo "API: https://$API_DOMAIN"
echo ""
echo "Следующие шаги:"
echo "1. Обновите VITE_API_URL в web/.env"
echo "2. Обновите API URL в frontend/lib/config/api_config.dart"
echo "3. Пересоберите web: npm run build"
echo "4. Пересоберите mobile: flutter build apk --release"
echo ""
