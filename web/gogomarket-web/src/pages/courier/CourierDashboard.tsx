import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Package, Truck, DollarSign, Star, MapPin, Clock, CheckCircle, QrCode, Power, Navigation } from 'lucide-react';

interface CourierStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  completedToday: number;
  todayEarnings: number;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  rating: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  shippingAddress: string;
  shippingCity: string;
  totalAmount: number;
  courierFee: number;
  product?: {
    title: string;
    images?: string[];
  };
  buyer?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  createdAt: string;
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function CourierDashboard() {
  const [stats, setStats] = useState<CourierStats | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'available'>('my');
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('courier_online_status');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, myOrdersRes, availableRes] = await Promise.all([
        api.getCourierStats() as Promise<{ success: boolean; data: CourierStats }>,
        api.getOrders() as Promise<{ success: boolean; data: Order[] }>,
        api.getAvailableOrders() as Promise<{ success: boolean; data: Order[] }>,
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (myOrdersRes.success) setMyOrders(myOrdersRes.data || []);
      if (availableRes.success) setAvailableOrders(availableRes.data || []);
    } catch (error) {
      console.error('Failed to load courier data:', error);
    } finally {
      setIsLoading(false);
    }
  };

    const handleAcceptOrder = async (orderId: string) => {
      try {
        const response = await api.acceptOrder(orderId) as { success: boolean };
        if (response.success) {
          loadData();
        }
      } catch (error) {
        console.error('Failed to accept order:', error);
      }
    };

    const toggleOnlineStatus = () => {
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      localStorage.setItem('courier_online_status', String(newStatus));
    };

  const openNavigator = (address: string, city: string) => {
    const fullAddress = encodeURIComponent(`${address}, ${city}, Узбекистан`);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS) {
        window.open(`maps://maps.apple.com/?q=${fullAddress}`, '_blank');
      } else {
        window.open(`geo:0,0?q=${fullAddress}`, '_blank');
      }
    } else {
      window.open(`https://yandex.uz/maps/?text=${fullAddress}`, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 'bg-blue-100 text-blue-700';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Ожидает забора';
      case 'picked_up':
        return 'Забран';
      case 'in_transit':
        return 'В пути';
      case 'delivered':
        return 'Доставлен';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-orange-500 text-white p-6 pb-12">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-2xl font-bold">Панель курьера</h1>
                  <p className="text-orange-100">Добро пожаловать!</p>
                </div>
                <button
                  onClick={toggleOnlineStatus}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isOnline 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isOnline ? 'Онлайн' : 'Оффлайн'}
                  </span>
                </button>
              </div>
              {!isOnline && (
                <div className="mt-3 bg-orange-600 rounded-lg p-3 text-sm">
                  <p>Вы сейчас оффлайн. Включите статус "Онлайн", чтобы получать новые заказы.</p>
                </div>
              )}
            </div>

      <div className="px-4 -mt-8">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Сегодня</p>
                  <p className="font-bold text-lg">{formatPrice(stats?.todayEarnings || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Активные</p>
                  <p className="font-bold text-lg">{stats?.pendingDeliveries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Выполнено</p>
                  <p className="font-bold text-lg">{stats?.completedToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Рейтинг</p>
                  <p className="font-bold text-lg">{stats?.rating || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Баланс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Доступно</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats?.availableBalance || 0)}</p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Вывести
              </Button>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Всего заработано</span>
                <span className="font-medium">{formatPrice(stats?.totalEarnings || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'my' ? 'default' : 'outline'}
            className={activeTab === 'my' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            onClick={() => setActiveTab('my')}
          >
            Мои заказы ({myOrders.length})
          </Button>
          <Button
            variant={activeTab === 'available' ? 'default' : 'outline'}
            className={activeTab === 'available' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            onClick={() => setActiveTab('available')}
          >
            Доступные ({availableOrders.length})
          </Button>
        </div>

        {activeTab === 'my' ? (
          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Нет активных заказов</p>
                  <p className="text-sm text-gray-400 mt-1">Примите заказ из списка доступных</p>
                </CardContent>
              </Card>
            ) : (
              myOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.product?.title}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span className="text-gray-600 flex-1">{order.shippingAddress}, {order.shippingCity}</span>
                                            <button
                                              onClick={() => openNavigator(order.shippingAddress, order.shippingCity)}
                                              className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                              title="Открыть в навигаторе"
                                            >
                                              <Navigation className="w-4 h-4" />
                                            </button>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">{new Date(order.createdAt).toLocaleString('ru-RU')}</span>
                                          </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t">
                                          <div>
                                            <p className="text-xs text-gray-500">Ваш заработок</p>
                                            <p className="font-bold text-green-600">{formatPrice(order.courierFee)}</p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Link to={`/courier/order/${order.id}`}>
                                              <Button variant="outline" size="sm">
                                                Подробнее
                                              </Button>
                                            </Link>
                                            <Link to={`/courier/scan/${order.id}`}>
                                              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                                <QrCode className="w-4 h-4 mr-1" />
                                                QR
                                              </Button>
                                            </Link>
                                          </div>
                                        </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {availableOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Нет доступных заказов</p>
                  <p className="text-sm text-gray-400 mt-1">Новые заказы появятся здесь</p>
                </CardContent>
              </Card>
            ) : (
              availableOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.product?.title}</p>
                      </div>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Новый
                      </span>
                    </div>

                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span className="text-gray-600 flex-1">{order.shippingAddress}, {order.shippingCity}</span>
                                            <button
                                              onClick={() => openNavigator(order.shippingAddress, order.shippingCity)}
                                              className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                              title="Открыть в навигаторе"
                                            >
                                              <Navigation className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t">
                                          <div>
                                            <p className="text-xs text-gray-500">Заработок</p>
                                            <p className="font-bold text-green-600">{formatPrice(order.courierFee)}</p>
                                          </div>
                                          <Button 
                                            className="bg-orange-500 hover:bg-orange-600"
                                            onClick={() => handleAcceptOrder(order.id)}
                                          >
                                            Принять заказ
                                          </Button>
                                        </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
