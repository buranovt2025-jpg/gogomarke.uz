#!/bin/bash

# GoGoMarket Database Backup Script
# Создает бэкап PostgreSQL базы данных и хранит последние 7 бэкапов

# Настройки
DB_NAME="gogomarket"
DB_USER="gogomarket"
BACKUP_DIR="/var/backups/gogomarket"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="gogomarket_backup_${DATE}.sql"
LOG_FILE="/var/log/gogomarket-backup.log"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Начало создания бэкапа базы данных GoGoMarket"

# Создаем директорию для бэкапов если её нет
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    log "Создана директория для бэкапов: $BACKUP_DIR"
fi

# Создаем бэкап
log "Создание бэкапа: $BACKUP_FILE"
if pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
    log "Бэкап успешно создан: $BACKUP_DIR/$BACKUP_FILE"
    
    # Сжимаем бэкап
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    log "Бэкап сжат: $BACKUP_DIR/$BACKUP_FILE.gz"
    
    # Проверяем размер файла
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
    log "Размер бэкапа: $BACKUP_SIZE"
    
else
    log "ОШИБКА: Не удалось создать бэкап базы данных"
    exit 1
fi

# Удаляем старые бэкапы (оставляем последние 7)
log "Очистка старых бэкапов (оставляем последние 7)"
cd "$BACKUP_DIR"
ls -t gogomarket_backup_*.sql.gz | tail -n +8 | xargs -r rm -f

# Показываем количество оставшихся бэкапов
BACKUP_COUNT=$(ls gogomarket_backup_*.sql.gz 2>/dev/null | wc -l)
log "Количество бэкапов: $BACKUP_COUNT"

# Показываем общий размер всех бэкапов
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Общий размер директории бэкапов: $TOTAL_SIZE"

log "Бэкап завершён успешно"