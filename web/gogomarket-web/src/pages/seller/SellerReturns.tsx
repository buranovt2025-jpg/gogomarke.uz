import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Return {
  id: string;
  orderId: string;
  buyerId: string;
  reason: string;
  description: string;
  status: string;
  refundAmount?: number;
  sellerResponse?: string;
  createdAt: string;
  buyer?: {
    firstName?: string;
    phone: string;
  };
}

const reasonLabels: Record<string, string> = {
  defective: 'Брак',
  wrong_item: 'Неправильный товар',
  not_as_described: 'Не соответствует описанию',
  changed_mind: 'Передумал',
  damaged: 'Повреждён',
  other: 'Другое',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрен',
  rejected: 'Отклонён',
  shipped: 'Отправлен',
  received: 'Получен',
  refunded: 'Возвращён',
  closed: 'Закрыт',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  shipped: 'bg-blue-100 text-blue-800',
  received: 'bg-purple-100 text-purple-800',
  refunded: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export default function SellerReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.getReturns(params);
      setReturns(data.returns || []);
    } catch (error) {
      console.error('Failed to load returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId: string) => {
    try {
      setSubmitting(true);
      await api.updateReturnStatus(returnId, { 
        status: 'approved',
        sellerResponse: response || 'Возврат одобрен'
      });
      setSelectedReturn(null);
      setResponse('');
      loadReturns();
    } catch (error) {
      console.error('Failed to approve return:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (returnId: string) => {
    try {
      setSubmitting(true);
      await api.updateReturnStatus(returnId, { 
        status: 'rejected',
        sellerResponse: response || 'Возврат отклонён'
      });
      setSelectedReturn(null);
      setResponse('');
      loadReturns();
    } catch (error) {
      console.error('Failed to reject return:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'refunded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
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
        <Link to="/seller">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Запросы на возврат</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          Все
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Ожидают
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('approved')}
        >
          Одобрены
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('rejected')}
        >
          Отклонены
        </Button>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Нет запросов на возврат</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Card key={ret.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">Заказ #{ret.orderId.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {ret.buyer?.firstName || ret.buyer?.phone || 'Покупатель'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ret.status)}
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[ret.status] || 'bg-gray-100'}`}>
                      {statusLabels[ret.status] || ret.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-sm">
                    <span className="text-gray-500">Причина:</span>{' '}
                    {reasonLabels[ret.reason] || ret.reason}
                  </p>
                  <p className="text-sm text-gray-600">{ret.description}</p>
                  {ret.refundAmount && (
                    <p className="text-sm">
                      <span className="text-gray-500">Сумма возврата:</span>{' '}
                      {ret.refundAmount.toLocaleString()} UZS
                    </p>
                  )}
                  {ret.sellerResponse && (
                    <p className="text-sm">
                      <span className="text-gray-500">Ваш ответ:</span>{' '}
                      {ret.sellerResponse}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  {new Date(ret.createdAt).toLocaleDateString('ru-RU')}
                </p>

                {ret.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedReturn(ret)}
                  >
                    Рассмотреть
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Рассмотрение возврата</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Заказ</p>
                <p className="font-medium">#{selectedReturn.orderId.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Причина</p>
                <p>{reasonLabels[selectedReturn.reason] || selectedReturn.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Описание</p>
                <p className="text-sm">{selectedReturn.description}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Ваш ответ</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={3}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Комментарий к решению..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedReturn(null);
                    setResponse('');
                  }}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selectedReturn.id)}
                  disabled={submitting}
                >
                  Отклонить
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => handleApprove(selectedReturn.id)}
                  disabled={submitting}
                >
                  Одобрить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
