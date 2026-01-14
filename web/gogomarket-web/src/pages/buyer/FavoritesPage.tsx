import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Heart, ShoppingCart, Trash2, Star, Check, ArrowLeft, Package } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

// Skeleton for product card
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
      <div className="h-6 bg-gray-200 rounded-full w-2/3" />
      <div className="h-10 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

// Empty state component
const EmptyFavorites = () => (
  <div className="text-center py-16">
    <div className="relative w-28 h-28 mx-auto mb-6">
      <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center">
        <Heart className="w-14 h-14 text-red-300" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-2xl">💔</span>
      </div>
    </div>
    <p className="text-xl font-semibold text-gray-900 mb-2">В избранном пусто</p>
    <p className="text-gray-500 mb-8 max-w-xs mx-auto">
      Добавляйте понравившиеся товары в избранное, чтобы не потерять их
    </p>
    <Link to="/products">
      <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl px-8">
        <Package className="w-5 h-5 mr-2" />
        Перейти к покупкам
      </Button>
    </Link>
  </div>
);

// Product card component
const FavoriteProductCard = ({ 
  product, 
  onRemove, 
  onAddToCart, 
  isRemoving,
  isAdded 
}: { 
  product: Product; 
  onRemove: () => void; 
  onAddToCart: () => void;
  isRemoving: boolean;
  isAdded: boolean;
}) => {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Card className={`overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 group ${
      isRemoving ? 'opacity-0 scale-95' : 'opacity-100'
    }`}>
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-16 h-16" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-red-50 text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
          onClick={onRemove}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 rounded-lg shadow-lg">
            <span className="text-white text-sm font-bold">-{discount}%</span>
          </div>
        )}

        {/* Rating badge */}
        {product.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-orange-500 line-clamp-2 mb-2 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-orange-500">
            {formatPrice(product.price)}
          </span>
          {discount > 0 && product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Seller info */}
        {product.seller && (
          <Link 
            to={`/store/${product.seller.id}`}
            className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {product.seller.firstName?.[0] || 'S'}
              </span>
            </div>
            <span className="text-sm text-gray-600 truncate">
              {product.seller.firstName} {product.seller.lastName}
            </span>
          </Link>
        )}

        {/* Add to cart button */}
        <Button
          className={`w-full rounded-xl h-11 font-semibold transition-all duration-300 ${
            isAdded 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-lg shadow-orange-200'
          }`}
          onClick={onAddToCart}
          disabled={isAdded || (product.stock !== undefined && product.stock === 0)}
        >
          {isAdded ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Добавлено
            </>
          ) : product.stock === 0 ? (
            'Нет в наличии'
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              В корзину
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { addItem } = useCart();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await api.getFavorites() as { success: boolean; data: Product[] };
      if (response.success) {
        setFavorites(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await api.removeFromFavorites(productId);
      setTimeout(() => {
        setFavorites(favorites.filter((p) => p.id !== productId));
        setRemovingId(null);
      }, 300);
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0],
      quantity: 1,
    });
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Избранное</h1>
            {favorites.length > 0 && (
              <p className="text-gray-500 mt-1">{favorites.length} товаров</p>
            )}
          </div>
          {favorites.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span className="text-red-600 font-medium">{favorites.length}</span>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <FavoriteProductCard
                key={product.id}
                product={product}
                onRemove={() => handleRemove(product.id)}
                onAddToCart={() => handleAddToCart(product)}
                isRemoving={removingId === product.id}
                isAdded={addedIds.has(product.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyFavorites />
        )}
      </div>
    </div>
  );
}
