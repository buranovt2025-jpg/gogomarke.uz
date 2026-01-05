import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Wallet, Clock, CheckCircle, XCircle, User, CreditCard, Building } from 'lucide-react';
import api from '../../services/api';

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  };
  metadata?: {
    method?: string;
    accountDetails?: {
      cardNumber?: string;
      bankName?: string;
    };
  };
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  processing: 'Обрабатывается',
  completed: 'Выполнено',
  failed: 'Отклонено',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const roleLabels: Record<string, string> = {
  seller: 'Продавец',
  courier: 'Курьер',
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.getTransactions({ type: 'seller_payout' });
      setWithdrawals(response.data || []);
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    try {
      setProcessing(true);
      console.log('Approving withdrawal:', withdrawal.id);
      await loadData();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (withdrawal: Withdrawal) => {
    try {
      setProcessing(true);
      console.log('Rejecting withdrawal:', withdrawal.id);
      await loadData();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (filter === 'all') return true;
    return w.status === filter;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    completed: withdrawals.filter((w) => w.status === 'completed').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    pendingAmount: withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0),
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
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
        <h1 className="text-xl font-bold">Управление выплатами</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <Clock className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-xs opacity-80">Ожидают ({formatPrice(stats.pendingAmount)})</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-lg font-bold">{stats.completed}</p>
            <p className="text-xs opacity-80">Выполнено</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className={filter === status ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            {status === 'all' ? 'Все' : statusLabels[status]}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Заявки на вывод</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Нет заявок</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedWithdrawal(withdrawal)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(withdrawal.status)}
                      <div>
                        <p className="font-medium">{formatPrice(withdrawal.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {withdrawal.metadata?.method === 'card' ? (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              На карту
                              {withdrawal.metadata?.accountDetails?.cardNumber && (
                                <span> •••• {withdrawal.metadata.accountDetails.cardNumber.slice(-4)}</span>
                              )}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              На счет
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[withdrawal.status] || 'bg-gray-100'}`}>
                      {statusLabels[withdrawal.status] || withdrawal.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <User className="w-4 h-4" />
                      <span>
                        {withdrawal.user?.firstName} {withdrawal.user?.lastName}
                        {withdrawal.user?.role && (
                          <span className="ml-1 text-xs">({roleLabels[withdrawal.user.role] || withdrawal.user.role})</span>
                        )}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(withdrawal.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Детали заявки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500">Сумма</span>
                  <span className="text-xl font-bold">{formatPrice(selectedWithdrawal.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500">Статус</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedWithdrawal.status]}`}>
                    {statusLabels[selectedWithdrawal.status]}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500">Способ</span>
                  <span>{selectedWithdrawal.metadata?.method === 'card' ? 'На карту' : 'На счет'}</span>
                </div>
                {selectedWithdrawal.metadata?.accountDetails?.cardNumber && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500">Карта</span>
                    <span>{selectedWithdrawal.metadata.accountDetails.cardNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Дата</span>
                  <span>{new Date(selectedWithdrawal.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Пользователь</span>
                </div>
                <p>
                  {selectedWithdrawal.user?.firstName} {selectedWithdrawal.user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedWithdrawal.user?.phone}</p>
                {selectedWithdrawal.user?.role && (
                  <p className="text-sm text-gray-500">
                    {roleLabels[selectedWithdrawal.user.role] || selectedWithdrawal.user.role}
                  </p>
                )}
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-500 border-red-500 hover:bg-red-50"
                    onClick={() => handleReject(selectedWithdrawal)}
                    disabled={processing}
                  >
                    Отклонить
                  </Button>
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => handleApprove(selectedWithdrawal)}
                    disabled={processing}
                  >
                    {processing ? 'Обработка...' : 'Одобрить'}
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedWithdrawal(null)}
              >
                Закрыть
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
