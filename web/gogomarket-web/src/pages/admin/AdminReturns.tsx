import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { RotateCcw, X, Check, XCircle } from 'lucide-react';

interface Return {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  description: string;
  status: string;
  refundAmount?: number;
  adminNotes?: string;
  sellerResponse?: string;
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  shipped: 'Отправлен',
  received: 'Получен',
  refunded: 'Возвращено',
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

export default function AdminReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  const loadReturns = async () => {
    try {
      const response = await api.getAdminReturns({ status: statusFilter || undefined }) as { success: boolean; data: Return[] };
      if (response.success) {
        setReturns(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load returns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openReturnModal = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setAdminNotes(returnItem.adminNotes || '');
    setRefundAmount(returnItem.refundAmount?.toString() || '');
    setShowModal(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReturn) return;
    
    setActionLoading(true);
    try {
      const response = await api.updateReturnStatus(selectedReturn.id, {
        status,
        adminNotes: adminNotes || undefined,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
      }) as { success: boolean };

      if (response.success) {
        await loadReturns();
        setShowModal(false);
        setSelectedReturn(null);
      }
    } catch (error) {
      console.error('Failed to update return:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
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
          <h1 className="text-2xl font-bold">Управление возвратами</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="approved">Одобрено</option>
            <option value="rejected">Отклонено</option>
            <option value="shipped">Отправлен</option>
            <option value="received">Получен</option>
            <option value="refunded">Возвращено</option>
            <option value="closed">Закрыто</option>
          </select>
        </div>

        {returns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Нет запросов на возврат</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Заказ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Причина</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Дата</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{returnItem.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm">{returnItem.orderId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm">{reasonLabels[returnItem.reason] || returnItem.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[returnItem.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[returnItem.status] || returnItem.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(returnItem.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReturnModal(returnItem)}
                      >
                        Управление
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && selectedReturn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Детали возврата</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">ID возврата</p>
                    <p className="font-medium">{selectedReturn.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ID заказа</p>
                    <p className="font-medium">{selectedReturn.orderId.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Причина</p>
                    <p className="font-medium">{reasonLabels[selectedReturn.reason] || selectedReturn.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Статус</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedReturn.status]}`}>
                      {statusLabels[selectedReturn.status]}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-1">Описание</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReturn.description}</p>
                </div>

                {selectedReturn.sellerResponse && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Ответ продавца</p>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg">{selectedReturn.sellerResponse}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="refundAmount">Сумма возврата (UZS)</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="adminNotes">Заметки администратора</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Добавьте заметки..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={actionLoading}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Одобрить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={actionLoading}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Отклонить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('refunded')}
                    disabled={actionLoading}
                    className="text-purple-600 border-purple-600 hover:bg-purple-50"
                  >
                    Возврат выполнен
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('closed')}
                    disabled={actionLoading}
                  >
                    Закрыть
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
