import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { ShoppingCart, Minus, Plus, ArrowLeft, Star, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price) + ' сум';
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await api.getProduct(id!) as { success: boolean; data: { product: Product } };
      if (response.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
          <Link to="/products">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к каталогу
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link to="/products" className="inline-flex items-center text-gray-600 hover:text-orange-500 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к каталогу
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Нет фото
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === index ? 'border-orange-500' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 font-semibold">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-500">({product.reviewCount} отзывов)</span>
              </div>
            )}

            <div className="mb-6">
              <span className="text-3xl font-bold text-orange-500">{formatPrice(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="ml-3 text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="ml-2 bg-red-100 text-red-600 text-sm px-2 py-1 rounded">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Описание</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-green-600">
                  <Truck className="w-5 h-5" />
                  <span>Доставка курьером по городу</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 ml-8">Стоимость: 15 000 сум</p>
              </CardContent>
            </Card>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-600">Количество:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-500">В наличии: {product.stock}</span>
            </div>

            <div className="flex gap-4">
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
              </Button>
            </div>

            {product.seller && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Продавец</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-500 font-semibold">
                        {product.seller.firstName?.[0] || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {product.seller.firstName} {product.seller.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{product.seller.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
