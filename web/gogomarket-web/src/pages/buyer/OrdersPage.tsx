import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Package, Clock, Truck, CheckCircle, XCircle, AlertTriangle, MessageCircle, MapPin, Flag, RotateCcw, ChevronRight, ShoppingBag } from 'lucide-react';

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

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  [OrderStatus.PENDING]: { 
    label: 'Ожидает', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100', 
    icon: <Clock className="w-4 h-4" /> 
  },
  [OrderStatus.CONFIRMED]: { 
    label: 'Подтвержден', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100', 
    icon: <Package className="w-4 h-4" /> 
  },
  [OrderStatus.PICKED_UP]: { 
    label: 'Забран', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100', 
    icon: <Package className="w-4 h-4" /> 
  },
  [OrderStatus.IN_TRANSIT]: { 
    label: 'В пути', 
    color: 'text-indigo-700', 
    bgColor: 'bg-indigo-100', 
    icon: <Truck className="w-4 h-4" /> 
  },
  [OrderStatus.DELIVERED]: { 
    label: 'Доставлен', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100', 
    icon: <CheckCircle className="w-4 h-4" /> 
  },
  [OrderStatus.CANCELLED]: { 
    label: 'Отменен', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100', 
    icon: <XCircle className="w-4 h-4" /> 
  },
  [OrderStatus.DISPUTED]: { 
    label: 'Спор', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100', 
    icon: <AlertTriangle className="w-4 h-4" /> 
  },
};

// Skeleton for order card
const OrderCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded-full w-32" />
        <div className="h-4 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="h-10 bg-gray-200 rounded-lg w-20" />
    </div>
    <div className="flex gap-3 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl" />
      ))}
    </div>
    <div className="h-10 bg-gray-200 rounded-xl" />
  </div>
);

// Empty state component
const EmptyOrders = ({ tab }: { tab: string }) => {
  const messages: Record<string, { title: string; description: string }> = {
    all: { title: 'Заказов пока нет', description: 'Ваши заказы появятся здесь' },
    active: { title: 'Нет активных заказов', description: 'Активные заказы появятся здесь' },
    completed: { title: 'Нет завершенных заказов', description: 'Завершенные заказы появятся здесь' },
    cancelled: { title: 'Нет отмененных заказов', description: 'Здесь будут отображаться отмененные заказы' },
  };

  const message = messages[tab] || messages.all;

  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Package className="w-12 h-12 text-gray-400" />
      </div>
      <p className="text-xl font-semibold text-gray-900 mb-2">{message.title}</p>
      <p className="text-gray-500 mb-6">{message.description}</p>
      <Link to="/products">
        <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl">
          <ShoppingBag className="w-5 h-5 mr-2" />
          Перейти к покупкам
        </Button>
      </Link>
    </div>
  );
};

// Order card component
const OrderCard = ({ order }: { order: Order }) => {
  const status = statusConfig[order.status];
  const canTrack = [OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status);
  const canDispute = ![OrderStatus.CANCELLED, OrderStatus.DISPUTED, OrderStatus.DELIVERED].includes(order.status);
  const canReturn = order.status === OrderStatus.DELIVERED;

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-lg text-gray-900">#{order.orderNumber}</h3>
                <Badge className={`${status.bgColor} ${status.color} border-0 font-medium`}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-500">{formatPrice(order.totalAmount)}</p>
              <p className="text-sm text-gray-500">
                {order.paymentMethod === 'cash' ? 'Наличными' : 'Картой'}
                {order.isPaid && (
                  <span className="ml-2 text-green-600">• Оплачен</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Products preview */}
        <div className="p-5 bg-gray-50">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {order.items?.slice(0, 4).map((item) => (
              <div key={item.id} className="flex-shrink-0 relative group">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                {item.quantity > 1 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                )}
              </div>
            ))}
            {order.items && order.items.length > 4 && (
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-gray-500 text-sm font-medium border border-gray-200">
                +{order.items.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Address and actions */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{order.deliveryAddress}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canTrack && (
              <Link to={`/orders/${order.id}/tracking`}>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  <MapPin className="w-4 h-4 mr-1.5" />
                  Отследить
                </Button>
              </Link>
            )}
            <Link to={`/orders/${order.id}/chat`}>
              <Button variant="outline" size="sm" className="rounded-xl border-gray-200 hover:bg-gray-50">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Чат
              </Button>
            </Link>
            {canDispute && (
              <Link to={`/orders/${order.id}/dispute`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Flag className="w-4 h-4 mr-1.5" />
                  Спор
                </Button>
              </Link>
            )}
            {canReturn && (
              <Link to={`/orders/${order.id}/return`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Возврат
                </Button>
              </Link>
            )}
            <Link to={`/orders/${order.id}`} className="ml-auto">
              <Button variant="ghost" size="sm" className="rounded-xl text-gray-600">
                Подробнее
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

  // Count orders by status
  const counts = {
    all: orders.length,
    active: orders.filter(o => [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(o.status)).length,
    completed: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
    cancelled: orders.filter(o => [OrderStatus.CANCELLED, OrderStatus.DISPUTED].includes(o.status)).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Мои заказы</h1>
          <p className="text-gray-500 mt-1">Управляйте вашими заказами</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full grid grid-cols-4 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger 
              value="all" 
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Все
              {counts.all > 0 && <span className="ml-1 text-xs opacity-80">({counts.all})</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Активные
              {counts.active > 0 && <span className="ml-1 text-xs opacity-80">({counts.active})</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Готовые
              {counts.completed > 0 && <span className="ml-1 text-xs opacity-80">({counts.completed})</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Отмена
              {counts.cancelled > 0 && <span className="ml-1 text-xs opacity-80">({counts.cancelled})</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyOrders tab={activeTab} />
        )}
      </div>
    </div>
  );
}
