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
import { ShoppingCart, User, LogOut, Store, Shield, Package, Home, Heart, Truck, Bell, RotateCcw, HelpCircle, Clock, Play, BarChart3, Video, MapPin, Wallet, Settings, Users, Globe, CreditCard, Tag, FileText, MessageSquare } from 'lucide-react';
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
    navigate('/login');
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
    location.pathname.match(/^\/products\/[^/]+$/);

  // Role-specific menu items
  const getRoleMenuItems = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.ADMIN:
        return (
          <>
            <DropdownMenuItem onClick={() => navigate('/admin')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Дашборд
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/users')}>
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
              <Package className="w-4 h-4 mr-2" />
              Заказы
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/financial')}>
              <CreditCard className="w-4 h-4 mr-2" />
              Финансы
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/disputes')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Споры
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/tickets')}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Тикеты
            </DropdownMenuItem>
          </>
        );

      case UserRole.SELLER:
        return (
          <>
            <DropdownMenuItem onClick={() => navigate('/seller')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Дашборд
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seller/products')}>
              <Store className="w-4 h-4 mr-2" />
              Мои товары
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seller/orders')}>
              <Package className="w-4 h-4 mr-2" />
              Заказы
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seller/videos')}>
              <Video className="w-4 h-4 mr-2" />
              Видео
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seller/coupons')}>
              <Tag className="w-4 h-4 mr-2" />
              Купоны
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seller/payouts')}>
              <Wallet className="w-4 h-4 mr-2" />
              Выплаты
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/seller/analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Аналитика
            </DropdownMenuItem>
          </>
        );

      case UserRole.COURIER:
        return (
          <>
            <DropdownMenuItem onClick={() => navigate('/courier')}>
              <Truck className="w-4 h-4 mr-2" />
              Доставки
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/courier/payouts')}>
              <Wallet className="w-4 h-4 mr-2" />
              Выплаты
            </DropdownMenuItem>
          </>
        );

      case UserRole.BUYER:
      default:
        return (
          <>
            <DropdownMenuItem onClick={() => navigate('/orders')}>
              <Package className="w-4 h-4 mr-2" />
              Мои заказы
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/favorites')}>
              <Heart className="w-4 h-4 mr-2" />
              Избранное
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/returns')}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Возвраты
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/disputes')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Споры
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/history')}>
              <Clock className="w-4 h-4 mr-2" />
              История
            </DropdownMenuItem>
          </>
        );
    }
  };

  const getRoleName = () => {
    if (!user) return '';
    switch (user.role) {
      case UserRole.ADMIN: return 'Администратор';
      case UserRole.SELLER: return 'Продавец';
      case UserRole.COURIER: return 'Курьер';
      case UserRole.BUYER: return 'Покупатель';
      default: return user.role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-xl relative flex flex-col">
        {!hideHeaderFooter && (
          <header className="bg-white border-b sticky top-0 z-50">
            <div className="px-4">
              <div className="flex items-center justify-between h-14">
                <Link to={getDashboardLink()} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-white">G</span>
                  </div>
                  <span className="text-lg font-bold">GoGoMarket</span>
                </Link>

                <div className="flex items-center gap-2">
                  {/* Language Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-2">
                        <Globe className="w-4 h-4" />
                        <span className="uppercase text-xs ml-1">{language}</span>
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
                      <Button variant="ghost" size="icon" className="w-9 h-9">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )}

                  {/* Cart only for buyers */}
                  {(!isAuthenticated || user?.role === UserRole.BUYER) && (
                    <Link to="/cart" className="relative">
                      <Button variant="ghost" size="icon" className="w-9 h-9">
                        <ShoppingCart className="w-5 h-5" />
                        {totalItems > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                            {totalItems}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )}

                  {isAuthenticated ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-9 h-9">
                          <User className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium">{user?.firstName || user?.phone}</p>
                          <p className="text-xs text-gray-500">{getRoleName()}</p>
                        </div>
                        <DropdownMenuSeparator />
                        {getRoleMenuItems()}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/support')}>
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Поддержка
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                          <LogOut className="w-4 h-4 mr-2" />
                          Выйти
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link to="/login">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        Войти
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 pb-16 overflow-y-auto">{children}</main>

        {!hideHeaderFooter && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl shadow-lg z-50 border-t">
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
                  <Link to="/seller" className={`flex flex-col items-center justify-center flex-1 h-full ${location.pathname === '/seller' ? 'text-orange-500' : 'text-gray-500'}`}>
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
                  <Link to="/seller/payouts" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/seller/payouts') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Wallet className="w-6 h-6" />
                    <span className="text-xs mt-1">{t('nav.payouts')}</span>
                  </Link>
                </>
              )}

              {/* Courier Navigation */}
              {isAuthenticated && user?.role === UserRole.COURIER && (
                <>
                  <Link to="/courier" className={`flex flex-col items-center justify-center flex-1 h-full ${location.pathname === '/courier' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Truck className="w-6 h-6" />
                    <span className="text-xs mt-1">{t('nav.deliveries')}</span>
                  </Link>
                  <Link to="/courier/payouts" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/courier/payouts') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Wallet className="w-6 h-6" />
                    <span className="text-xs mt-1">{t('nav.payouts')}</span>
                  </Link>
                  <Link to="/notifications" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/notifications') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Bell className="w-6 h-6" />
                    <span className="text-xs mt-1">Уведомления</span>
                  </Link>
                  <Link to="/support" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/support') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <HelpCircle className="w-6 h-6" />
                    <span className="text-xs mt-1">Помощь</span>
                  </Link>
                </>
              )}

              {/* Admin Navigation */}
              {isAuthenticated && user?.role === UserRole.ADMIN && (
                <>
                  <Link to="/admin" className={`flex flex-col items-center justify-center flex-1 h-full ${location.pathname === '/admin' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-xs mt-1">{t('nav.dashboard')}</span>
                  </Link>
                  <Link to="/admin/users" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/users') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Users className="w-6 h-6" />
                    <span className="text-xs mt-1">{t('nav.users')}</span>
                  </Link>
                  <Link to="/admin/orders" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/orders') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Package className="w-6 h-6" />
                    <span className="text-xs mt-1">{t('nav.orders')}</span>
                  </Link>
                  <Link to="/admin/financial" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/financial') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs mt-1">Финансы</span>
                  </Link>
                  <Link to="/admin/disputes" className={`flex flex-col items-center justify-center flex-1 h-full ${isNavActive('/admin/disputes') ? 'text-orange-500' : 'text-gray-500'}`}>
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-xs mt-1">Споры</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
