import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Heart, Minus, Plus, ArrowLeft, Star, MapPin, ShoppingCart, ChevronRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
    const { addItem } = useCart();
    const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (id) {
      loadProduct();
      if (isAuthenticated) {
        checkFavorite();
      }
    }
  }, [id, isAuthenticated]);

  const loadProduct = async () => {
    try {
      const response = await api.getProduct(id!) as { success: boolean; data: Product };
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setIsLoading(false);
    }
  };

    const checkFavorite = async () => {
      try {
        const response = await api.checkFavorite(id!) as { success: boolean; data: { isFavorite: boolean } };
        if (response.success) {
          setIsFavorite(response.data.isFavorite);
        }
      } catch (error) {
        console.error('Failed to check favorite:', error);
      }
    };

    const toggleFavorite = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
    
      setIsFavoriteLoading(true);
      try {
        if (isFavorite) {
          await api.removeFromFavorites(id!);
          setIsFavorite(false);
        } else {
          await api.addToFavorites(id!);
          setIsFavorite(true);
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      } finally {
        setIsFavoriteLoading(false);
      }
    };

    const toggleSubscribe = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
    
      if (!product?.seller?.id) return;
    
      setIsSubscribeLoading(true);
      try {
        if (isSubscribed) {
          await api.unsubscribe(product.seller.id);
          setIsSubscribed(false);
        } else {
          await api.subscribe(product.seller.id);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Failed to toggle subscription:', error);
      } finally {
        setIsSubscribeLoading(false);
      }
    };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="relative">
          <Skeleton className="w-full aspect-square" />
        </div>
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold mb-4">Товар не найден</h1>
        <Button onClick={() => navigate('/products')} className="bg-orange-500 hover:bg-orange-600">
          Вернуться к каталогу
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
          {product.images?.[selectedImage] ? (
            <img
              src={product.images[selectedImage]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="w-16 h-16" />
            </div>
          )}
          
          {product.images && product.images.length > 1 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              {product.images.slice(0, 3).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-orange-500' : 'border-white'
                  } shadow-md`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    selectedImage === index ? 'bg-orange-500' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Бесплатная доставка
            </span>
          </div>
                    <button 
                      onClick={toggleFavorite}
                      disabled={isFavoriteLoading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isFavorite ? 'bg-orange-100' : 'bg-gray-100'
                      }`}
                    >
                      {isFavoriteLoading ? (
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Heart className={`w-5 h-5 ${isFavorite ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}`} />
                      )}
                    </button>
        </div>

        <h1 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>Ташкент</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" />
            <span>{product.stock} в наличии</span>
          </div>
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{Number(product.rating).toFixed(1)} ({product.reviewCount || 0})</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 py-4">
          <h3 className="font-semibold text-gray-900 mb-3">Детали товара</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Состояние</span>
              <span className="text-gray-900">Новый</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Мин. заказ</span>
              <span className="text-gray-900">1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Категория</span>
              <span className="text-orange-500">{product.category || 'Товары'}</span>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="border-t border-gray-100 py-4">
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {product.rating && (
          <div className="border-t border-gray-100 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Отзывы</h3>
              <Link to="#" className="text-sm text-orange-500 flex items-center">
                Все <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{Number(product.rating).toFixed(1)}</span>
              <span className="text-gray-500 text-sm">{product.reviewCount || 0} отзывов</span>
            </div>
          </div>
        )}

        {product.seller && (
                    <div className="border-t border-gray-100 py-4">
                      <div className="flex items-center justify-between">
                        <Link to={`/store/${product.seller.id}`} className="flex items-center gap-3 hover:opacity-80">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-500 font-semibold text-lg">
                              {product.seller.firstName?.[0] || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {product.seller.firstName} {product.seller.lastName}
                            </p>
                            <p className="text-sm text-gray-500">Перейти в магазин</p>
                          </div>
                        </Link>
                            <Button 
                              variant="outline" 
                              className={isSubscribed ? "bg-orange-500 text-white hover:bg-orange-600" : "border-orange-500 text-orange-500 hover:bg-orange-50"}
                              onClick={toggleSubscribe}
                              disabled={isSubscribeLoading}
                            >
                              {isSubscribeLoading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                              ) : null}
                              {isSubscribed ? 'Подписан' : 'Подписаться'}
                            </Button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-xl">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:text-gray-300"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
            className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:text-gray-300"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 h-12 rounded-xl text-base font-semibold"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
        </Button>
      </div>
    </div>
  );
}
