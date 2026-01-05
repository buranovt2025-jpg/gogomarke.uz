import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Package, Clock, Truck, CheckCircle, XCircle, AlertTriangle, MessageCircle, MapPin, Flag, RotateCcw } from 'lucide-react';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [OrderStatus.PENDING]: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  [OrderStatus.CONFIRMED]: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800', icon: <Package className="w-4 h-4" /> },
  [OrderStatus.PICKED_UP]: { label: 'Забран', color: 'bg-purple-100 text-purple-800', icon: <Package className="w-4 h-4" /> },
  [OrderStatus.IN_TRANSIT]: { label: 'В пути', color: 'bg-indigo-100 text-indigo-800', icon: <Truck className="w-4 h-4" /> },
  [OrderStatus.DELIVERED]: { label: 'Доставлен', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  [OrderStatus.CANCELLED]: { label: 'Отменен', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
  [OrderStatus.DISPUTED]: { label: 'Спор', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="w-4 h-4" /> },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.getOrders() as { success: boolean; data: Order[] };
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status);
    if (activeTab === 'completed') return order.status === OrderStatus.DELIVERED;
    if (activeTab === 'cancelled') return [OrderStatus.CANCELLED, OrderStatus.DISPUTED].includes(order.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="active">Активные</TabsTrigger>
            <TabsTrigger value="completed">Завершенные</TabsTrigger>
            <TabsTrigger value="cancelled">Отмененные</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status];
              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">Заказ #{order.orderNumber}</h3>
                          <Badge className={status.color}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-500">{formatPrice(order.totalAmount)}</p>
                        <p className="text-sm text-gray-500">
                          {order.paymentMethod === 'cash' ? 'Наличными' : 'Картой'}
                          {order.isPaid && ' • Оплачен'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex flex-wrap gap-4">
                        {order.items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  Фото
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.product?.title || 'Товар'}</p>
                              <p className="text-xs text-gray-500">{item.quantity} шт.</p>
                            </div>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <div className="flex items-center text-sm text-gray-500">
                            +{order.items.length - 3} товаров
                          </div>
                        )}
                      </div>
                    </div>

                                                                                <div className="border-t pt-4 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                              <div className="text-sm text-gray-600">
                                                                <p><strong>Адрес:</strong> {order.deliveryAddress}</p>
                                                              </div>
                                                              <div className="flex flex-wrap gap-2">
                                                                {[OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status) && (
                                                                  <Link to={`/orders/${order.id}/tracking`}>
                                                                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                                                      <MapPin className="w-4 h-4 mr-1" />
                                                                      Отследить
                                                                    </Button>
                                                                  </Link>
                                                                )}
                                                                <Link to={`/orders/${order.id}/chat`}>
                                                                  <Button variant="outline" size="sm">
                                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                                    Чат
                                                                  </Button>
                                                                </Link>
                                                                                                                                {![OrderStatus.CANCELLED, OrderStatus.DISPUTED, OrderStatus.DELIVERED].includes(order.status) && (
                                                                                                                                  <Link to={`/orders/${order.id}/dispute`}>
                                                                                                                                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-600 hover:bg-orange-50">
                                                                                                                                      <Flag className="w-4 h-4 mr-1" />
                                                                                                                                      Спор
                                                                                                                                    </Button>
                                                                                                                                  </Link>
                                                                                                                                )}
                                                                                                                                {order.status === OrderStatus.DELIVERED && (
                                                                                                                                  <Link to={`/orders/${order.id}/return`}>
                                                                                                                                    <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                                                                                                                                      <RotateCcw className="w-4 h-4 mr-1" />
                                                                                                                                      Возврат
                                                                                                                                    </Button>
                                                                                                                                  </Link>
                                                                                                                                )}
                                                                                                                                <Link to={`/orders/${order.id}`}>
                                                                                                                                  <Button variant="outline" size="sm">Подробнее</Button>
                                                                                                                                </Link>
                                                              </div>
                                                            </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Заказов пока нет</p>
            <Link to="/products">
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                Перейти к покупкам
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
