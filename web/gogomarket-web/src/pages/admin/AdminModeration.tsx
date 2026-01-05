import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Flag, CheckCircle, XCircle, Eye, Video, ShoppingBag, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface ModerationItem {
  id: string;
  type: 'product' | 'video' | 'review' | 'comment';
  title: string;
  description?: string;
  reportCount: number;
  reportReasons: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user?: {
    firstName?: string;
    phone: string;
  };
}

const typeLabels: Record<string, string> = {
  product: 'Товар',
  video: 'Видео',
  review: 'Отзыв',
  comment: 'Комментарий',
};

const typeIcons: Record<string, React.ReactNode> = {
  product: <ShoppingBag className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  review: <MessageSquare className="w-5 h-5" />,
  comment: <MessageSquare className="w-5 h-5" />,
};

const reasonLabels: Record<string, string> = {
  spam: 'Спам',
  inappropriate: 'Неприемлемый контент',
  fake: 'Подделка/Мошенничество',
  copyright: 'Нарушение авторских прав',
  violence: 'Насилие',
  harassment: 'Оскорбления',
  other: 'Другое',
};

export default function AdminModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    loadItems();
  }, [filter, typeFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const mockItems: ModerationItem[] = [
        {
          id: '1',
          type: 'product',
          title: 'iPhone 15 Pro Max (подозрительный)',
          description: 'Слишком низкая цена для оригинального товара',
          reportCount: 5,
          reportReasons: ['fake', 'spam'],
          status: 'pending',
          createdAt: new Date().toISOString(),
          user: { firstName: 'Продавец', phone: '+998901234567' },
        },
        {
          id: '2',
          type: 'video',
          title: 'Рекламное видео',
          description: 'Видео содержит запрещенный контент',
          reportCount: 3,
          reportReasons: ['inappropriate'],
          status: 'pending',
          createdAt: new Date().toISOString(),
          user: { firstName: 'Пользователь', phone: '+998907654321' },
        },
        {
          id: '3',
          type: 'review',
          title: 'Отзыв с оскорблениями',
          description: 'Отзыв содержит нецензурную лексику',
          reportCount: 2,
          reportReasons: ['harassment'],
          status: 'pending',
          createdAt: new Date().toISOString(),
          user: { firstName: 'Покупатель', phone: '+998909876543' },
        },
      ];
      
      let filtered = mockItems;
      if (filter) {
        filtered = filtered.filter(item => item.status === filter);
      }
      if (typeFilter) {
        filtered = filtered.filter(item => item.type === typeFilter);
      }
      
      setItems(filtered);
    } catch (error) {
      console.error('Failed to load moderation items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: 'approved' as const } : item
    ));
  };

  const handleReject = async (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: 'rejected' as const } : item
    ));
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Модерация контента</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          На проверке
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Одобрено
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('rejected')}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Отклонено
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={typeFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('')}
        >
          Все типы
        </Button>
        <Button
          variant={typeFilter === 'product' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('product')}
        >
          <ShoppingBag className="w-4 h-4 mr-1" />
          Товары
        </Button>
        <Button
          variant={typeFilter === 'video' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('video')}
        >
          <Video className="w-4 h-4 mr-1" />
          Видео
        </Button>
        <Button
          variant={typeFilter === 'review' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('review')}
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Отзывы
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Нет элементов для модерации</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'product' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'video' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {typeIcons[item.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {typeLabels[item.type]}
                      </span>
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        {item.reportCount} жалоб
                      </span>
                    </div>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {item.reportReasons.map((reason) => (
                    <span key={reason} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                      {reasonLabels[reason] || reason}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{item.user?.firstName || item.user?.phone}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>

                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Просмотр
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprove(item.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(item.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Отклонить
                    </Button>
                  </div>
                )}

                {item.status === 'approved' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Контент одобрен</span>
                  </div>
                )}

                {item.status === 'rejected' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Контент отклонен</span>
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
