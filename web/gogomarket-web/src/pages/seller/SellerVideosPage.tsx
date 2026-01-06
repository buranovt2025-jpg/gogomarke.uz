import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Plus, Film, Image, Video, Eye, Heart, MessageCircle, Trash2, Clock } from 'lucide-react';
import api from '../../services/api';

interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
}

interface VideoItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function SellerVideosPage() {
  const [activeTab, setActiveTab] = useState<'stories' | 'videos'>('stories');
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      // Load stories and videos
      const [storiesRes, videosRes] = await Promise.all([
        api.getStories().catch(() => ({ success: true, data: [] })),
        api.getVideos({ limit: 50 }).catch(() => ({ success: true, data: [] })),
      ]);
      
      if (storiesRes.success) {
        setStories(storiesRes.data || []);
      }
      if (videosRes.success) {
        setVideos(videosRes.data || []);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Удалить эту историю?')) return;
    try {
      await api.deleteStory(storyId);
      setStories(stories.filter(s => s.id !== storyId));
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Удалить это видео?')) return;
    try {
      await api.deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Истекла';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/seller" className="text-gray-600">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Видео и Сторис</h1>
          </div>
          <Link to="/seller/stories/new">
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl">
              <Plus className="w-4 h-4 mr-1" />
              Создать
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'stories'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            <Image className="w-5 h-5" />
            Сторис ({stories.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'videos'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            <Video className="w-5 h-5" />
            Видео ({videos.length})
          </button>
        </div>

        {/* Stories Tab */}
        {activeTab === 'stories' && (
          <div>
            {stories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных историй</h3>
                  <p className="text-gray-500 mb-6">
                    Создайте свою первую историю, чтобы привлечь покупателей
                  </p>
                  <Link to="/seller/stories/new">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Создать историю
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {stories.map((story) => (
                  <div key={story.id} className="relative group">
                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-gray-200">
                      {story.mediaType === 'image' ? (
                        <img
                          src={story.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={story.mediaUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Time remaining badge */}
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(story.expiresAt)}
                      </div>

                      {/* Stats */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <Eye className="w-4 h-4" />
                          <span>{story.viewCount}</span>
                        </div>
                        {story.caption && (
                          <p className="text-white text-xs mt-1 line-clamp-2">{story.caption}</p>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div>
            {videos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет видео</h3>
                  <p className="text-gray-500 mb-6">
                    Загрузите видео о ваших товарах для привлечения покупателей
                  </p>
                  <Link to="/seller/stories/new">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Загрузить видео
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative group">
                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-gray-200">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Stats */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-3 text-white text-sm mb-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {video.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {video.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {video.commentCount}
                          </span>
                        </div>
                        <p className="text-white text-xs line-clamp-2">{video.title}</p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="w-5 h-5 text-orange-500" />
              Советы по контенту
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>- Сторис исчезают через 24 часа - используйте для акций и новинок</p>
            <p>- Видео остаются навсегда - показывайте товары в действии</p>
            <p>- Прикрепляйте товары к контенту для увеличения продаж</p>
            <p>- Оптимальное соотношение сторон: 9:16 (вертикальное)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
