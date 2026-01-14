import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Product } from '../../types';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/skeleton';
import { Search, Heart, Bell, ShoppingBag, Zap, Grid3X3, Play, Star, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
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

// Skeleton component for product cards
const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
    </div>
  </div>
);

// Skeleton component for video cards
const VideoCardSkeleton = () => (
  <div className="flex-shrink-0 w-28 h-44 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
);

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const categories = [
    { key: 'ALL', label: t('category.all'), icon: '🛍️' },
    { key: 'MEN', label: t('category.men'), icon: '👔' },
    { key: 'WOMEN', label: t('category.women'), icon: '👗' },
    { key: 'DRESS', label: t('category.dress'), icon: '👘' },
    { key: 'KURTA', label: t('category.kurta'), icon: '🧥' },
    { key: 'SHOES', label: t('category.shoes'), icon: '👟' },
  ];

  useEffect(() => {
    loadData();
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-900 pb-20 md:pb-0">
      {/* Header with animation */}
      <div className={`px-4 pt-4 pb-2 transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30 ring-2 ring-white dark:ring-gray-800">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold">
                  {user?.firstName?.[0] || 'G'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('home.greeting')}, {user?.firstName || t('home.guest')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-500" />
                {t('home.howAreYou')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-white" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
            </button>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div 
          onClick={() => navigate('/products')}
          className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20 transition-all duration-300 group"
        >
          <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40 transition-colors">
            <Search className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-gray-400 text-sm flex-1">{t('home.searchProducts')}</span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
        </div>
      </div>

      {/* Hero Banner - New Section */}
      <section className={`px-4 mb-6 transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 p-6 shadow-xl shadow-orange-200 dark:shadow-orange-900/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-white" />
              <span className="text-white/80 text-sm font-medium">Топ недели</span>
            </div>
            <h2 className="text-white text-2xl font-bold mb-1">Скидки до 50%</h2>
            <p className="text-white/80 text-sm mb-4">На лучшие товары от продавцов</p>
            <button 
              onClick={() => navigate('/products?sale=true')}
              className="px-5 py-2 bg-white rounded-full text-orange-600 font-semibold text-sm hover:bg-orange-50 transition-colors shadow-lg"
            >
              Смотреть
            </button>
          </div>
        </div>
      </section>

      {/* Stories Section - Instagram Style */}
      <section className={`mb-6 px-4 transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Star className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.liveSellings')}</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
          <Stories />
        </div>
      </section>

      {/* Short Videos Section with enhanced design */}
      <section className={`px-4 mb-6 transform transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.shortVideos')}</h2>
          </div>
          <Link to="/videos" className="text-orange-500 text-sm font-medium flex items-center gap-1 hover:text-orange-600 transition-colors">
            Все <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <VideoCardSkeleton key={i} />)
          ) : videos.length > 0 ? (
            videos.slice(0, 5).map((video, index) => (
              <Link
                key={video.id}
                to="/videos"
                className={`flex-shrink-0 w-28 h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden relative group shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 transform`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                    <Play className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-[10px] font-bold">LIVE</span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate drop-shadow-lg">{video.title}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">{video.viewCount || 0} просмотров</p>
                </div>
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
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

      {/* Categories Section with enhanced pills */}
      <section className={`px-4 mb-6 transform transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Grid3X3 className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.categories')}</h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {categories.map((category, index) => (
            <button
              key={category.key}
              onClick={() => handleCategorySelect(category.key)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 ${
                selectedCategory === category.key
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid with enhanced cards */}
      <section className={`px-4 mb-6 transform transition-all duration-700 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.popularProducts')}</h2>
          <Link to="/products" className="text-orange-500 text-sm font-medium flex items-center gap-1 hover:text-orange-600 transition-colors">
            {t('home.seeAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product Image */}
                <div className="aspect-square relative bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Favorite button with animation */}
                  <button
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" />
                  </button>

                  {/* Sale badge */}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 rounded-lg">
                      <span className="text-white text-xs font-bold">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-3">
                  <h3 className="text-gray-900 dark:text-white text-sm font-medium line-clamp-2 mb-1.5 group-hover:text-orange-500 transition-colors">{product.title}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(Number(product.rating) || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-orange-500 font-bold">{formatPrice(product.price)}</p>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-gray-400 text-xs line-through">{formatPrice(product.originalPrice)}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">{t('home.noProducts')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
