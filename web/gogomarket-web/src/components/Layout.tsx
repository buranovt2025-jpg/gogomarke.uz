import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { UserRole } from '../types';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ShoppingCart, User, LogOut, Store, Shield, Package, Home, Grid3X3, Heart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.SELLER:
        return '/seller';
      default:
        return '/';
    }
  };

  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const hideHeaderFooter = ['/cart', '/checkout'].some(p => location.pathname.startsWith(p)) ||
    location.pathname.match(/^\/products\/\d+$/);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeaderFooter && (
        <header className="bg-white border-b sticky top-0 z-50 hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-white">G</span>
                  </div>
                  <span className="text-xl font-bold">GoGoMarket</span>
                </Link>
                <nav className="flex items-center gap-6">
                  <Link
                    to="/"
                    className={`text-sm font-medium ${location.pathname === '/' ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                  >
                    Главная
                  </Link>
                  <Link
                    to="/products"
                    className={`text-sm font-medium ${location.pathname.startsWith('/products') ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                  >
                    Каталог
                  </Link>
                  {isAuthenticated && user?.role === UserRole.SELLER && (
                    <Link
                      to="/seller"
                      className={`text-sm font-medium ${location.pathname.startsWith('/seller') ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                    >
                      Продажи
                    </Link>
                  )}
                  {isAuthenticated && user?.role === UserRole.ADMIN && (
                    <Link
                      to="/admin"
                      className={`text-sm font-medium ${location.pathname.startsWith('/admin') ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                    >
                      Админ
                    </Link>
                  )}
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user?.firstName || user?.phone}</p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                        <Home className="w-4 h-4 mr-2" />
                        Панель управления
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/orders')}>
                        <Package className="w-4 h-4 mr-2" />
                        Мои заказы
                      </DropdownMenuItem>
                      {user?.role === UserRole.SELLER && (
                        <DropdownMenuItem onClick={() => navigate('/seller/products')}>
                          <Store className="w-4 h-4 mr-2" />
                          Мои товары
                        </DropdownMenuItem>
                      )}
                      {user?.role === UserRole.ADMIN && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Администрирование
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Выйти
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/login">
                      <Button variant="ghost" size="sm">
                        Войти
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        Регистрация
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {!hideHeaderFooter && (
        <>
          <footer className="bg-gray-900 text-white py-12 hidden md:block">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-white">G</span>
                    </div>
                    <span className="text-xl font-bold">GoGoMarket</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Социальный маркетплейс с видео-контентом. Покупайте и продавайте через видео.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Покупателям</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link to="/products" className="hover:text-white">Каталог</Link></li>
                    <li><Link to="/orders" className="hover:text-white">Мои заказы</Link></li>
                    <li><a href="#" className="hover:text-white">Как купить</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Продавцам</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link to="/register" className="hover:text-white">Стать продавцом</Link></li>
                    <li><a href="#" className="hover:text-white">Как продавать</a></li>
                    <li><a href="#" className="hover:text-white">Тарифы</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Контакты</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>Ташкент, Узбекистан</li>
                    <li>+998 90 123 45 67</li>
                    <li>info@gogomarket.uz</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                <p>© 2026 GoGoMarket. Все права защищены.</p>
              </div>
            </div>
          </footer>

                    <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg md:hidden z-50">
                      <div className="flex items-center justify-around h-16">
              <Link
                to="/"
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isNavActive('/') ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="text-xs mt-1">Главная</span>
              </Link>
              <Link
                to="/products"
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isNavActive('/products') ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <Grid3X3 className="w-6 h-6" />
                <span className="text-xs mt-1">Каталог</span>
              </Link>
              <Link
                to="/cart"
                className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                  isNavActive('/cart') ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">Корзина</span>
              </Link>
              <Link
                to="/wishlist"
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isNavActive('/wishlist') ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <Heart className="w-6 h-6" />
                <span className="text-xs mt-1">Избранное</span>
              </Link>
              <Link
                to={isAuthenticated ? (user?.role === UserRole.SELLER ? '/seller' : user?.role === UserRole.ADMIN ? '/admin' : '/orders') : '/login'}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isNavActive('/orders') || isNavActive('/seller') || isNavActive('/admin') || isNavActive('/login') ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-xs mt-1">Профиль</span>
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
