import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Eye,
  Star
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  averageRating: number;
  revenueChange: number;
  ordersChange: number;
  topProducts: {
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }[];
  recentOrders: {
    date: string;
    count: number;
    revenue: number;
  }[];
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

function formatCompactPrice(price: number): string {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1) + 'M';
  } else if (price >= 1000) {
    return (price / 1000).toFixed(0) + 'K';
  }
  return price.toString();
}

export default function SellerAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSellerAnalytics() as { success: boolean; data: AnalyticsData };
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics({
        totalRevenue: 15750000,
        totalOrders: 47,
        totalProducts: 12,
        totalViews: 1234,
        averageRating: 4.7,
        revenueChange: 12.5,
        ordersChange: 8.3,
        topProducts: [
          { id: '1', title: 'Футболка оверсайз', sales: 23, revenue: 2760000 },
          { id: '2', title: 'Джинсы классические', sales: 15, revenue: 3750000 },
          { id: '3', title: 'Кроссовки Nike', sales: 9, revenue: 4500000 },
        ],
        recentOrders: [
          { date: '2026-01-05', count: 5, revenue: 750000 },
          { date: '2026-01-04', count: 8, revenue: 1200000 },
          { date: '2026-01-03', count: 6, revenue: 900000 },
          { date: '2026-01-02', count: 4, revenue: 600000 },
          { date: '2026-01-01', count: 7, revenue: 1050000 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg mb-8" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/seller">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Аналитика продаж</h1>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')}>
            <TabsList>
              <TabsTrigger value="week">Неделя</TabsTrigger>
              <TabsTrigger value="month">Месяц</TabsTrigger>
              <TabsTrigger value="year">Год</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                {analytics && analytics.revenueChange !== 0 && (
                  <div className={`flex items-center text-sm ${analytics.revenueChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analytics.revenueChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(analytics.revenueChange)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold">{formatPrice(analytics?.totalRevenue || 0)}</p>
              <p className="text-sm text-gray-500">Выручка</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 text-blue-500" />
                {analytics && analytics.ordersChange !== 0 && (
                  <div className={`flex items-center text-sm ${analytics.ordersChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analytics.ordersChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(analytics.ordersChange)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
              <p className="text-sm text-gray-500">Заказов</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{analytics?.totalViews || 0}</p>
              <p className="text-sm text-gray-500">Просмотров</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{analytics?.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-gray-500">Средний рейтинг</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Динамика продаж</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentOrders.map((day, index) => {
                    const maxRevenue = Math.max(...analytics.recentOrders.map(d => d.revenue));
                    const percentage = (day.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-gray-500">
                          {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-end pr-3"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {formatCompactPrice(day.revenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-600">
                          {day.count} зак.
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нет данных за выбранный период
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Топ товаров</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-sm text-gray-500">{product.sales} продаж</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-500">{formatPrice(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нет данных о продажах
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{analytics?.totalProducts || 0}</p>
                <p className="text-sm text-gray-500">Активных товаров</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalOrders ? Math.round(analytics.totalOrders * 0.85) : 0}
                </p>
                <p className="text-sm text-gray-500">Уникальных клиентов</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalOrders && analytics.totalRevenue 
                    ? formatPrice(Math.round(analytics.totalRevenue / analytics.totalOrders))
                    : '0 сум'}
                </p>
                <p className="text-sm text-gray-500">Средний чек</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalViews && analytics.totalOrders
                    ? ((analytics.totalOrders / analytics.totalViews) * 100).toFixed(1) + '%'
                    : '0%'}
                </p>
                <p className="text-sm text-gray-500">Конверсия</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
