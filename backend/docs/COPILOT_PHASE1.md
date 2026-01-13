# COPILOT: Фаза 1 - API для видео

## Задачи

### 1. Модель Video (backend/src/models/Video.ts)
```typescript
{
  id: UUID
  userId: UUID (FK users)
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: timestamp
}
```

### 2. API эндпоинты

**POST /api/videos**
- Создание видео
- Загрузка файла (используй uploadService)
- Генерация thumbnail
- Валидация (title, description)

**GET /api/videos**
- Лента видео (пагинация)
- Сортировка по дате
- Фильтр по userId (опционально)

**GET /api/videos/:id**
- Получить видео
- Увеличить viewsCount

**DELETE /api/videos/:id**
- Удалить видео (только автор)
- Удалить файлы

**POST /api/videos/:id/like**
- Лайкнуть видео
- Увеличить likesCount

**DELETE /api/videos/:id/like**
- Убрать лайк
- Уменьшить likesCount

**POST /api/videos/:id/comments**
- Добавить комментарий
- Увеличить commentsCount

**GET /api/videos/:id/comments**
- Получить комментарии
- Пагинация

## Порядок
1. Модель Video
2. POST /api/videos
3. GET /api/videos
4. GET /api/videos/:id
5. Лайки
6. Комментарии

Время: 4-5 часов
