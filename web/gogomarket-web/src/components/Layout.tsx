import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../types';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ShoppingCart, User, LogOut, Store, Shield, Package, Home, Grid3X3, Heart, Truck, Bell, RotateCcw, HelpCircle, Clock, Play, BarChart3, Video, MapPin, Wallet, Settings, Users, Globe } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
        const { user, isAuthenticated, logout } = useAuth();
        const { totalItems } = useCart();
        const { unreadCount } = useNotifications();
        const { t, language, setLanguage, languages } = useLanguage();

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
        case UserRole.COURIER:
          return '/courier';
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
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Centered phone-frame container */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-xl relative flex flex-col">
      {!hideHeaderFooter && (
        <header className="bg-white border-b sticky top-0 z-50 hidden md:block">
          <div className="px-4">
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
                                      {t('nav.home')}
                                    </Link>
                                    <Link
                                      to="/products"
                                      className={`text-sm font-medium ${location.pathname.startsWith('/products') ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                                    >
                                      {t('nav.catalog')}
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
                                                          {/* Language Switcher */}
                                                          <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                                                <Globe className="w-4 h-4" />
                                                                <span className="uppercase text-xs">{language}</span>
                                                              </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                              {languages.map((lang) => (
                                                                <DropdownMenuItem
                                                                  key={lang.code}
                                                                  onClick={() => setLanguage(lang.code)}
                                                                  className={language === lang.code ? 'bg-orange-50 text-orange-600' : ''}
                                                                >
                                                                  {lang.name}
                                                                </DropdownMenuItem>
                                                              ))}
                                                            </DropdownMenuContent>
                                                          </DropdownMenu>
                                                          {isAuthenticated && (
                                                            <Link to="/notifications" className="relative">
                                                              <Button variant="ghost" size="icon">
                                                                <Bell className="w-5 h-5" />
                                                                {unreadCount > 0 && (
                                                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                                  </span>
                                                                )}
                                                              </Button>
                                                            </Link>
                              )}
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
                                                                                        <DropdownMenuItem onClick={() => navigate('/returns')}>
                                                                                          <RotateCcw className="w-4 h-4 mr-2" />
                                                                                          Мои возвраты
                                                                                        </DropdownMenuItem>
                                                                                                                                                                                <DropdownMenuItem onClick={() => navigate('/support')}>
                                                                                                                                                                                  <HelpCircle className="w-4 h-4 mr-2" />
                                                                                                                                                                                  Поддержка
                                                                                                                                                                                </DropdownMenuItem>
                                                                                                                                                                                <DropdownMenuItem onClick={() => navigate('/history')}>
                                                                                                                                                                                  <Clock className="w-4 h-4 mr-2" />
                                                                                                                                                                                  История просмотров
                                                                                                                                                                                </DropdownMenuItem>
                                                                                                                                                                                                      {user?.role === UserRole.SELLER && (
                                              <DropdownMenuItem onClick={() => navigate('/seller/products')}>
                                                <Store className="w-4 h-4 mr-2" />
                                                Мои товары
                                              </DropdownMenuItem>
                                            )}
                                            {user?.role === UserRole.COURIER && (
                                              <DropdownMenuItem onClick={() => navigate('/courier')}>
                                                <Truck className="w-4 h-4 mr-2" />
                                                Панель курьера
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

      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">{children}</main>

      {!hideHeaderFooter && (
        <>
                              <footer className="bg-gray-900 text-white py-6 hidden md:block">
                      <div className="px-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-white">G</span>
                          </div>
                          <span className="text-lg font-bold">GoGoMarket</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-3">
                          Социальный маркетплейс с видео-контентом
                        </p>
                        <div className="flex justify-center gap-4 text-xs text-gray-400 mb-3">
                          <Link to="/products" className="hover:text-white">Каталог</Link>
                          <Link to="/orders" className="hover:text-white">Заказы</Link>
                          <Link to="/register" className="hover:text-white">Продавцам</Link>
                        </div>
                        <p className="text-xs text-gray-500">© 2026 GoGoMarket</p>
                      </div>
                    </footer>

                    {/* Bottom navigation - Role-based */}
                    <nav className="sticky bottom-0 bg-white rounded-t-3xl shadow-lg z-50 border-t">
                      <div className="flex items-center justify-around h-16">
                        {/* Buyer Navigation (default) */}
                        {(!isAuthenticated || user?.role === UserRole.BUYER) && (
                          <>
                                                        <Link to="/" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                          <Home className="w-6 h-6" />
                                                          <span className="text-xs mt-1">{t('nav.home')}</span>
                                                        </Link>
                                                        <Link to="/videos" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/videos') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                          <Play className="w-6 h-6" />
                                                          <span className="text-xs mt-1">{t('nav.reels')}</span>
                                                        </Link>
                                                        <Link to="/cart" className={`flex flex-col items-center justify-center flex-1 h-full relative ${isNavActive('/cart') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                          <div className="relative">
                                                            <ShoppingCart className="w-6 h-6" />
                                                            {totalItems > 0 && (
                                                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                                                                {totalItems > 9 ? '9+' : totalItems}
                                                              </span>
                                                            )}
                                                          </div>
                                                          <span className="text-xs mt-1">{t('nav.cart')}</span>
                                                        </Link>
                                                        <Link to="/favorites" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/favorites') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                          <Heart className="w-6 h-6" />
                                                          <span className="text-xs mt-1">{t('nav.favorites')}</span>
                                                        </Link>
                                                        <Link to={isAuthenticated ? '/orders' : '/login'} className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/orders') || isNavActive('/login') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                          <User className="w-6 h-6" />
                                                          <span className="text-xs mt-1">{t('nav.profile')}</span>
                                                        </Link>
                          </>
                        )}

                                                {/* Seller Navigation */}
                                                {isAuthenticated && user?.role === UserRole.SELLER && (
                                                  <>
                                                    <Link to="/seller" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/seller') && !isNavActive('/seller/products') && !isNavActive('/seller/orders') && !isNavActive('/seller/videos') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <BarChart3 className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.dashboard')}</span>
                                                    </Link>
                                                    <Link to="/seller/products" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/seller/products') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Store className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.products')}</span>
                                                    </Link>
                                                    <Link to="/seller/orders" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/seller/orders') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Package className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.orders')}</span>
                                                    </Link>
                                                    <Link to="/seller/videos" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/seller/videos') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Video className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.videos')}</span>
                                                    </Link>
                                                    <Link to="/seller/profile" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/seller/profile') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <User className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.profile')}</span>
                                                    </Link>
                                                  </>
                                                )}

                                                {/* Courier Navigation */}
                                                {isAuthenticated && user?.role === UserRole.COURIER && (
                                                  <>
                                                    <Link to="/courier" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/courier') && !isNavActive('/courier/history') && !isNavActive('/courier/map') && !isNavActive('/courier/payouts') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Truck className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.deliveries')}</span>
                                                    </Link>
                                                    <Link to="/courier/history" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/courier/history') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Clock className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.history')}</span>
                                                    </Link>
                                                    <Link to="/courier/map" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/courier/map') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <MapPin className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.map')}</span>
                                                    </Link>
                                                    <Link to="/courier/payouts" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/courier/payouts') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Wallet className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.payouts')}</span>
                                                    </Link>
                                                    <Link to="/courier/profile" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/courier/profile') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <User className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.profile')}</span>
                                                    </Link>
                                                  </>
                                                )}

                                                {/* Admin Navigation */}
                                                {isAuthenticated && user?.role === UserRole.ADMIN && (
                                                  <>
                                                    <Link to="/admin" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin') && !isNavActive('/admin/users') && !isNavActive('/admin/products') && !isNavActive('/admin/orders') && !isNavActive('/admin/settings') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <BarChart3 className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.dashboard')}</span>
                                                    </Link>
                                                    <Link to="/admin/users" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/users') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Users className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.users')}</span>
                                                    </Link>
                                                    <Link to="/admin/products" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/products') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Store className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.products')}</span>
                                                    </Link>
                                                    <Link to="/admin/orders" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/orders') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Package className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.orders')}</span>
                                                    </Link>
                                                    <Link to="/admin/settings" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/settings') ? 'text-orange-500' : 'text-gray-500'}`}>
                                                      <Settings className="w-6 h-6" />
                                                      <span className="text-xs mt-1">{t('nav.settings')}</span>
                                                    </Link>
                                                  </>
                                                )}
            </div>
          </nav>
        </>
      )}
      </div>
    </div>
  );
}
