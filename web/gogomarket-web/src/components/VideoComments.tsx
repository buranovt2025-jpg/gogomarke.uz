import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { MessageCircle, Send, User, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface VideoCommentsProps {
  videoId: string;
}

export default function VideoComments({ videoId }: VideoCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await api.getVideoComments(videoId);
      setComments(response.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);
      await api.addVideoComment(videoId, newComment.trim());
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Комментарии ({comments.length})
        </h3>
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="p-4 border-b">
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1">
              <textarea
                className="w-full border rounded-lg p-2 text-sm resize-none"
                rows={2}
                placeholder="Напишите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!newComment.trim() || submitting}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {submitting ? 'Отправка...' : 'Отправить'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="divide-y">
        {comments.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Комментариев пока нет</p>
            {isAuthenticated ? (
              <p className="text-sm text-gray-400 mt-1">Будьте первым!</p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Войдите, чтобы оставить комментарий</p>
            )}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
                {user?.id === comment.user?.id && (
                  <button
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
