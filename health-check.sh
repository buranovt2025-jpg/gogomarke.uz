#!/bin/bash

# GoGoMarket Health Check Script
# Проверяет состояние системы и сервисов

LOG_FILE="/var/log/gogomarket-monitor.log"
BACKEND_URL="http://64.227.153.68/api/v1/health"
DISK_THRESHOLD=90

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

# Флаг для отслеживания проблем
ISSUES_FOUND=false

log "Начало проверки состояния GoGoMarket"

# 1. Проверка ответа backend на /api/v1/health
log "Проверка backend endpoint: $BACKEND_URL"
if curl -f -s -o /dev/null --max-time 10 "$BACKEND_URL"; then
    log "✓ Backend отвечает корректно"
else
    log_error "Backend не отвечает на $BACKEND_URL"
    ISSUES_FOUND=true
fi

# 2. Проверка PostgreSQL
log "Проверка PostgreSQL"
if systemctl is-active --quiet postgresql; then
    log "✓ PostgreSQL запущен"
    
    # Дополнительная проверка подключения к БД
    if sudo -u postgres psql -d gogomarket -c "SELECT 1;" > /dev/null 2>&1; then
        log "✓ Подключение к базе данных работает"
    else
        log_error "Не удается подключиться к базе данных"
        ISSUES_FOUND=true
    fi
else
    log_error "PostgreSQL не запущен"
    ISSUES_FOUND=true
fi

# 3. Проверка использования диска
log "Проверка использования диска"
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
log "Использование диска: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    log_error "Диск переполнен: ${DISK_USAGE}% (порог: ${DISK_THRESHOLD}%)"
    ISSUES_FOUND=true
else
    log "✓ Использование диска в норме: ${DISK_USAGE}%"
fi

# 4. Проверка PM2 процессов
log "Проверка PM2 процессов"
if command -v pm2 > /dev/null 2>&1; then
    PM2_STATUS=$(pm2 list | grep -c "online")
    if [ "$PM2_STATUS" -gt 0 ]; then
        log "✓ PM2 процессы работают (активных: $PM2_STATUS)"
        
        # Подробная информация о процессах
        PM2_INFO=$(pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"' 2>/dev/null || pm2 list --no-color | grep -E "(online|errored|stopped)")
        log "Статус процессов PM2: $PM2_INFO"
    else
        log_error "PM2 процессы не найдены или не работают"
        ISSUES_FOUND=true
    fi
else
    log_error "PM2 не установлен или недоступен"
    ISSUES_FOUND=true
fi

# Дополнительные проверки
# 5. Проверка памяти
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2 }')
log "Использование памяти: ${MEMORY_USAGE}%"

# 6. Проверка загрузки CPU (среднее за 1 минуту)
CPU_LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
log "Загрузка CPU (1 мин): $CPU_LOAD"

# Итоговый статус
if [ "$ISSUES_FOUND" = true ]; then
    log "❌ Обнаружены проблемы в системе! Требуется внимание."
    
    # Отправляем alert (можно расширить для отправки email/webhook)
    log "ALERT: Критические проблемы обнаружены в $(date '+%Y-%m-%d %H:%M:%S')"
    
    exit 1
else
    log "✅ Все системы работают нормально"
    exit 0
fi