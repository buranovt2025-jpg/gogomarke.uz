import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Heart, Search, SlidersHorizontal, ShoppingBag, ArrowLeft, Star } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

const categories = [
  { value: 'all', label: 'Все', icon: '🛍️' },
  { value: 'electronics', label: 'Электроника', icon: '📱' },
  { value: 'clothing', label: 'Одежда', icon: '👕' },
  { value: 'home', label: 'Дом', icon: '🏠' },
  { value: 'beauty', label: 'Красота', icon: '💄' },
  { value: 'sports', label: 'Спорт', icon: '⚽' },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params: { limit: number; category?: string } = { limit: 50 };
      if (category !== 'all') params.category = category;
      
      const response = await api.getProducts(params) as {
        success: boolean;
        data: Product[];
      };
      
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 md:hidden">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold">Каталог</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-12 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-orange-500"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
            <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
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
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">Нет в наличии</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-orange-500 font-semibold">{formatPrice(product.price)}</p>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{Number(product.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Товары не найдены</p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setSearch('');
                setCategory('all');
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
