import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Product } from '../../types';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/skeleton';
import { Search, Heart, Bell, ShoppingBag, Star, Zap, Grid3X3, Play } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { user } = useAuth();

  const categories = ['ALL', 'MEN', 'WOMEN', 'DRESS', 'KURTA', 'SHOES'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosRes, productsRes] = await Promise.all([
        api.getVideoFeed({ limit: 10 }) as Promise<{ success: boolean; data: Video[] }>,
        api.getProducts({ limit: 12 }) as Promise<{ success: boolean; data: Product[] }>,
      ]);
      if (videosRes.success) setVideos(videosRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === 'ALL') {
      window.location.href = '/products';
    } else {
      window.location.href = `/products?category=${category.toLowerCase()}`;
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xl">
                  {user?.firstName?.[0] || 'G'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Hi, {user?.firstName || 'Guest'}
              </h1>
              <p className="text-sm text-gray-400">How are you feeling today?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-800">
              <Search className="w-6 h-6 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800 relative">
              <Bell className="w-6 h-6 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Selling Section */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-white">Live selling</h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center">
                <Skeleton className="w-16 h-16 rounded-full bg-gray-700" />
                <Skeleton className="w-12 h-3 mt-2 bg-gray-700" />
              </div>
            ))
          ) : videos.length > 0 ? (
            videos.slice(0, 6).map((video) => (
              <Link key={video.id} to="/videos" className="flex-shrink-0 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full p-0.5 border-2 border-orange-500">
                  <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          {video.seller?.firstName?.[0] || 'S'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-white text-xs mt-1 truncate max-w-[64px]">
                  {video.seller?.firstName || 'Seller'}
                </span>
              </Link>
            ))
          ) : (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full p-0.5 border-2 border-orange-500">
                  <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">S{i + 1}</span>
                  </div>
                </div>
                <span className="text-white text-xs mt-1">Seller {i + 1}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Short Videos Section */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-white">Short</h2>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-700" />
            ))
          ) : videos.length > 0 ? (
            videos.slice(0, 5).map((video) => (
              <Link
                key={video.id}
                to="/videos"
                className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-800 overflow-hidden relative group"
              >
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                    <Play className="w-10 h-10 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate">{video.title}</p>
                </div>
              </Link>
            ))
          ) : (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-800 flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-500" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-white">New Categories</h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-500 text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-gray-700" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="relative rounded-2xl overflow-hidden bg-gray-800 group"
              >
                <div className="aspect-[3/4]">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <ShoppingBag className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Favorite button */}
                <button
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  <Heart className="w-4 h-4 text-black" />
                </button>
                
                {/* Product info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-white text-sm font-semibold truncate">{product.title}</h3>
                  <p className="text-orange-500 text-sm font-bold">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No products found</p>
          </div>
        )}
      </section>
    </div>
  );
}
