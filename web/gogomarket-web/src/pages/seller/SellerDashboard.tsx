import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, Order, OrderStatus } from '../../types';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus } from 'lucide-react';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price) + ' сум';
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        api.getProducts({ limit: 100 }) as Promise<{ success: boolean; data: { products: Product[] } }>,
        api.getOrders({ limit: 100 }) as Promise<{ success: boolean; data: { orders: Order[] } }>,
      ]);
      if (productsRes.success) setProducts(productsRes.data.products || []);
      if (ordersRes.success) setOrders(ordersRes.data.orders || []);
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

  const stats = [
    { title: 'Выручка', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-green-500' },
    { title: 'Заказов', value: orders.length.toString(), icon: ShoppingCart, color: 'text-blue-500' },
    { title: 'Товаров', value: activeProducts.toString(), icon: Package, color: 'text-purple-500' },
    { title: 'Ожидают', value: pendingOrders.toString(), icon: TrendingUp, color: 'text-orange-500' },
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Панель продавца</h1>
          <Link to="/seller/products/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Добавить товар
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-10 h-10 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Последние заказы</CardTitle>
              <Link to="/seller/orders" className="text-orange-500 text-sm hover:underline">
                Все заказы →
              </Link>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.items?.length || 0} товаров</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-500">{formatPrice(order.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Заказов пока нет</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Мои товары</CardTitle>
              <Link to="/seller/products" className="text-orange-500 text-sm hover:underline">
                Все товары →
              </Link>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Фото
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.title}</p>
                        <p className="text-sm text-gray-500">В наличии: {product.stock}</p>
                      </div>
                      <p className="font-semibold text-orange-500">{formatPrice(product.price)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Товаров пока нет</p>
                  <Link to="/seller/products/new">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить первый товар
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
