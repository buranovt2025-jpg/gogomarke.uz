import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}


export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <ShoppingBag className="w-20 h-20 text-gray-300 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Корзина пуста</h1>
        <p className="text-gray-500 mb-6 text-center">Добавьте товары, чтобы оформить заказ</p>
        <Button onClick={() => navigate('/products')} className="bg-orange-500 hover:bg-orange-600 rounded-xl px-8">
          Перейти к каталогу
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-48">
      <div className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold">Корзина</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-4 relative">
            {item.quantity === 0 && (
              <button
                onClick={() => removeItem(item.product.id)}
                className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {item.product.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.product.id}`}>
                <h3 className="font-medium text-gray-900 truncate">{item.product.title}</h3>
              </Link>
              <p className="text-sm text-gray-500">{item.product.category || 'Товар'}</p>
              <p className="text-orange-500 font-semibold mt-1">{formatPrice(item.product.price)}</p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-1 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{String(item.quantity).padStart(2, '0')}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 disabled:text-gray-300"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Введите промокод"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 bg-gray-100 border-0 rounded-xl"
          />
          <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-xl px-6">
            Применить
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Товары ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
            <span className="text-gray-900">{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Доставка</span>
            <span className="text-green-600 font-medium">БЕСПЛАТНО</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-900">Итого</span>
            <span className="font-bold text-lg text-gray-900">{formatPrice(totalAmount)}</span>
          </div>
        </div>
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 h-12 rounded-xl text-base font-semibold"
          onClick={handleCheckout}
        >
          Оформить заказ
        </Button>
      </div>
    </div>
  );
}
