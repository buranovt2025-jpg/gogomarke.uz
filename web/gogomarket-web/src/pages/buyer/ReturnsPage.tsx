import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { RotateCcw, ChevronRight, Package } from 'lucide-react';

interface Return {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: string;
  refundAmount?: number;
  createdAt: string;
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает рассмотрения',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  shipped: 'Товар отправлен',
  received: 'Товар получен',
  refunded: 'Возврат выполнен',
  closed: 'Закрыто',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  shipped: 'bg-blue-100 text-blue-700',
  received: 'bg-purple-100 text-purple-700',
  refunded: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const reasonLabels: Record<string, string> = {
  defective: 'Бракованный товар',
  wrong_item: 'Неправильный товар',
  not_as_described: 'Не соответствует описанию',
  changed_mind: 'Передумал',
  damaged: 'Поврежден при доставке',
  other: 'Другое',
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const response = await api.getReturns() as { success: boolean; data: Return[] };
      if (response.success) {
        setReturns(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load returns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Мои возвраты</h1>
        </div>

        {returns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">У вас нет запросов на возврат</p>
              <Link to="/orders">
                <Button variant="outline">Перейти к заказам</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {returns.map((returnItem) => (
              <Card key={returnItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Заказ #{returnItem.orderId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">{reasonLabels[returnItem.reason] || returnItem.reason}</p>
                        <p className="text-xs text-gray-400">{formatDate(returnItem.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[returnItem.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[returnItem.status] || returnItem.status}
                      </span>
                      {returnItem.refundAmount && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {formatPrice(returnItem.refundAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{returnItem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
