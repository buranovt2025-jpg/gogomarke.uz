#!/bin/bash

#===============================================================================
# GoGoMarket - Deployment Script
# Деплой обновлений на сервер 64.226.94.133
#
# Использование: ./deploy.sh
#===============================================================================

set -e

# Настройки
SERVER="root@64.226.94.133"
REMOTE_PATH="/var/www/gogomarket"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "============================================"
log_info "GoGoMarket Deployment"
log_info "============================================"
echo ""

# Проверка SSH подключения
log_info "Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=10 $SERVER "echo 'OK'" > /dev/null 2>&1; then
    log_error "Не удалось подключиться к серверу!"
    echo "Убедитесь, что:"
    echo "  1. SSH ключ добавлен на сервер"
    echo "  2. Сервер доступен"
    exit 1
fi
log_success "Подключение установлено"

# 1. Обновление backend
log_info "Обновление Backend..."
ssh $SERVER << 'EOF'
cd /var/www/gogomarket/backend
git pull origin devin/1767373941-gogomarket-mvp || git pull
npm install --production
pm2 restart all
EOF
log_success "Backend обновлен"

# 2. Обновление .env на сервере
log_info "Обновление конфигурации backend..."
ssh $SERVER << 'EOF'
cd /var/www/gogomarket/backend
# Добавить/обновить SERVER_BASE_URL
if grep -q "SERVER_BASE_URL" .env 2>/dev/null; then
    sed -i 's|SERVER_BASE_URL=.*|SERVER_BASE_URL=https://api.gogomarke.uz|g' .env
else
    echo "SERVER_BASE_URL=https://api.gogomarke.uz" >> .env
fi
# Добавить/обновить CORS
if grep -q "CORS_ORIGIN" .env 2>/dev/null; then
    sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://gogomarke.uz,https://www.gogomarke.uz|g' .env
else
    echo "CORS_ORIGIN=https://gogomarke.uz,https://www.gogomarke.uz" >> .env
fi
pm2 restart all
EOF
log_success "Конфигурация обновлена"

# 3. Пересборка Web
log_info "Пересборка Web приложения..."
ssh $SERVER << 'EOF'
cd /var/www/gogomarket/web/gogomarket-web
git pull origin devin/1767373941-gogomarket-mvp || git pull

# Создать .env если нет
cat > .env << 'ENVFILE'
VITE_API_URL=https://api.gogomarke.uz/api/v1
VITE_WS_URL=wss://api.gogomarke.uz
ENVFILE

npm install
npm run build
EOF
log_success "Web приложение пересобрано"

# 4. Перезапуск Nginx
log_info "Перезапуск Nginx..."
ssh $SERVER "nginx -t && systemctl restart nginx"
log_success "Nginx перезапущен"

# 5. Проверка
log_info "Проверка работоспособности..."
echo ""

# API Health
API_RESPONSE=$(ssh $SERVER "curl -s http://localhost:3000/api/v1/health" 2>/dev/null || echo "ERROR")
if [[ "$API_RESPONSE" == *"ok"* ]]; then
    log_success "API работает"
else
    log_error "API не отвечает: $API_RESPONSE"
fi

# PM2 Status
echo ""
log_info "Статус PM2:"
ssh $SERVER "pm2 status"

echo ""
log_success "============================================"
log_success "Деплой завершен!"
log_success "============================================"
echo ""
echo "Сайт: http://64.226.94.133 (или https://gogomarke.uz после настройки DNS)"
echo "API: http://64.226.94.133:3000/api/v1"
echo ""
echo "Для настройки HTTPS:"
echo "  ssh $SERVER"
echo "  /root/setup-https.sh gogomarke.uz"
echo ""
