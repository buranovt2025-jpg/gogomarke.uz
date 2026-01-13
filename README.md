# GoGoMarket

Social Video Marketplace - Buy and sell through video content

## Overview

GoGoMarket is a mobile-first social commerce platform where sellers upload Reels/Stories, buyers purchase directly from videos, and logistics are handled by couriers with QR-code confirmation and real-time financial tracking.

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Sequelize ORM
- JWT Authentication
- QR Code generation

### Frontend
- Flutter (iOS/Android)
- Provider state management
- Biometric authentication
- Multi-language support (EN, RU, UZ)

## Features

- **Video Commerce**: Vertical video scroll with integrated product cards
- **Multi-role System**: Admin, Seller, Buyer, Courier
- **Secure Payments**: Card (Payme/Click) and Cash on delivery with escrow
- **QR Logistics**: Seller → Courier → Buyer confirmation chain
- **Offline Mode**: QR status caching with sync
- **Biometrics**: Face ID / Touch ID for secure checkout

## Project Structure

```
gogomarket/
├── backend/           # Node.js Express API
│   ├── src/
│   │   ├── config/    # Configuration
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/    # Sequelize models
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
└── frontend/          # Flutter mobile app
    ├── lib/
    │   ├── config/    # Theme, routes, API config
    │   ├── l10n/      # Localization
    │   ├── models/
    │   ├── providers/
    │   ├── screens/
    │   ├── services/
    │   ├── utils/
    │   └── widgets/
    └── pubspec.yaml
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend

```bash
cd frontend
flutter pub get
flutter run
```

## Environment Variables

See `backend/.env.example` for required environment variables.

## API Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/products` - List products
- `GET /api/v1/videos/feed` - Video feed
- `POST /api/v1/orders` - Create order
- `GET /api/v1/health` - Health check

## Design System

- Primary: Orange (#FF6600)
- Secondary: Black (#000000)
- Background: White (#FFFFFF)

## License

MIT



---

## 🤖 Координация AI-ассистентов

Проект использует двух AI-ассистентов для параллельной разработки:

| Ассистент | Зона ответственности | Статус |
|-----------|---------------------|--------|
| **Copilot** | Backend (Node.js) | 0/7 задач |
| **Cursor** | Frontend (Flutter, React) | 5/7 задач |

### Текущий статус: Фаза 0 (Безопасность)

- 🔴 **Backend:** Ожидает выполнения критических задач
- 🟡 **Frontend:** Почти завершён, ждёт Backend

### Документация для продолжения работы

| Файл | Назначение |
|------|------------|
| [QUICK_START_FOR_NEW_CHAT.md](QUICK_START_FOR_NEW_CHAT.md) | **Начните здесь!** |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Полный контекст проекта |
| [CURRENT_STATUS.md](CURRENT_STATUS.md) | Текущий статус задач |
| [FILES_INDEX.md](FILES_INDEX.md) | Индекс всех файлов |
| [COPILOT_INSTRUCTIONS.md](COPILOT_INSTRUCTIONS.md) | Задачи для Backend |
| [CURSOR_INSTRUCTIONS.md](CURSOR_INSTRUCTIONS.md) | Задачи для Frontend |

### Критическая проблема

⚠️ **Hardcoded IP** `64.226.94.133` в `backend/src/services/uploadService.ts` блокирует Frontend!

---

*Обновлено: 13 января 2026*
