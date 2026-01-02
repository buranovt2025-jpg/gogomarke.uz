import React, { useState, useEffect } from 'react';
import { Transaction, Order } from '../../types';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Search, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  payment: { label: 'Оплата', color: 'bg-green-100 text-green-800', icon: <ArrowUpRight className="w-4 h-4" /> },
  payout: { label: 'Выплата', color: 'bg-blue-100 text-blue-800', icon: <ArrowDownRight className="w-4 h-4" /> },
  commission: { label: 'Комиссия', color: 'bg-purple-100 text-purple-800', icon: <TrendingUp className="w-4 h-4" /> },
  refund: { label: 'Возврат', color: 'bg-red-100 text-red-800', icon: <TrendingDown className="w-4 h-4" /> },
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transRes, ordersRes] = await Promise.all([
        api.getTransactions({ limit: 100 }) as Promise<{ success: boolean; data: Transaction[] }>,
        api.getOrders({ limit: 100 }) as Promise<{ success: boolean; data: Order[] }>,
      ]);
      if (transRes.success) setTransactions(transRes.data || []);
      if (ordersRes.success) setOrders(ordersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPayments = transactions
    .filter((t) => t.type === 'payment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = transactions
    .filter((t) => t.type === 'payout' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCommissions = transactions
    .filter((t) => t.type === 'commission' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.orderId?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = [
    { title: 'Всего поступлений', value: formatPrice(totalPayments), icon: ArrowUpRight, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Всего выплат', value: formatPrice(totalPayouts), icon: ArrowDownRight, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Комиссия платформы', value: formatPrice(totalCommissions), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Финансы</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-full flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Реестр транзакций</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Поиск по ID заказа..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="payment">Оплаты</TabsTrigger>
                <TabsTrigger value="payout">Выплаты</TabsTrigger>
                <TabsTrigger value="commission">Комиссии</TabsTrigger>
                <TabsTrigger value="refund">Возвраты</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-4 px-6">ID</th>
                      <th className="text-left py-4 px-6">Заказ</th>
                      <th className="text-left py-4 px-6">Тип</th>
                      <th className="text-left py-4 px-6">Сумма</th>
                      <th className="text-left py-4 px-6">Статус</th>
                      <th className="text-left py-4 px-6">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const type = typeConfig[transaction.type] || typeConfig.payment;
                      return (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-6 font-mono text-sm">{transaction.id.slice(0, 8)}...</td>
                          <td className="py-4 px-6">#{transaction.orderId?.slice(0, 8) || 'N/A'}</td>
                          <td className="py-4 px-6">
                            <Badge className={type.color}>
                              {type.icon}
                              <span className="ml-1">{type.label}</span>
                            </Badge>
                          </td>
                          <td className="py-4 px-6 font-semibold">
                            <span className={transaction.type === 'payment' || transaction.type === 'commission' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'payment' || transaction.type === 'commission' ? '+' : '-'}
                              {formatPrice(transaction.amount)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'}>
                              {transaction.status === 'completed' ? 'Завершен' : transaction.status === 'pending' ? 'Ожидает' : 'Ошибка'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Транзакций пока нет</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сводка по заказам</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Финансовая информация рассчитывается на основе завершенных заказов
            </p>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4">Заказ</th>
                      <th className="text-left py-3 px-4">Сумма заказа</th>
                      <th className="text-left py-3 px-4">Доставка</th>
                      <th className="text-left py-3 px-4">Комиссия</th>
                      <th className="text-left py-3 px-4">Продавцу</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => {
                      const sellerAmount = order.totalAmount - order.courierFee - order.platformCommission;
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">#{order.orderNumber}</td>
                          <td className="py-3 px-4">{formatPrice(order.totalAmount)}</td>
                          <td className="py-3 px-4">{formatPrice(order.courierFee)}</td>
                          <td className="py-3 px-4 text-purple-600">{formatPrice(order.platformCommission)}</td>
                          <td className="py-3 px-4 text-green-600">{formatPrice(sellerAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Заказов пока нет</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
