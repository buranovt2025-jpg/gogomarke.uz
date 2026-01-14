import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Truck, ShieldCheck, ChevronRight } from 'lucide-react';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

// Empty cart component
const EmptyCart = ({ onNavigate }: { onNavigate: () => void }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4">
    <div className="relative mb-6">
      <div className="w-28 h-28 bg-orange-100 rounded-full flex items-center justify-center">
        <ShoppingBag className="w-14 h-14 text-orange-400" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-2xl">😢</span>
      </div>
    </div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h1>
    <p className="text-gray-500 mb-8 text-center max-w-xs">
      Добавьте товары из каталога, чтобы оформить заказ
    </p>
    <Button 
      onClick={onNavigate} 
      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 rounded-xl px-8 h-12 shadow-lg shadow-orange-200"
    >
      Перейти к каталогу
    </Button>
  </div>
);

// Cart item component
const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: any; 
  onUpdateQuantity: (id: string, quantity: number) => void; 
  onRemove: (id: string) => void;
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(item.product.id), 300);
  };

  return (
    <div className={`flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 ${
      isRemoving ? 'opacity-0 translate-x-10' : 'opacity-100'
    }`}>
      <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
        <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden">
          {item.product.images?.[0] ? (
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-orange-500 transition-colors">{item.product.title}</h3>
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">{item.product.category || 'Товар'}</p>
        <p className="text-lg font-bold text-orange-500 mt-2">{formatPrice(item.product.price)}</p>
      </div>
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={handleRemove}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-xl transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed rounded-r-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
      // In real app, validate promo code with API
    }
  };

  if (items.length === 0) {
    return <EmptyCart onNavigate={() => navigate('/products')} />;
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-52">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Корзина</h1>
            <p className="text-sm text-gray-500">{itemCount} товаров</p>
          </div>
        </div>
      </div>

      {/* Cart items */}
      <div className="px-4 py-4 space-y-3">
        {items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Promo code */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-900">Промокод</span>
          </div>
          {promoApplied ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
              <div>
                <p className="font-medium text-green-700">{promoCode.toUpperCase()}</p>
                <p className="text-sm text-green-600">Промокод применен!</p>
              </div>
              <button 
                onClick={() => { setPromoApplied(false); setPromoCode(''); }}
                className="text-gray-500 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Введите промокод"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 bg-gray-50 border-gray-200 rounded-xl focus:ring-orange-500"
              />
              <Button 
                variant="outline" 
                onClick={handleApplyPromo}
                disabled={!promoCode.trim()}
                className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-xl px-6"
              >
                ОК
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Truck className="w-4 h-4 text-green-500" />
            <span>Быстрая доставка</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Безопасная оплата</span>
          </div>
        </div>
      </div>

      {/* Bottom checkout panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-4 shadow-2xl">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Товары ({itemCount})</span>
            <span className="text-gray-900 font-medium">{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Доставка</span>
            <span className="text-green-600 font-semibold">БЕСПЛАТНО</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Скидка по промокоду</span>
              <span className="font-medium">-{formatPrice(totalAmount * 0.1)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-bold text-gray-900">Итого</span>
            <span className="font-bold text-xl text-orange-500">
              {formatPrice(promoApplied ? totalAmount * 0.9 : totalAmount)}
            </span>
          </div>
        </div>
        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 h-14 rounded-xl text-base font-semibold shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          onClick={handleCheckout}
        >
          Оформить заказ
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
