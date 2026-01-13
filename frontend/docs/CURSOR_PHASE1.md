# CURSOR: Фаза 1 - Экраны видео

## Задачи

### 1. Экран ленты (FeedScreen)
- Список видео (вертикальный скролл)
- Thumbnail, title, автор, лайки
- Pull-to-refresh
- Пагинация
- Переход к просмотру

### 2. Экран просмотра (VideoPlayerScreen)
- Видео плеер (video_player package)
- Title, description, автор
- Кнопки: лайк, комментарии, share
- Счетчики: лайки, комментарии, просмотры

### 3. Экран загрузки (UploadVideoScreen)
- Выбор видео (image_picker)
- Поля: title, description
- Прогресс загрузки
- Валидация (используй file_validator)

### 4. Комментарии (CommentsBottomSheet)
- Список комментариев
- Поле ввода
- Отправка комментария

## API методы (добавь в api_service.dart)
```dart
Future<List<Video>> getVideos({int page, int limit})
Future<Video> getVideo(String id)
Future<Video> uploadVideo(File file, String title, String description)
Future<void> likeVideo(String id)
Future<void> unlikeVideo(String id)
Future<List<Comment>> getComments(String videoId)
Future<Comment> addComment(String videoId, String text)
```

## Порядок
1. API методы
2. FeedScreen
3. VideoPlayerScreen
4. UploadVideoScreen
5. CommentsBottomSheet

Время: 4-5 часов
