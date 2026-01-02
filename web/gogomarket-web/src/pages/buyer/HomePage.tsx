import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Product } from '../../types';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Play, ShoppingCart, Heart, Eye } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price) + ' сум';
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosRes, productsRes] = await Promise.all([
        api.getVideoFeed({ limit: 6 }) as Promise<{ success: boolean; data: { videos: Video[] } }>,
        api.getProducts({ limit: 8 }) as Promise<{ success: boolean; data: { products: Product[] } }>,
      ]);
      if (videosRes.success) setVideos(videosRes.data.videos || []);
      if (productsRes.success) setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">GoGoMarket</h1>
          <p className="text-xl mb-8 opacity-90">Покупайте через видео — быстро и удобно</p>
          <div className="flex justify-center gap-4">
            <Link to="/products">
              <Button size="lg" variant="secondary">
                Каталог товаров
              </Button>
            </Link>
            <Link to="/videos">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                Смотреть видео
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Популярные видео</h2>
            <Link to="/videos" className="text-orange-500 hover:underline">
              Все видео →
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gray-900">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title || 'Video'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                    {video.isLive && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        LIVE
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{video.title || 'Без названия'}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {video.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {video.likeCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Видео пока нет
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Популярные товары</h2>
            <Link to="/products" className="text-orange-500 hover:underline">
              Все товары →
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square bg-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Нет фото
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-semibold truncate hover:text-orange-500">{product.title}</h3>
                    </Link>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-orange-500">{formatPrice(product.price)}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full mt-3 bg-orange-500 hover:bg-orange-600"
                      size="sm"
                      onClick={() => addItem(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      В корзину
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Товаров пока нет
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Видео-шопинг</h3>
              <p className="text-gray-400">Смотрите товары в действии и покупайте прямо из видео</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Безопасная сделка</h3>
              <p className="text-gray-400">Деньги замораживаются до подтверждения получения товара</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Быстрая доставка</h3>
              <p className="text-gray-400">Курьеры доставят заказ в удобное для вас время</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
