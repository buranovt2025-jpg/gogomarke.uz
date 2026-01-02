import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Package, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
  [OrderStatus.CONFIRMED]: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800' },
  [OrderStatus.PICKED_UP]: { label: 'Забран', color: 'bg-purple-100 text-purple-800' },
  [OrderStatus.IN_TRANSIT]: { label: 'В пути', color: 'bg-indigo-100 text-indigo-800' },
  [OrderStatus.DELIVERED]: { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
  [OrderStatus.CANCELLED]: { label: 'Отменен', color: 'bg-red-100 text-red-800' },
  [OrderStatus.DISPUTED]: { label: 'Спор', color: 'bg-orange-100 text-orange-800' },
};

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.getOrders({ limit: 100 }) as { success: boolean; data: Order[] };
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as OrderStatus });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Заказы</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Поиск по номеру заказа..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value={OrderStatus.PENDING}>Ожидают</TabsTrigger>
            <TabsTrigger value={OrderStatus.CONFIRMED}>Подтверждены</TabsTrigger>
            <TabsTrigger value={OrderStatus.IN_TRANSIT}>В пути</TabsTrigger>
            <TabsTrigger value={OrderStatus.DELIVERED}>Доставлены</TabsTrigger>
            <TabsTrigger value={OrderStatus.DISPUTED}>Споры</TabsTrigger>
            <TabsTrigger value={OrderStatus.CANCELLED}>Отменены</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-4 px-6">Номер</th>
                        <th className="text-left py-4 px-6">Покупатель</th>
                        <th className="text-left py-4 px-6">Продавец</th>
                        <th className="text-left py-4 px-6">Сумма</th>
                        <th className="text-left py-4 px-6">Статус</th>
                        <th className="text-left py-4 px-6">Дата</th>
                        <th className="text-left py-4 px-6">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const status = statusConfig[order.status];
                        return (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-6 font-medium">#{order.orderNumber}</td>
                            <td className="py-4 px-6">{order.buyer?.phone || 'N/A'}</td>
                            <td className="py-4 px-6">{order.seller?.phone || 'N/A'}</td>
                            <td className="py-4 px-6 font-semibold text-orange-500">
                              {formatPrice(order.totalAmount)}
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={status.color}>{status.label}</Badge>
                            </td>
                            <td className="py-4 px-6 text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Детали
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Заказы не найдены</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Заказ #{selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Покупатель</p>
                    <p className="font-medium">{selectedOrder.buyer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Продавец</p>
                    <p className="font-medium">{selectedOrder.seller?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Курьер</p>
                    <p className="font-medium">{selectedOrder.courier?.phone || 'Не назначен'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Способ оплаты</p>
                    <p className="font-medium">
                      {selectedOrder.paymentMethod === 'cash' ? 'Наличными' : 'Картой'}
                      {selectedOrder.isPaid && ' (Оплачен)'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Адрес доставки</p>
                  <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Товары</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{item.product?.title || 'Товар'} x{item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Товары</span>
                    <span>{formatPrice(selectedOrder.totalAmount - selectedOrder.courierFee)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Доставка</span>
                    <span>{formatPrice(selectedOrder.courierFee)}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm text-gray-500">
                    <span>Комиссия платформы</span>
                    <span>{formatPrice(selectedOrder.platformCommission)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Итого</span>
                    <span className="text-orange-500">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Изменить статус</p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
