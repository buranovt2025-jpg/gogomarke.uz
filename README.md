# GoGoMarket (gogomarke.uz)

Маркетплейс для Узбекистана — мобильное приложение (Flutter) + backend (Node.js/Express) + веб-панель.

## Структура проекта

```
backend/          — API сервер (Node.js, Express, TypeScript, PostgreSQL, Redis)
frontend/         — Мобильное приложение (Flutter/Dart)
web/              — Веб-панель администратора
docs/             — Документация, отчёты, архивные файлы
docker-compose.yml
```

## Быстрый запуск

```bash
# Клонировать репозиторий
git clone https://github.com/buranovt2025-jpg/gogomarke.uz.git
cd gogomarke.uz

# Запустить все сервисы
docker-compose up -d
```

Backend будет доступен на порту, указанном в `docker-compose.yml`.

## Требования

- Docker & Docker Compose
- Node.js 18+ (для локальной разработки backend)
- Flutter 3.x (для мобильного приложения)

## Окружение

Скопируйте `.env.example` в `.env` и заполните переменные (БД, Redis, JWT секрет и т.д.).
