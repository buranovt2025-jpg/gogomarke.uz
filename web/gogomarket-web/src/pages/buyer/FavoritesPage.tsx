import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
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
      setFavorites(favorites.filter((p) => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    } finally {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Избранное</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <Card key={product.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-gray-100">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Нет фото
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500"
                    onClick={() => handleRemove(product.id)}
                    disabled={removingId === product.id}
                  >
                    {removingId === product.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-medium text-gray-900 hover:text-orange-500 line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-orange-500">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  {product.seller && (
                    <p className="text-sm text-gray-500 mb-3">
                      {product.seller.firstName} {product.seller.lastName}
                    </p>
                  )}
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    В корзину
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">В избранном пока пусто</p>
            <p className="text-gray-400 mb-4">
              Добавляйте товары в избранное, чтобы не потерять их
            </p>
            <Link to="/products">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Перейти к покупкам
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
