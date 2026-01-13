# GoGoMarket - Контекст проекта

## Описание
**GoGoMarket** - социальная видео-коммерция платформа (аналог TikTok Shop для Узбекистана).

## Технологический стек

| Компонент | Технологии |
|-----------|------------|
| **Backend** | Node.js, Express, TypeScript, PostgreSQL, Socket.io |
| **Frontend Web** | React, TypeScript, Tailwind CSS |
| **Mobile** | Flutter, Dart, Provider |
| **Инфраструктура** | DigitalOcean Droplet, Spaces (S3), Nginx |
| **Сервисы** | Firebase (Push), Stripe (платежи), SMS-провайдер |

## Структура репозитория
```
gogomarke.uz/
├── backend/           # Node.js API сервер
├── frontend/          # Flutter мобильное приложение
├── web/               # React веб-приложение
├── audit_reports/     # Отчеты аудита
└── [ИНСТРУКЦИИ].md    # Файлы координации
```

## Ключевые документы

| Документ | Описание |
|----------|----------|
| [audit_report.md](audit_reports/audit_report.md) | Полный аудит проекта |
| [master_action_plan.md](audit_reports/master_action_plan.md) | Мастер-план (Фазы 0-4) |
| [mobile_app_audit.md](audit_reports/mobile_app_audit.md) | Аудит мобильного приложения |

## Роли AI-ассистентов

### GitHub Copilot (Backend)
- **Зона ответственности:** `backend/` директория
- **Задачи Фазы 0:** B0.1-B0.7 (CORS, файлы, Redis, JWT, SSL, HTTPS)
- **Инструкции:** [COPILOT_INSTRUCTIONS.md](COPILOT_INSTRUCTIONS.md)
- **Формат отчета:** `[COPILOT-REPORT]`

### Cursor (Frontend)
- **Зона ответственности:** `frontend/`, `web/` директории
- **Задачи Фазы 0:** F0.1-F0.7 (HTTPS, keystore, Firebase, API URLs)
- **Инструкции:** [CURSOR_INSTRUCTIONS.md](CURSOR_INSTRUCTIONS.md)
- **Формат отчета:** `[CURSOR-REPORT]`

## GitHub
- **Репозиторий:** https://github.com/buranovt2025-jpg/gogomarke.uz
- **Ветка:** `devin/1767373941-gogomarket-mvp`
