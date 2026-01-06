import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Plus, Trash2, Eye, Image, Video, Clock, User } from 'lucide-react';
import api from '../../services/api';

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone: string;
  };
  product?: {
    id: string;
    title: string;
  };
}

export default function AdminStoriesPage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const response = await api.getStories() as { success: boolean; data: Story[] };
      if (response.success) {
        setStories(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Удалить эту историю?')) return;
    
    try {
      setDeleting(storyId);
      await api.deleteStory(storyId);
      setStories(stories.filter(s => s.id !== storyId));
    } catch (error) {
      console.error('Failed to delete story:', error);
      alert('Не удалось удалить историю');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Управление историями</h1>
        </div>
        <Button 
          onClick={() => navigate('/seller/stories/create')}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать
        </Button>
      </div>

      <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800">
        Всего историй: {stories.length} | Активных: {stories.filter(s => !isExpired(s.expiresAt)).length} | Истекших: {stories.filter(s => isExpired(s.expiresAt)).length}
      </div>

      {stories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Нет историй</p>
            <Button 
              onClick={() => navigate('/seller/stories/create')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать первую историю
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stories.map((story) => (
            <Card key={story.id} className={`overflow-hidden ${isExpired(story.expiresAt) ? 'opacity-50' : ''}`}>
              <div className="relative aspect-[9/16] bg-gray-100">
                {story.mediaType === 'image' ? (
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || 'Story'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x500?text=No+Image';
                    }}
                  />
                ) : (
                  <video
                    src={story.mediaUrl}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Media type badge */}
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  {story.mediaType === 'image' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                  {story.mediaType === 'image' ? 'Фото' : 'Видео'}
                </div>

                {/* Expired badge */}
                {isExpired(story.expiresAt) && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Истекла
                  </div>
                )}

                {/* View count */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {story.viewCount}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(story.id)}
                  disabled={deleting === story.id}
                  className="absolute bottom-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <CardContent className="p-3">
                {story.caption && (
                  <p className="text-sm font-medium truncate mb-2">{story.caption}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate">
                      {story.user?.firstName || story.user?.phone || 'Неизвестный'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(story.createdAt)}</span>
                  </div>
                </div>

                {story.product && (
                  <div className="mt-2 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded truncate">
                    Товар: {story.product.title}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
