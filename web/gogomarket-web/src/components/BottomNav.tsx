import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Play, 
  ShoppingBag, 
  Heart, 
  User, 
  Package, 
  BarChart3, 
  Truck, 
  DollarSign,
  LayoutDashboard,
  Users,
  Settings
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

export default function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    // Guest navigation
    if (!isAuthenticated || !user) {
      return [
        { path: '/', icon: Home, label: 'Главная' },
        { path: '/videos', icon: Play, label: 'Рилсы' },
        { path: '/products', icon: ShoppingBag, label: 'Каталог' },
        { path: '/cart', icon: ShoppingBag, label: 'Корзина', badge: totalItems },
        { path: '/login', icon: User, label: 'Войти' },
      ];
    }

    // Role-based navigation
    switch (user.role) {
      case UserRole.SELLER:
        return [
          { path: '/seller', icon: LayoutDashboard, label: 'Дашборд' },
          { path: '/seller/products', icon: Package, label: 'Товары' },
          { path: '/seller/orders', icon: ShoppingBag, label: 'Заказы' },
          { path: '/seller/analytics', icon: BarChart3, label: 'Аналитика' },
          { path: '/profile', icon: User, label: 'Профиль' },
        ];

      case UserRole.COURIER:
        return [
          { path: '/courier', icon: LayoutDashboard, label: 'Дашборд' },
          { path: '/courier', icon: Truck, label: 'Доставки' },
          { path: '/courier/payouts', icon: DollarSign, label: 'Выплаты' },
          { path: '/notifications', icon: Package, label: 'Заказы' },
          { path: '/profile', icon: User, label: 'Профиль' },
        ];

      case UserRole.ADMIN:
        return [
          { path: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
          { path: '/admin/users', icon: Users, label: 'Юзеры' },
          { path: '/admin/orders', icon: Package, label: 'Заказы' },
          { path: '/admin/financial', icon: DollarSign, label: 'Финансы' },
          { path: '/admin/moderation', icon: Settings, label: 'Модерация' },
        ];

      case UserRole.BUYER:
      default:
        return [
          { path: '/', icon: Home, label: 'Главная' },
          { path: '/videos', icon: Play, label: 'Рилсы' },
          { path: '/cart', icon: ShoppingBag, label: 'Корзина', badge: totalItems },
          { path: '/favorites', icon: Heart, label: 'Избранное' },
          { path: '/profile', icon: User, label: 'Профиль' },
        ];
    }
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/seller') return location.pathname === '/seller' || location.pathname.startsWith('/seller/');
    if (path === '/courier') return location.pathname === '/courier' || location.pathname.startsWith('/courier/');
    if (path === '/admin') return location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.path + item.label}
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
