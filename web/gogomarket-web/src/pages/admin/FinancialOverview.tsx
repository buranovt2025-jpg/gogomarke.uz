import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface FinancialData {
  totalSales: number;
  totalProfit: number;
  pendingProfit: number;
  pendingPayouts: number;
  orderCounts: {
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
  };
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function FinancialOverview() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getFinancialOverview() as { success: boolean; data: FinancialData };
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load financial data');
      }
    } catch (err) {
      console.error('Failed to load financial data:', err);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      title: 'Общие продажи', 
      value: formatPrice(data?.totalSales || 0), 
      icon: DollarSign, 
      color: 'text-green-500', 
      bg: 'bg-green-50',
      description: 'Сумма всех доставленных заказов'
    },
    { 
      title: 'Прибыль платформы', 
      value: formatPrice(data?.totalProfit || 0), 
      icon: TrendingUp, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      description: 'Завершенные комиссии (5%)'
    },
    { 
      title: 'Ожидающая прибыль', 
      value: formatPrice(data?.pendingProfit || 0), 
      icon: Clock, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50',
      description: 'Комиссии в статусе HELD'
    },
    { 
      title: 'Ожидающие выплаты', 
      value: formatPrice(data?.pendingPayouts || 0), 
      icon: Package, 
      color: 'text-purple-500', 
      bg: 'bg-purple-50',
      description: 'Суммы для продавцов и курьеров'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Финансовый обзор</h1>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 ${stat.bg} rounded-full flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Statistics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Статистика заказов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-500" />
                    <span>Всего заказов</span>
                  </div>
                  <span className="font-bold text-lg">{data?.orderCounts.total || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Доставлено</span>
                  </div>
                  <span className="font-bold text-lg text-green-600">{data?.orderCounts.delivered || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span>В обработке</span>
                  </div>
                  <span className="font-bold text-lg text-orange-600">{data?.orderCounts.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>Отменено</span>
                  </div>
                  <span className="font-bold text-lg text-red-600">{data?.orderCounts.cancelled || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Бизнес-цикл</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">1. Оплата покупателя</h4>
                  <p className="text-sm text-gray-500">
                    Покупатель оплачивает заказ. Средства удерживаются в эскроу (HELD).
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">2. Передача курьеру</h4>
                  <p className="text-sm text-gray-500">
                    Продавец подтверждает передачу товара курьеру (QR1).
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">3. Доставка и выплата</h4>
                  <p className="text-sm text-gray-500">
                    Курьер подтверждает доставку (QR2). Средства автоматически переводятся продавцу.
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50">
                  <h4 className="font-semibold mb-2 text-green-700">Комиссия платформы: 5%</h4>
                  <p className="text-sm text-green-600">
                    Комиссия переходит из HELD в COMPLETED при успешной доставке.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/admin/orders">
                <Button variant="outline" className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  Все заказы
                </Button>
              </Link>
              <Link to="/admin/transactions">
                <Button variant="outline" className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Транзакции
                </Button>
              </Link>
              <Link to="/admin/users?role=seller">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Продавцы
                </Button>
              </Link>
              <Link to="/admin/users?role=courier">
                <Button variant="outline" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Курьеры
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
