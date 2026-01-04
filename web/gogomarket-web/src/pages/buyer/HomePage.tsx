import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Product } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Search, Heart, SlidersHorizontal, ShoppingBag, Bell } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosRes, productsRes] = await Promise.all([
        api.getVideoFeed({ limit: 6 }) as Promise<{ success: boolean; data: Video[] }>,
        api.getProducts({ limit: 12 }) as Promise<{ success: boolean; data: Product[] }>,
      ]);
      if (videosRes.success) setVideos(videosRes.data || []);
      if (productsRes.success) {
        const allProducts = productsRes.data || [];
        setNewProducts(allProducts.slice(0, 4));
        setProducts(allProducts.slice(4));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Привет, {user?.firstName || 'Гость'} 👋
            </h1>
            <p className="text-sm text-gray-500">Что ищем сегодня?</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell className="w-6 h-6 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <Link to="/cart" className="p-2 rounded-full hover:bg-gray-100">
              <ShoppingBag className="w-6 h-6 text-gray-700" />
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-orange-500"
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
            <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </form>
      </div>

      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Новая коллекция</h2>
          <Link to="/products" className="text-sm text-orange-500 font-medium">Все</Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : newProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {newProducts.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group">
                <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-2">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  <button 
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault();
                      addItem(product);
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                <p className="text-orange-500 font-semibold">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Товаров пока нет
          </div>
        )}
      </section>

      {videos.length > 0 && (
        <section className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Live продажи</h2>
            <Link to="/videos" className="text-sm text-orange-500 font-medium">Все</Link>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {videos.map((video, index) => (
              <div key={video.id} className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-full p-0.5 ${index === 0 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600" />
                      )}
                    </div>
                  </div>
                </div>
                {video.isLive && (
                  <span className="block text-center text-xs text-red-500 font-medium mt-1">LIVE</span>
                )}
              </div>
            ))}
            {videos.length > 4 && (
              <Link to="/videos" className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-sm text-gray-500 font-medium">+{videos.length - 4}</span>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Для вас</h2>
          <Link to="/products" className="text-sm text-orange-500 font-medium">Все</Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="flex gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{product.category || 'Товар'}</p>
                  <p className="text-orange-500 font-semibold mt-1">{formatPrice(product.price)}</p>
                </div>
                <Button
                  size="sm"
                  className="self-center bg-orange-500 hover:bg-orange-600 rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    addItem(product);
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Товаров пока нет
          </div>
        )}
      </section>
    </div>
  );
}
