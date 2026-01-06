import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Product } from '../../types';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/skeleton';
import { Search, Heart, Bell, ShoppingBag, Zap, Grid3X3, Play, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Stories from '../../components/Stories';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

function formatRating(rating?: number | string): string {
  const numRating = Number(rating) || 4.5;
  return numRating.toFixed(1);
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

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 md:pb-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-500 dark:text-gray-400 text-xl font-semibold">
                  {user?.firstName?.[0] || 'G'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Hi, {user?.firstName || 'Guest'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">How are you feeling today?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="w-6 h-6 text-gray-700 dark:text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Search Bar - Figma Style */}
        <div 
          onClick={() => navigate('/search')}
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-orange-300 transition-colors"
        >
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400 text-sm">Search products...</span>
        </div>
      </div>

      {/* Stories Section - Instagram Style */}
      <section className="mb-6 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Selling</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-2">
          <Stories />
        </div>
      </section>

      {/* Short Videos Section */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Short Videos</h2>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            ))
          ) : videos.length > 0 ? (
            videos.slice(0, 5).map((video) => (
              <Link
                key={video.id}
                to="/videos"
                className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden relative group shadow-sm"
              >
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                    <Play className="w-10 h-10 text-gray-400 dark:text-gray-500" />
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
              <div key={i} className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <Play className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories</h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-orange-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid - Figma Style */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Popular Products</h2>
          <Link to="/products" className="text-orange-500 text-sm font-medium">See All</Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="aspect-square bg-gray-200 dark:bg-gray-700" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 mb-2" />
                  <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Product Image */}
                <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Favorite button */}
                  <button
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* Product Info - Below Image (Figma Style) */}
                <div className="p-3">
                  <h3 className="text-gray-900 dark:text-white text-sm font-medium line-clamp-2 mb-1">{product.title}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatRating(product.rating)} ({product.reviewCount || 0})</span>
                  </div>
                  <p className="text-orange-500 font-bold">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        )}
      </section>
    </div>
  );
}
