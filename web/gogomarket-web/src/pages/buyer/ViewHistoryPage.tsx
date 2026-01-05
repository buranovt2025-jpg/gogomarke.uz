import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Clock, Package, Video, Trash2, X } from 'lucide-react';
import api from '../../services/api';

interface HistoryItem {
  id: string;
  targetType: 'product' | 'video';
  targetId: string;
  viewedAt: string;
  target?: {
    id: string;
    title?: string;
    price?: number;
    images?: string[];
    thumbnailUrl?: string;
  };
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function ViewHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'product' | 'video'>('all');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params: { type?: 'product' | 'video' } = {};
      if (filter !== 'all') params.type = filter;
      const data = await api.getViewHistory(params);
      setHistory(data.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Вы уверены, что хотите очистить историю просмотров?')) return;
    
    try {
      setClearing(true);
      const type = filter !== 'all' ? filter : undefined;
      await api.clearViewHistory(type);
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setClearing(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await api.removeFromViewHistory(id);
      setHistory(history.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">История просмотров</h1>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={clearing}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Очистить
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Все
        </Button>
        <Button
          variant={filter === 'product' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('product')}
        >
          <Package className="w-4 h-4 mr-1" />
          Товары
        </Button>
        <Button
          variant={filter === 'video' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('video')}
        >
          <Video className="w-4 h-4 mr-1" />
          Видео
        </Button>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">История просмотров пуста</p>
            <p className="text-sm text-gray-400 mt-2">
              Здесь будут отображаться товары и видео, которые вы просматривали
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center">
                  {item.targetType === 'product' ? (
                    <Link
                      to={`/products/${item.targetId}`}
                      className="flex items-center flex-1 p-3 hover:bg-gray-50"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.target?.images?.[0] ? (
                          <img
                            src={item.target.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Товар
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">
                          {item.target?.title || 'Товар удален'}
                        </p>
                        {item.target?.price && (
                          <p className="text-sm text-orange-500 font-semibold">
                            {formatPrice(item.target.price)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.viewedAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center flex-1 p-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.target?.thumbnailUrl ? (
                          <img
                            src={item.target.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            Видео
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">
                          {item.target?.title || 'Видео удалено'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.viewedAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
