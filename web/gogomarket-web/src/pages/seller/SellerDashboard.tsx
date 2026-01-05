import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, Order, OrderStatus } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, ChevronRight, ShoppingBag, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        api.getProducts({ limit: 100 }) as Promise<{ success: boolean; data: Product[] }>,
        api.getOrders({ limit: 100 }) as Promise<{ success: boolean; data: Order[] }>,
      ]);
      if (productsRes.success) setProducts(productsRes.data || []);
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

  const pendingOrders = orders.filter((o) => 
    [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(o.status)
  ).length;

  const activeProducts = products.filter((p) => p.isActive).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-4 pt-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      Привет, {user?.firstName || 'Продавец'} 👋
                    </h1>
                    <p className="text-sm text-gray-500">Панель продавца</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/seller/analytics">
                      <Button variant="outline" className="rounded-xl">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Аналитика
                      </Button>
                    </Link>
                    <Link to="/seller/products/new">
                      <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl">
                        <Plus className="w-4 h-4 mr-1" />
                        Товар
                      </Button>
                    </Link>
                  </div>
                </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
            <p className="text-sm opacity-80">Выручка</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-sm opacity-80">Заказов</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <Package className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{activeProducts}</p>
            <p className="text-sm opacity-80">Товаров</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{pendingOrders}</p>
            <p className="text-sm opacity-80">Ожидают</p>
          </div>
        </div>
      </div>

      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Последние заказы</h2>
          <Link to="/seller/orders" className="text-sm text-orange-500 font-medium flex items-center">
            Все <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.items?.length || 0} товаров</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                    order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === OrderStatus.DELIVERED ? 'Доставлен' :
                     order.status === OrderStatus.PENDING ? 'Ожидает' :
                     order.status === OrderStatus.CONFIRMED ? 'Подтвержден' :
                     order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Заказов пока нет</p>
          </div>
        )}
      </section>

      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Мои товары</h2>
          <Link to="/seller/products" className="text-sm text-orange-500 font-medium flex items-center">
            Все <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {products.length > 0 ? (
          <div className="space-y-3">
            {products.slice(0, 5).map((product) => (
              <Link key={product.id} to={`/seller/products/${product.id}/edit`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-14 h-14 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.title}</p>
                  <p className="text-sm text-gray-500">В наличии: {product.stock}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-500">{formatPrice(product.price)}</p>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-4">Товаров пока нет</p>
            <Link to="/seller/products/new">
              <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Добавить первый товар
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
