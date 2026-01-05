import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import api from '../../services/api';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  items: OrderItem[];
  shippingAddress: string;
  shippingCity: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' сум';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: 'В обработке', color: 'bg-purple-100 text-purple-800', icon: <Package className="w-4 h-4" /> },
  shipped: { label: 'Отправлен', color: 'bg-indigo-100 text-indigo-800', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSellerOrders();
      if (response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.confirmOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Failed to confirm order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.cancelOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const tabs = [
    { id: 'all', label: 'Все', count: orders.length },
    { id: 'pending', label: 'Новые', count: orders.filter(o => o.status === 'pending').length },
    { id: 'confirmed', label: 'Подтвержденные', count: orders.filter(o => o.status === 'confirmed').length },
    { id: 'shipped', label: 'Отправленные', count: orders.filter(o => o.status === 'shipped').length },
    { id: 'delivered', label: 'Доставленные', count: orders.filter(o => o.status === 'delivered').length },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link to="/seller">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Заказы</h1>
        </div>
        
        <div className="flex overflow-x-auto px-4 pb-2 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Нет заказов</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending;
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-500">#{order.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>

                  <div className="flex gap-3 mb-3">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.product?.images?.[0] || 'https://via.placeholder.com/64'}
                          alt={item.product?.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                          }}
                        />
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <p className="font-medium">{order.buyer?.firstName} {order.buyer?.lastName}</p>
                    <p>{order.shippingCity}, {order.shippingAddress}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-bold text-orange-500">{formatPrice(order.totalAmount)}</span>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500 hover:bg-red-50"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Отклонить'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Подтвердить'
                            )}
                          </Button>
                        </>
                      )}
                      <Link to={`/orders/${order.id}/chat`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Детали
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
