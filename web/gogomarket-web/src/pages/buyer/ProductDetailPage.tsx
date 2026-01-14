import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Heart, Minus, Plus, ArrowLeft, Star, MapPin, ShoppingCart, ChevronRight, Flag, Check, Truck, Shield, RotateCcw, ZoomIn, X, MessageCircle, ThumbsUp } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import ReportDialog from '../../components/ReportDialog';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

// Image zoom modal component
const ImageZoomModal = ({ 
  images, 
  selectedIndex, 
  onClose, 
  onSelectImage 
}: { 
  images: string[]; 
  selectedIndex: number; 
  onClose: () => void; 
  onSelectImage: (index: number) => void;
}) => (
  <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
    <div className="flex items-center justify-between p-4">
      <span className="text-white/60 text-sm">{selectedIndex + 1} / {images.length}</span>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        <X className="w-6 h-6 text-white" />
      </button>
    </div>
    <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <img
        src={images[selectedIndex]}
        alt=""
        className="max-w-full max-h-full object-contain animate-scale-in"
      />
    </div>
    <div className="p-4 flex justify-center gap-2 overflow-x-auto">
      {images.map((image, index) => (
        <button
          key={index}
          onClick={(e) => { e.stopPropagation(); onSelectImage(index); }}
          className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
            selectedIndex === index ? 'ring-2 ring-orange-500 scale-110' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <img src={image} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  </div>
);

// Review component
const ReviewItem = ({ review }: { review: { user: string; rating: number; date: string; text: string; helpful: number } }) => (
  <div className="py-4 border-b border-gray-100 last:border-0">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{review.user[0]}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{review.user}</p>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">{review.date}</span>
          </div>
        </div>
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-3">{review.text}</p>
    <button className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-500 transition-colors">
      <ThumbsUp className="w-4 h-4" />
      <span>Полезно ({review.helpful})</span>
    </button>
  </div>
);

// Loading skeleton
const ProductSkeleton = () => (
  <div className="min-h-screen bg-white pb-24">
    <div className="relative">
      <Skeleton className="w-full aspect-square" />
    </div>
    <div className="px-4 pt-4 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-6 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Mock reviews data
const mockReviews = [
  { user: 'Анна М.', rating: 5, date: '2 дня назад', text: 'Отличный товар! Качество превзошло ожидания. Доставка была быстрой.', helpful: 12 },
  { user: 'Дмитрий К.', rating: 4, date: '5 дней назад', text: 'Хороший товар за свою цену. Рекомендую к покупке.', helpful: 8 },
  { user: 'Мария С.', rating: 5, date: '1 неделю назад', text: 'Полностью соответствует описанию. Продавец отзывчивый.', helpful: 5 },
];

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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
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
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Товар не найден</h1>
        <p className="text-gray-500 text-center mb-6">Возможно, он был удален или перемещен</p>
        <Button onClick={() => navigate('/products')} className="bg-orange-500 hover:bg-orange-600">
          Вернуться к каталогу
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Image Gallery */}
      <div className="relative">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        {/* Main Image */}
        <div 
          className="w-full aspect-square bg-gray-100 relative overflow-hidden cursor-zoom-in"
          onClick={() => product.images?.length && setShowZoom(true)}
        >
          {product.images?.[selectedImage] ? (
            <>
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute bottom-4 right-4 p-2 bg-black/40 backdrop-blur-sm rounded-lg">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="w-16 h-16" />
            </div>
          )}
          
          {/* Sale badge */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-4 right-16 px-3 py-1.5 bg-red-500 rounded-lg shadow-lg">
              <span className="text-white text-sm font-bold">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Thumbnail Strip */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-20 flex gap-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  selectedImage === index 
                    ? 'border-orange-500 ring-2 ring-orange-200 scale-105' 
                    : 'border-white/80 opacity-80 hover:opacity-100'
                } shadow-lg`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        
        {/* Image pagination dots */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedImage === index ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 pt-5">
        {/* Price and actions */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <Truck className="w-3.5 h-3.5" />
              Бесплатная доставка
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
                isFavorite ? 'bg-red-100' : 'bg-gray-100'
              }`}
            >
              {isFavoriteLoading ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
              )}
            </button>
            <button 
              onClick={() => setShowReportDialog(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-100 hover:bg-red-100 transition-colors"
              title="Пожаловаться"
            >
              <Flag className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-900 mb-3">{product.title}</h1>
        
        {/* Stats row */}
        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
          {product.rating && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(Number(product.rating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-medium text-gray-900">{Number(product.rating).toFixed(1)}</span>
              <span className="text-gray-400">({product.reviewCount || 0} отзывов)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>Ташкент</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" />
            <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>
              {product.stock > 0 ? `${product.stock} в наличии` : 'Нет в наличии'}
            </span>
          </div>
        </div>

        {/* Sizes */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Размер</span>
              {selectedSize && <span className="text-orange-500 text-sm font-normal">Выбран: {selectedSize}</span>}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    selectedSize === size
                      ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {product.colors && product.colors.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Цвет</span>
              {selectedColor && <span className="text-orange-500 text-sm font-normal">Выбран: {selectedColor}</span>}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    selectedColor === color
                      ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs for description and reviews */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="description" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Описание
            </TabsTrigger>
            <TabsTrigger value="details" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Детали
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Отзывы
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-4">
            <p className="text-gray-600 leading-relaxed">
              {product.description || 'Описание товара отсутствует'}
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                <Truck className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-xs text-gray-600 text-center">Быстрая доставка</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                <Shield className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-xs text-gray-600 text-center">Гарантия качества</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                <RotateCcw className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-xs text-gray-600 text-center">Возврат 14 дней</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="mt-4">
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Состояние</span>
                <span className="text-gray-900 font-medium">Новый</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Мин. заказ</span>
                <span className="text-gray-900 font-medium">1 шт.</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Категория</span>
                <Link to={`/products?category=${product.category}`} className="text-orange-500 font-medium hover:underline">
                  {product.category || 'Товары'}
                </Link>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Наличие</span>
                <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4">
            {/* Rating summary */}
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl mb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{Number(product.rating || 4.5).toFixed(1)}</div>
                <div className="flex mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(Number(product.rating) || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{product.reviewCount || 0} отзывов</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{star}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: star === 5 ? '60%' : star === 4 ? '25%' : star === 3 ? '10%' : '5%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Reviews list */}
            <div className="divide-y divide-gray-100">
              {mockReviews.map((review, index) => (
                <ReviewItem key={index} review={review} />
              ))}
            </div>
            
            <button className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Все отзывы
            </button>
          </TabsContent>
        </Tabs>

        {/* Seller card */}
        {product.seller && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <Link to={`/store/${product.seller.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                  <span className="text-white font-bold text-lg">
                    {product.seller.firstName?.[0] || 'S'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {product.seller.firstName} {product.seller.lastName}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    4.8 · 150 товаров
                  </p>
                </div>
              </Link>
              <Button 
                variant="outline" 
                className={`transition-all duration-200 ${
                  isSubscribed 
                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' 
                    : 'border-orange-500 text-orange-500 hover:bg-orange-50'
                }`}
                onClick={toggleSubscribe}
                disabled={isSubscribeLoading}
              >
                {isSubscribeLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : isSubscribed ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : null}
                {isSubscribed ? 'Подписан' : 'Подписаться'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 flex items-center gap-3 shadow-2xl shadow-gray-200">
        {/* Quantity selector */}
        <div className="flex items-center bg-gray-100 rounded-xl">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:text-gray-300 hover:bg-gray-200 rounded-l-xl transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
            className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:text-gray-300 hover:bg-gray-200 rounded-r-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Add to cart button with animation */}
        <Button
          className={`flex-1 h-12 rounded-xl text-base font-semibold transition-all duration-300 ${
            addedToCart 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-lg shadow-orange-200'
          }`}
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addedToCart}
        >
          {addedToCart ? (
            <>
              <Check className="w-5 h-5 mr-2 animate-bounce" />
              Добавлено!
            </>
          ) : product.stock === 0 ? (
            'Нет в наличии'
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              В корзину · {formatPrice(product.price * quantity)}
            </>
          )}
        </Button>
      </div>

      {/* Image zoom modal */}
      {showZoom && product.images && (
        <ImageZoomModal
          images={product.images}
          selectedIndex={selectedImage}
          onClose={() => setShowZoom(false)}
          onSelectImage={setSelectedImage}
        />
      )}

      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        targetType="product"
        targetId={id || ''}
        targetTitle={product.title}
      />

      {/* Animation styles */}
      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
