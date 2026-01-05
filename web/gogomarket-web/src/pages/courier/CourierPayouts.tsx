import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Wallet, Clock, CheckCircle, XCircle, Plus, CreditCard, Building } from 'lucide-react';
import api from '../../services/api';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  metadata?: {
    method?: string;
    accountDetails?: {
      cardNumber?: string;
      bankName?: string;
    };
  };
}

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
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

export default function CourierPayouts() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [withdrawalsRes, statsRes] = await Promise.all([
        api.getWithdrawals(),
        api.getCourierStats(),
      ]);
      setWithdrawals(withdrawalsRes.data || []);
      if (statsRes.data) {
        setWallet({
          availableBalance: statsRes.data.totalEarnings || 0,
          pendingBalance: 0,
          totalEarnings: statsRes.data.totalEarnings || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Введите корректную сумму');
      return;
    }

    if (amountNum < 50000) {
      setError('Минимальная сумма вывода: 50,000 сум');
      return;
    }

    if (wallet && amountNum > wallet.availableBalance) {
      setError('Недостаточно средств на балансе');
      return;
    }

    if (method === 'card' && !cardNumber) {
      setError('Введите номер карты');
      return;
    }

    try {
      setSubmitting(true);
      await api.requestWithdrawal({
        amount: amountNum,
        method,
        accountDetails: {
          cardNumber: method === 'card' ? cardNumber : undefined,
          bankName: method === 'bank' ? bankName : undefined,
        },
      });
      setShowForm(false);
      setAmount('');
      setCardNumber('');
      setBankName('');
      loadData();
    } catch (error) {
      console.error('Failed to request withdrawal:', error);
      setError('Не удалось создать заявку на вывод');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/courier">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">Вывод средств</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          Вывести
        </Button>
      </div>

      {wallet && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <Wallet className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-lg font-bold">{formatPrice(wallet.availableBalance)}</p>
              <p className="text-xs opacity-80">Доступно к выводу</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <Clock className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-lg font-bold">{formatPrice(wallet.totalEarnings)}</p>
              <p className="text-xs opacity-80">Всего заработано</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История выводов</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Нет заявок на вывод</p>
              <p className="text-sm text-gray-400 mt-2">
                Создайте первую заявку на вывод средств
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-medium">{formatPrice(withdrawal.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {withdrawal.metadata?.method === 'card' ? 'На карту' : 'На счет'}
                        {withdrawal.metadata?.accountDetails?.cardNumber && (
                          <span> •••• {withdrawal.metadata.accountDetails.cardNumber.slice(-4)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[withdrawal.status] || 'bg-gray-100'}`}>
                      {statusLabels[withdrawal.status] || withdrawal.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(withdrawal.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Заявка на вывод</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Сумма (мин. 50,000 сум)</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100000"
                    min="50000"
                  />
                  {wallet && (
                    <p className="text-xs text-gray-400 mt-1">
                      Доступно: {formatPrice(wallet.availableBalance)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Способ вывода</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod('card')}
                      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${
                        method === 'card' ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      На карту
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('bank')}
                      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${
                        method === 'bank' ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      На счет
                    </button>
                  </div>
                </div>

                {method === 'card' && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Номер карты</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="8600 1234 5678 9012"
                      maxLength={19}
                    />
                  </div>
                )}

                {method === 'bank' && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Название банка</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Название банка"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    disabled={submitting}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    disabled={submitting}
                  >
                    {submitting ? 'Отправка...' : 'Отправить'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
