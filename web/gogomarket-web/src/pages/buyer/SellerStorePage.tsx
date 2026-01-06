import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bell, MoreHorizontal, Grid3X3, Play, UserSquare2, MessageCircle, Phone, ChevronDown, UserPlus, Home, ShoppingCart, Heart, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
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
  price: number | string;
  images: string[];
  category: string;
  rating: number | string;
  reviewCount: number;
}

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
}

interface Story {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  caption: string;
  viewCount: number;
}

type TabType = 'products' | 'reels' | 'tagged';

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + ' млн';
  if (count >= 1000) return (count / 1000).toFixed(1) + ' тыс.';
  return count.toString();
}

export function SellerStorePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [stats, setStats] = useState({ products: 0, followers: 0, following: 0 });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (sellerId) {
      loadSellerData();
    }
  }, [sellerId]);

  const loadSellerData = async () => {
    setIsLoading(true);
    try {
      // Load products
      const productsResponse = await api.getProducts({ sellerId, limit: 50 }) as { data?: Product[]; pagination?: { total?: number } };
      let productsList: Product[] = [];
      if (productsResponse.data && Array.isArray(productsResponse.data)) {
        productsList = productsResponse.data;
        if (productsList.length > 0) {
          const firstProduct = productsList[0] as Product & { seller?: Seller };
          if (firstProduct.seller) {
            setSeller(firstProduct.seller);
          }
        }
      }
      setProducts(productsList);

      // Load videos/reels
      try {
        const videosResponse = await api.getVideoFeed({ sellerId, limit: 50 }) as { data?: Video[] };
        if (videosResponse.data && Array.isArray(videosResponse.data)) {
          setVideos(videosResponse.data);
        }
      } catch {
        console.log('Videos not available');
      }

      // Load stories
      try {
        const storiesResponse = await api.getStories() as { data?: { sellerId: string; stories: Story[] }[] };
        if (storiesResponse.data) {
          const sellerStories = storiesResponse.data.find(s => s.sellerId === sellerId);
          if (sellerStories) {
            setStories(sellerStories.stories);
          }
        }
      } catch {
        console.log('Stories not available');
      }

      // Set stats
      setStats({
        products: productsResponse.pagination?.total || productsList.length,
        followers: Math.floor(Math.random() * 30000) + 1000,
        following: Math.floor(Math.random() * 100) + 10,
      });

      // Check subscription
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : 'Магазин';
  const sellerUsername = seller?.phone?.replace('+998', '') || 'seller';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/products">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <span className="font-semibold text-lg">{sellerUsername}</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6" />
            <MoreHorizontal className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-4">
          {/* Avatar with gradient border */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-orange-400 via-orange-500 to-orange-600">
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {seller?.avatar ? (
                    <img src={seller.avatar} alt={sellerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {seller?.firstName?.charAt(0) || 'S'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <h2 className="font-semibold text-lg mb-2">{sellerName}</h2>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="font-bold">{stats.products}</div>
                <div className="text-xs text-gray-400">публикации</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{formatCount(stats.followers)}</div>
                <div className="text-xs text-gray-400">подписчики</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{stats.following}</div>
                <div className="text-xs text-gray-400">подписки</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <div className="text-orange-400 text-sm mb-1">Товар/услуга</div>
          <p className="text-sm whitespace-pre-line">
            🛍️ Качественные товары{'\n'}
            📱 Telegram: @{sellerUsername}{'\n'}
            📞 {seller?.phone || '+998 XX XXX XX XX'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={toggleSubscribe}
            disabled={isSubscribeLoading || !isAuthenticated}
            className={`flex-1 h-9 text-sm font-semibold rounded-lg ${
              isSubscribed 
                ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isSubscribeLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isSubscribed ? (
              <>Подп... <ChevronDown className="w-4 h-4 ml-1" /></>
            ) : (
              'Подписаться'
            )}
          </Button>
          <Button className="flex-1 h-9 text-sm font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white">
            <MessageCircle className="w-4 h-4 mr-1" />
            Сообщение
          </Button>
          <Button className="flex-1 h-9 text-sm font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white">
            <Phone className="w-4 h-4 mr-1" />
            Контакты
          </Button>
          <Button className="h-9 w-9 p-0 rounded-lg bg-gray-800 hover:bg-gray-700 text-white">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Story Highlights */}
        {stories.length > 0 && (
          <div className="flex gap-4 mt-6 overflow-x-auto pb-2">
            {stories.slice(0, 5).map((story, index) => (
              <div key={story.id} className="flex flex-col items-center min-w-[70px]">
                <div className="w-16 h-16 rounded-full border-2 border-gray-600 p-[2px] mb-1">
                  <img 
                    src={story.thumbnailUrl || story.mediaUrl} 
                    alt={story.caption}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-xs text-center truncate w-16">
                  {story.caption?.split(':')[0] || `История ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('products')}
                        className={`flex-1 py-3 flex justify-center ${
                          activeTab === 'products' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500'
                        }`}
          >
            <Grid3X3 className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('reels')}
                        className={`flex-1 py-3 flex justify-center ${
                          activeTab === 'reels' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500'
                        }`}
          >
            <Play className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
                        className={`flex-1 py-3 flex justify-center ${
                          activeTab === 'tagged' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500'
                        }`}
          >
            <UserSquare2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="pb-20">
        {activeTab === 'products' && (
          <div className="grid grid-cols-3 gap-[2px]">
            {products.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-gray-500">
                <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Нет товаров</p>
              </div>
            ) : (
              products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <div className="aspect-square bg-gray-900 relative">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/200'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                      }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="grid grid-cols-3 gap-[2px]">
            {videos.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-gray-500">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Нет видео</p>
              </div>
            ) : (
              videos.map((video) => (
                <Link key={video.id} to={`/videos`}>
                  <div className="aspect-[9/16] bg-gray-900 relative">
                    <img
                      src={video.thumbnailUrl || 'https://via.placeholder.com/200x350'}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x350';
                      }}
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                      <Play className="w-3 h-3 fill-white" />
                      <span>{formatCount(video.viewCount || 0)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="py-12 text-center text-gray-500">
            <UserSquare2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Нет отмеченных публикаций</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 py-2">
        <div className="flex justify-around">
          <Link to="/" className="p-2 text-gray-400 hover:text-white">
            <Home className="w-6 h-6" />
          </Link>
          <Link to="/videos" className="p-2 text-gray-400 hover:text-white">
            <Play className="w-6 h-6" />
          </Link>
          <Link to="/cart" className="p-2 text-gray-400 hover:text-white">
            <ShoppingCart className="w-6 h-6" />
          </Link>
          <Link to="/favorites" className="p-2 text-gray-400 hover:text-white">
            <Heart className="w-6 h-6" />
          </Link>
          <Link to="/orders" className="p-2 text-white">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </nav>
    </div>
  );
}
