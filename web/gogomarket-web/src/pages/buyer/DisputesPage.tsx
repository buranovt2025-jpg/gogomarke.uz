import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  order?: {
    orderNumber: string;
    totalAmount: number;
  };
}

const statusConfig = {
  open: { label: 'Открыт', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  in_review: { label: 'На рассмотрении', color: 'bg-blue-100 text-blue-700', icon: Eye },
  resolved: { label: 'Решен', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Закрыт', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price) + ' сум';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      const response = await api.getDisputes() as { success: boolean; data: Dispute[] };
      if (response.success) {
        setDisputes(response.data);
      }
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Мои споры</h1>
        </div>

        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">У вас нет открытых споров</p>
              <p className="text-sm text-gray-400">
                Если у вас возникли проблемы с заказом, вы можете открыть спор на странице заказа
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const config = statusConfig[dispute.status];
              const StatusIcon = config.icon;
              
              return (
                <Card key={dispute.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Спор по заказу #{dispute.order?.orderNumber || dispute.orderId.slice(0, 8)}
                      </CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Причина:</p>
                        <p className="text-sm text-gray-600">{dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Описание:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{dispute.description}</p>
                      </div>
                      {dispute.resolution && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-700">Решение:</p>
                          <p className="text-sm text-green-600">{dispute.resolution}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {formatDate(dispute.createdAt)}
                        </span>
                        {dispute.order && (
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(dispute.order.totalAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
