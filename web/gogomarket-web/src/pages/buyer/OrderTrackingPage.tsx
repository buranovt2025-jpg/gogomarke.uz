import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';

const courierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  shippingCity: string;
  courier?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  items: Array<{
    product: {
      title: string;
      seller: {
        firstName: string;
        lastName: string;
      };
    };
    quantity: number;
  }>;
}

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

const generateMockRoute = (start: [number, number], end: [number, number], progress: number): [number, number] => {
  const lat = start[0] + (end[0] - start[0]) * progress;
  const lng = start[1] + (end[1] - start[1]) * progress;
  return [lat, lng];
};

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courierPosition, setCourierPosition] = useState<[number, number]>(TASHKENT_CENTER);
  const [progress, setProgress] = useState(0);

  const sellerLocation: [number, number] = [41.3111, 69.2797];
  const deliveryLocation: [number, number] = [41.2850, 69.2100];

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const response = await api.getOrder(orderId);
        if (response.success) {
          setOrder(response.data);
        } else {
          setError('Заказ не найден');
        }
      } catch (err) {
        setError('Ошибка загрузки заказа');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order || !['picked_up', 'in_transit'].includes(order.status)) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 0.02;
        if (newProgress >= 1) {
          clearInterval(interval);
          return 1;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  useEffect(() => {
    const newPosition = generateMockRoute(sellerLocation, deliveryLocation, progress);
    setCourierPosition(newPosition);
  }, [progress]);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтвержден продавцом',
      ready_for_pickup: 'Готов к забору',
      picked_up: 'Забран курьером',
      in_transit: 'В пути',
      delivered: 'Доставлен',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ready_for_pickup: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Заказ не найден'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="text-orange-500 hover:underline"
          >
            Вернуться к заказам
          </button>
        </div>
      </div>
    );
  }

  const showMap = ['picked_up', 'in_transit'].includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад к заказам
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Заказ #{order.orderNumber}</h1>
            <p className="text-gray-500">Отслеживание доставки</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>

        {order.courier && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Курьер</h3>
            <p className="text-gray-700">{order.courier.firstName} {order.courier.lastName}</p>
            <p className="text-gray-500">{order.courier.phone}</p>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2">Адрес доставки</h3>
          <p className="text-gray-700">{order.shippingCity}, {order.shippingAddress}</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2">Товары</h3>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between py-2">
              <span>{item.product.title} x{item.quantity}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 font-bold">
            Итого: {order.totalAmount.toLocaleString()} UZS
          </div>
        </div>
      </div>

      {showMap ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Местоположение курьера</h2>
            <p className="text-sm text-gray-500">
              Прогресс доставки: {Math.round(progress * 100)}%
            </p>
          </div>
          <div style={{ height: '400px' }}>
            <MapContainer
              center={TASHKENT_CENTER}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Marker position={sellerLocation} icon={sellerIcon}>
                <Popup>Точка забора (продавец)</Popup>
              </Marker>
              
              <Marker position={deliveryLocation} icon={destinationIcon}>
                <Popup>Адрес доставки</Popup>
              </Marker>
              
              <Marker position={courierPosition} icon={courierIcon}>
                <Popup>
                  Курьер: {order.courier?.firstName} {order.courier?.lastName}
                </Popup>
              </Marker>
              
              <Polyline
                positions={[sellerLocation, deliveryLocation]}
                color="blue"
                weight={3}
                opacity={0.5}
                dashArray="10, 10"
              />
              
              <Polyline
                positions={[sellerLocation, courierPosition]}
                color="orange"
                weight={4}
              />
            </MapContainer>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                <span>Продавец</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span>Курьер</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>Вы</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Карта недоступна</h3>
          <p className="text-gray-500">
            {order.status === 'pending' && 'Заказ ожидает подтверждения продавцом'}
            {order.status === 'confirmed' && 'Заказ подтвержден, ожидается назначение курьера'}
            {order.status === 'ready_for_pickup' && 'Курьер скоро заберет заказ'}
            {order.status === 'delivered' && 'Заказ доставлен'}
            {order.status === 'completed' && 'Заказ завершен'}
            {order.status === 'cancelled' && 'Заказ отменен'}
          </p>
        </div>
      )}

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">История статусов</h2>
        <div className="space-y-4">
          {['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'completed'].map((status, index) => {
            const isActive = ['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'completed'].indexOf(order.status) >= index;
            const isCurrent = order.status === status;
            
            return (
              <div key={status} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}>
                  {isActive ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span className={isActive ? 'font-medium' : 'text-gray-500'}>
                  {getStatusText(status)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
