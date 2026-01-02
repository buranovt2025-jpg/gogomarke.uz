import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ordersRes = await api.getOrders({ limit: 100 }) as { success: boolean; data: Order[] };
      if (ordersRes.success) setOrders(ordersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const platformCommission = orders
    .filter((o) => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.platformCommission || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length;
  const disputedOrders = orders.filter((o) => o.status === OrderStatus.DISPUTED).length;

  const stats = [
    { title: 'Общая выручка', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Комиссия платформы', value: formatPrice(platformCommission), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Всего заказов', value: orders.length.toString(), icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Ожидают обработки', value: pendingOrders.toString(), icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        {disputedOrders > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800">Требуют внимания</h3>
                  <p className="text-orange-600">{disputedOrders} заказов в споре</p>
                </div>
                <Link to="/admin/orders?status=disputed">
                  <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                    Просмотреть
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Пользователи</h3>
                    <p className="text-sm text-gray-500">Управление пользователями</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Заказы</h3>
                    <p className="text-sm text-gray-500">Все заказы платформы</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/transactions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Транзакции</h3>
                    <p className="text-sm text-gray-500">Финансовый учет</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Последние заказы</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Номер</th>
                      <th className="text-left py-3 px-4">Покупатель</th>
                      <th className="text-left py-3 px-4">Сумма</th>
                      <th className="text-left py-3 px-4">Статус</th>
                      <th className="text-left py-3 px-4">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">#{order.orderNumber}</td>
                        <td className="py-3 px-4">{order.buyer?.phone || 'N/A'}</td>
                        <td className="py-3 px-4 font-semibold text-orange-500">{formatPrice(order.totalAmount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                            order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                            order.status === OrderStatus.DISPUTED ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    ))}
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
