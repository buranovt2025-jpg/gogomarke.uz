# 🚀 GoGoMarket - Быстрый старт

## Суть проекта
**GoGoMarket** - платформа социальной видео-коммерции (TikTok Shop для Узбекистана). Backend на Node.js, мобильное приложение на Flutter, веб на React.

## Текущий статус (13 января 2026)

| Компонент | Прогресс | Блокер |
|-----------|----------|--------|
| **Backend (Copilot)** | 0/7 | - |
| **Frontend (Cursor)** | 5/7 | Ждёт Backend B0.5 |

## 🔴 Критическая проблема

**Hardcoded IP `64.226.94.133`** в файле:
```
backend/src/services/uploadService.ts
```
Это блокирует завершение Frontend!

## Что делать дальше

### Для Backend (Copilot):
1. Убрать hardcoded IP → использовать `process.env.API_URL`
2. Настроить CORS без fallback на '*'
3. Внедрить Redis для OTP

### Для Frontend (Cursor):
1. Ждать завершения B0.5
2. Готовить UI для Фазы 1 с mock данными

## Ссылки на детальные файлы

- 📋 [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) - полное описание
- 📊 [CURRENT_STATUS.md](CURRENT_STATUS.md) - детальный статус
- 📁 [FILES_INDEX.md](FILES_INDEX.md) - индекс файлов
- 🔧 [COPILOT_INSTRUCTIONS.md](COPILOT_INSTRUCTIONS.md) - задачи Backend
- 🎨 [CURSOR_INSTRUCTIONS.md](CURSOR_INSTRUCTIONS.md) - задачи Frontend

## GitHub

- **Repo:** https://github.com/buranovt2025-jpg/gogomarke.uz
- **Branch:** `devin/1767373941-gogomarket-mvp`
