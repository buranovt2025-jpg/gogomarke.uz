import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, requestNotificationPermission } from '../../contexts/NotificationContext';
import { Bell, Check, Trash2, CheckCheck, Info, ShoppingBag, MessageCircle, UserPlus, Star, Package } from 'lucide-react';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, clearNotification, clearAll, fetchNotifications } = useNotifications();

  useEffect(() => {
    requestNotificationPermission();
    fetchNotifications();
  }, [fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
      case 'ORDER_CONFIRMED':
      case 'ORDER_PICKED_UP':
      case 'ORDER_DELIVERED':
      case 'ORDER_CANCELLED':
        return <ShoppingBag className="w-5 h-5 text-orange-500" />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'NEW_FOLLOWER':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'NEW_REVIEW':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'PAYMENT_RECEIVED':
        return <Package className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Уведомления</h1>
          {unreadCount > 0 && (
            <p className="text-gray-500">{unreadCount} непрочитанных</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Прочитать все
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить
            </button>
          )}
        </div>
      </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Загрузка уведомлений...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Уведомлений пока нет</p>
                <p className="text-gray-400 text-sm mt-2">
                  Здесь будут отображаться уведомления о заказах, акциях и других событиях
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                      notification.isRead ? 'border-gray-200' : 'border-orange-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                          {notification.body}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="Отметить как прочитанное"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => clearNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Push-уведомления</h3>
        <p className="text-sm text-blue-700 mb-3">
          Разрешите уведомления в браузере, чтобы получать мгновенные оповещения о статусе заказов
        </p>
        <button
          onClick={requestNotificationPermission}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Включить уведомления
        </button>
      </div>
    </div>
  );
}
