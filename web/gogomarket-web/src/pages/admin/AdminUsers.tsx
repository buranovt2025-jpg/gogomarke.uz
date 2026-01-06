import { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Search, User as UserIcon, Store, Truck, Shield, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  [UserRole.ADMIN]: { label: 'Админ', color: 'bg-red-100 text-red-800', icon: <Shield className="w-4 h-4" /> },
  [UserRole.SELLER]: { label: 'Продавец', color: 'bg-purple-100 text-purple-800', icon: <Store className="w-4 h-4" /> },
  [UserRole.BUYER]: { label: 'Покупатель', color: 'bg-blue-100 text-blue-800', icon: <UserIcon className="w-4 h-4" /> },
  [UserRole.COURIER]: { label: 'Курьер', color: 'bg-green-100 text-green-800', icon: <Truck className="w-4 h-4" /> },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ limit: 100 }) as { success: boolean; data: { users: User[]; pagination: { total: number } } };
      if (response.success && response.data?.users) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string, verify: boolean) => {
    try {
      setActionLoading(true);
      await api.updateProfile({ isVerified: verify });
      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: verify } : u));
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Не удалось обновить статус пользователя');
    } finally {
      setActionLoading(false);
    }
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.phone.toLowerCase().includes(search.toLowerCase()) ||
      (user.firstName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userCounts = {
    all: users.length,
    [UserRole.BUYER]: users.filter((u) => u.role === UserRole.BUYER).length,
    [UserRole.SELLER]: users.filter((u) => u.role === UserRole.SELLER).length,
    [UserRole.COURIER]: users.filter((u) => u.role === UserRole.COURIER).length,
    [UserRole.ADMIN]: users.filter((u) => u.role === UserRole.ADMIN).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Пользователи</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Поиск по телефону или имени..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Все ({userCounts.all})</TabsTrigger>
            <TabsTrigger value={UserRole.BUYER}>Покупатели ({userCounts[UserRole.BUYER]})</TabsTrigger>
            <TabsTrigger value={UserRole.SELLER}>Продавцы ({userCounts[UserRole.SELLER]})</TabsTrigger>
            <TabsTrigger value={UserRole.COURIER}>Курьеры ({userCounts[UserRole.COURIER]})</TabsTrigger>
            <TabsTrigger value={UserRole.ADMIN}>Админы ({userCounts[UserRole.ADMIN]})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-4 px-6">Пользователь</th>
                        <th className="text-left py-4 px-6">Телефон</th>
                        <th className="text-left py-4 px-6">Роль</th>
                        <th className="text-left py-4 px-6">Статус</th>
                                            <th className="text-left py-4 px-6">Дата регистрации</th>
                                            <th className="text-left py-4 px-6">Действия</th>
                                          </tr>
                                        </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const role = roleConfig[user.role];
                        return (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <span className="text-orange-500 font-semibold">
                                      {user.firstName?.[0] || user.phone[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {user.firstName || user.lastName
                                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                      : 'Без имени'}
                                  </p>
                                  {user.email && (
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">{user.phone}</td>
                            <td className="py-4 px-6">
                              <Badge className={role.color}>
                                {role.icon}
                                <span className="ml-1">{role.label}</span>
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                                {user.isVerified ? 'Подтвержден' : 'Не подтвержден'}
                              </Badge>
                            </td>
                                                      <td className="py-4 px-6 text-gray-500">
                                                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                                      </td>
                                                      <td className="py-4 px-6">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => openUserModal(user)}
                                                        >
                                                          <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                      </td>
                                                    </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Пользователи не найдены</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Управление пользователем</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-orange-500 font-semibold text-lg">
                        {selectedUser.firstName?.[0] || selectedUser.phone[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedUser.firstName || selectedUser.lastName
                        ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                        : 'Без имени'}
                    </p>
                    <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Роль:</strong> {roleConfig[selectedUser.role].label}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Статус:</strong> {selectedUser.isVerified ? 'Подтвержден' : 'Не подтвержден'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Дата регистрации:</strong> {new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!selectedUser.isVerified ? (
                  <Button
                    onClick={() => handleVerifyUser(selectedUser.id, true)}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Подтвердить пользователя
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleVerifyUser(selectedUser.id, false)}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Отменить подтверждение
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                  }}
                  className="w-full"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
