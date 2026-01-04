import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/products', icon: Grid3X3, label: 'Каталог' },
    { path: '/cart', icon: ShoppingBag, label: 'Корзина', badge: totalItems },
    { path: '/wishlist', icon: Heart, label: 'Избранное' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              isActive(item.path) ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
