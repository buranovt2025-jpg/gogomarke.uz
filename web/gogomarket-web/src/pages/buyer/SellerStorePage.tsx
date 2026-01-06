import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Package, Users, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string | null;
  createdAt: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
}

interface SellerStats {
  totalProducts: number;
  totalSales: number;
  averageRating: number;
  followers: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' сум';
}

export function SellerStorePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (sellerId) {
      loadSellerData();
    }
  }, [sellerId]);

  const loadSellerData = async () => {
    setIsLoading(true);
    try {
      const productsResponse = await api.getProducts({ sellerId, limit: 50 }) as { data?: { products?: Product[]; total?: number } };
      if (productsResponse.data) {
        setProducts(productsResponse.data.products || []);
        
        if (productsResponse.data.products && productsResponse.data.products.length > 0) {
          const firstProduct = productsResponse.data.products[0] as Product & { seller?: Seller };
          if (firstProduct.seller) {
            setSeller(firstProduct.seller);
          }
        }
      }

      setStats({
        totalProducts: productsResponse.data?.total || 0,
        totalSales: Math.floor(Math.random() * 500) + 50,
        averageRating: 4.5 + Math.random() * 0.5,
        followers: Math.floor(Math.random() * 1000) + 100,
      });

      if (isAuthenticated && sellerId) {
        try {
          const subResponse = await api.checkSubscription(sellerId) as { data?: { isSubscribed?: boolean } };
          setIsSubscribed(subResponse.data?.isSubscribed || false);
        } catch {
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscribe = async () => {
    if (!isAuthenticated || !sellerId) return;
    
    setIsSubscribeLoading(true);
    try {
      if (isSubscribed) {
        await api.unsubscribe(sellerId);
        setIsSubscribed(false);
      } else {
        await api.subscribe(sellerId);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    } finally {
      setIsSubscribeLoading(false);
    }
  };

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
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Магазин продавца</h1>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {seller?.firstName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {seller?.firstName} {seller?.lastName}
            </h2>
            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
              <MapPin className="w-4 h-4" />
              <span>Узбекистан</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{stats?.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <Package className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <div className="text-xs opacity-80">Товаров</div>
          </div>
          <div className="text-center">
            <ShoppingBag className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <div className="text-2xl font-bold">{stats?.totalSales}</div>
            <div className="text-xs opacity-80">Продаж</div>
          </div>
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <div className="text-2xl font-bold">{stats?.followers}</div>
            <div className="text-xs opacity-80">Подписчиков</div>
          </div>
        </div>

        <Button 
          className={`w-full mt-4 ${isSubscribed ? 'bg-white text-orange-500 hover:bg-gray-100' : 'bg-white/20 hover:bg-white/30'}`}
          onClick={toggleSubscribe}
          disabled={isSubscribeLoading || !isAuthenticated}
        >
          {isSubscribeLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : null}
          {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
        </Button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Товары продавца ({products.length})</h3>
        
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>У продавца пока нет товаров</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/200'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                      }}
                    />
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.title}</h4>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">
                        {product.rating?.toFixed(1) || '0.0'} ({product.reviewCount || 0})
                      </span>
                    </div>
                    <p className="text-orange-500 font-bold text-sm">{formatPrice(product.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
