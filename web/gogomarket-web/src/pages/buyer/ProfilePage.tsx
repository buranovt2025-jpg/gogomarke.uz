import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight,
  Package,
  Heart,
  MessageSquare,
  Bell,
  HelpCircle,
  Shield,
  CreditCard
} from 'lucide-react';
import { UserRole } from '../../types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async () => {
    if (user) {
      updateUser({ ...user, firstName, lastName, email });
      setIsEditing(false);
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.BUYER: return 'Покупатель';
      case UserRole.SELLER: return 'Продавец';
      case UserRole.COURIER: return 'Курьер';
      case UserRole.ADMIN: return 'Администратор';
      default: return 'Пользователь';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.BUYER: return 'bg-blue-100 text-blue-800';
      case UserRole.SELLER: return 'bg-green-100 text-green-800';
      case UserRole.COURIER: return 'bg-purple-100 text-purple-800';
      case UserRole.ADMIN: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const menuItems = [
    { icon: Package, label: 'Мои заказы', path: '/orders', roles: [UserRole.BUYER, UserRole.SELLER] },
    { icon: Heart, label: 'Избранное', path: '/favorites', roles: [UserRole.BUYER, UserRole.SELLER] },
    { icon: MapPin, label: 'Адреса доставки', path: '/addresses', roles: [UserRole.BUYER] },
    { icon: CreditCard, label: 'Способы оплаты', path: '/payment-methods', roles: [UserRole.BUYER] },
    { icon: MessageSquare, label: 'Чаты', path: '/chats', roles: [UserRole.BUYER, UserRole.SELLER, UserRole.COURIER] },
    { icon: Bell, label: 'Уведомления', path: '/notifications', roles: [UserRole.BUYER, UserRole.SELLER, UserRole.COURIER, UserRole.ADMIN] },
    { icon: HelpCircle, label: 'Поддержка', path: '/support', roles: [UserRole.BUYER, UserRole.SELLER, UserRole.COURIER] },
    { icon: Shield, label: 'Безопасность', path: '/security', roles: [UserRole.BUYER, UserRole.SELLER, UserRole.COURIER, UserRole.ADMIN] },
    { icon: Settings, label: 'Настройки', path: '/settings', roles: [UserRole.BUYER, UserRole.SELLER, UserRole.COURIER, UserRole.ADMIN] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Вы не авторизованы</p>
          <Button onClick={() => navigate('/login')}>Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 pb-20">
        <h1 className="text-2xl font-bold">Профиль</h1>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-14">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                  {user.firstName?.[0] || user.phone?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Имя"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      placeholder="Фамилия"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || 'Пользователь'}
                    </h2>
                    <p className="text-gray-500 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-4 space-y-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600">
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setIsEditing(true)}
              >
                Редактировать профиль
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-specific quick actions */}
      {user.role === UserRole.SELLER && (
        <div className="px-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Панель продавца</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col"
                  onClick={() => navigate('/seller')}
                >
                  <Package className="w-5 h-5 mb-1" />
                  <span className="text-xs">Дашборд</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col"
                  onClick={() => navigate('/seller/products')}
                >
                  <Settings className="w-5 h-5 mb-1" />
                  <span className="text-xs">Товары</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === UserRole.COURIER && (
        <div className="px-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Панель курьера</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col"
                  onClick={() => navigate('/courier')}
                >
                  <Package className="w-5 h-5 mb-1" />
                  <span className="text-xs">Дашборд</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col"
                  onClick={() => navigate('/courier/payouts')}
                >
                  <CreditCard className="w-5 h-5 mb-1" />
                  <span className="text-xs">Выплаты</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === UserRole.ADMIN && (
        <div className="px-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Панель администратора</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-red-500 hover:bg-red-600"
                onClick={() => navigate('/admin')}
              >
                Перейти в админ-панель
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 mt-4">
        <Card>
          <CardContent className="p-0">
            {filteredMenuItems.map((item, index) => (
              <div key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-500" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                {index < filteredMenuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-4 mb-8">
        <Button 
          variant="outline" 
          className="w-full text-red-500 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
