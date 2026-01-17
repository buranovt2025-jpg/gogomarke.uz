#!/bin/bash

#===============================================================================
# GoGoMarket - Domain Configuration Update Script
# Обновление домена во всех конфигурационных файлах
#
# Использование: ./update-domain-config.sh <domain>
# Пример: ./update-domain-config.sh gogomarke.uz
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

log_info "============================================"
log_info "GoGoMarket Domain Configuration Update"
log_info "============================================"
log_info "Domain: $DOMAIN"
log_info "API Domain: $API_DOMAIN"
log_info "============================================"

# Определение корневой директории проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Если скрипт запущен из корня проекта
if [ -d "./backend" ] && [ -d "./frontend" ]; then
    PROJECT_ROOT="."
fi

log_info "Project root: $PROJECT_ROOT"

# Счетчики
FILES_UPDATED=0
FILES_SKIPPED=0

# Функция обновления файла
update_file() {
    local file=$1
    local search=$2
    local replace=$3
    local description=$4
    
    if [ -f "$file" ]; then
        if grep -q "$search" "$file" 2>/dev/null; then
            sed -i "s|$search|$replace|g" "$file"
            log_success "[$description] $file"
            ((FILES_UPDATED++))
        else
            log_warning "[$description] Паттерн не найден в $file"
            ((FILES_SKIPPED++))
        fi
    else
        log_warning "[$description] Файл не найден: $file"
        ((FILES_SKIPPED++))
    fi
}

# 1. Backend - uploadService.ts
log_info "Обновление Backend..."

UPLOAD_SERVICE="$PROJECT_ROOT/backend/src/services/uploadService.ts"
if [ -f "$UPLOAD_SERVICE" ]; then
    # Заменить hardcoded IP на переменную окружения
    sed -i "s|http://64\.226\.94\.133:3000|https://$API_DOMAIN|g" "$UPLOAD_SERVICE"
    sed -i "s|http://64\.226\.94\.133|https://$API_DOMAIN|g" "$UPLOAD_SERVICE"
    log_success "[Backend] uploadService.ts обновлен"
    ((FILES_UPDATED++))
else
    log_warning "[Backend] uploadService.ts не найден"
    ((FILES_SKIPPED++))
fi

# 2. Backend - .env.example
BACKEND_ENV_EXAMPLE="$PROJECT_ROOT/backend/.env.example"
if [ -f "$BACKEND_ENV_EXAMPLE" ]; then
    if ! grep -q "SERVER_BASE_URL" "$BACKEND_ENV_EXAMPLE"; then
        echo "" >> "$BACKEND_ENV_EXAMPLE"
        echo "# Server URL" >> "$BACKEND_ENV_EXAMPLE"
        echo "SERVER_BASE_URL=https://$API_DOMAIN" >> "$BACKEND_ENV_EXAMPLE"
        log_success "[Backend] .env.example обновлен"
        ((FILES_UPDATED++))
    fi
fi

# 3. Web - api.ts
log_info "Обновление Web..."

WEB_API="$PROJECT_ROOT/web/gogomarket-web/src/services/api.ts"
if [ -f "$WEB_API" ]; then
    sed -i "s|http://64\.226\.94\.133/api/v1|https://$API_DOMAIN/api/v1|g" "$WEB_API"
    sed -i "s|http://64\.226\.94\.133:3000|https://$API_DOMAIN|g" "$WEB_API"
    log_success "[Web] api.ts обновлен"
    ((FILES_UPDATED++))
else
    log_warning "[Web] api.ts не найден"
    ((FILES_SKIPPED++))
fi

# 4. Web - .env
WEB_ENV="$PROJECT_ROOT/web/gogomarket-web/.env"
if [ ! -f "$WEB_ENV" ]; then
    cat > "$WEB_ENV" << EOF
VITE_API_URL=https://$API_DOMAIN/api/v1
VITE_WS_URL=wss://$API_DOMAIN
EOF
    log_success "[Web] .env создан"
    ((FILES_UPDATED++))
else
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$API_DOMAIN/api/v1|g" "$WEB_ENV"
    sed -i "s|VITE_WS_URL=.*|VITE_WS_URL=wss://$API_DOMAIN|g" "$WEB_ENV"
    log_success "[Web] .env обновлен"
    ((FILES_UPDATED++))
fi

# 5. Web - .env.example
WEB_ENV_EXAMPLE="$PROJECT_ROOT/web/gogomarket-web/.env.example"
cat > "$WEB_ENV_EXAMPLE" << EOF
# API Configuration
VITE_API_URL=https://$API_DOMAIN/api/v1
VITE_WS_URL=wss://$API_DOMAIN

# Development (uncomment for local development)
# VITE_API_URL=http://localhost:3000/api/v1
# VITE_WS_URL=ws://localhost:3000
EOF
log_success "[Web] .env.example создан/обновлен"
((FILES_UPDATED++))

# 6. Frontend (Mobile) - api_config.dart
log_info "Обновление Mobile..."

MOBILE_API_CONFIG="$PROJECT_ROOT/frontend/lib/config/api_config.dart"
if [ -f "$MOBILE_API_CONFIG" ]; then
    sed -i "s|http://64\.226\.94\.133:3000/api/v1|https://$API_DOMAIN/api/v1|g" "$MOBILE_API_CONFIG"
    sed -i "s|http://64\.226\.94\.133/api/v1|https://$API_DOMAIN/api/v1|g" "$MOBILE_API_CONFIG"
    log_success "[Mobile] api_config.dart обновлен"
    ((FILES_UPDATED++))
else
    log_warning "[Mobile] api_config.dart не найден"
    ((FILES_SKIPPED++))
fi

# 7. Обновление документации
log_info "Обновление документации..."

# Список файлов документации для обновления
DOC_FILES=(
    "$PROJECT_ROOT/README.md"
    "$PROJECT_ROOT/QUICK_START_FOR_NEW_CHAT.md"
    "$PROJECT_ROOT/PROJECT_CONTEXT.md"
    "$PROJECT_ROOT/CURRENT_STATUS.md"
)

for doc_file in "${DOC_FILES[@]}"; do
    if [ -f "$doc_file" ]; then
        # Не заменяем IP в документации - это может быть важная справочная информация
        log_info "[Docs] $doc_file - проверьте вручную"
    fi
done

# Итоги
echo ""
log_info "============================================"
log_info "Результаты обновления"
log_info "============================================"
echo ""
echo -e "Обновлено файлов: ${GREEN}$FILES_UPDATED${NC}"
echo -e "Пропущено файлов: ${YELLOW}$FILES_SKIPPED${NC}"
echo ""

# Проверка оставшихся hardcoded IP
log_info "Проверка оставшихся hardcoded IP..."
echo ""

REMAINING=$(grep -rn "64\.226\.94\.133" "$PROJECT_ROOT" --include="*.ts" --include="*.dart" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)

if [ -n "$REMAINING" ]; then
    log_warning "Найдены оставшиеся hardcoded IP:"
    echo "$REMAINING"
    echo ""
else
    log_success "Hardcoded IP не найдены в исходном коде!"
fi

echo ""
log_info "============================================"
log_info "Следующие шаги"
log_info "============================================"
echo ""
echo "1. Проверьте изменения:"
echo "   git diff"
echo ""
echo "2. Закоммитьте изменения:"
echo "   git add ."
echo "   git commit -m 'chore: update domain to $DOMAIN'"
echo ""
echo "3. Запушьте изменения:"
echo "   git push"
echo ""
echo "4. На сервере:"
echo "   - Обновите backend/.env"
echo "   - Пересоберите web: npm run build"
echo "   - Перезапустите backend: pm2 restart all"
echo ""
