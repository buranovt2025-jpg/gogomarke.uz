import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { ArrowLeft, Phone, MessageCircle, Package, Truck, CheckCircle, Clock, MapPin, Store, User, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/button';

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
      images?: string[];
      seller: {
        firstName: string;
        lastName: string;
      };
    };
    quantity: number;
    price: number;
  }>;
}

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

const generateMockRoute = (start: [number, number], end: [number, number], progress: number): [number, number] => {
  const lat = start[0] + (end[0] - start[0]) * progress;
  const lng = start[1] + (end[1] - start[1]) * progress;
  return [lat, lng];
};

// Loading skeleton
const TrackingSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="container mx-auto px-4 -mt-20">
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="h-6 bg-gray-200 rounded-full w-1/3" />
          <div className="h-4 bg-gray-200 rounded-full w-1/2" />
          <div className="flex gap-4">
            <div className="h-16 bg-gray-200 rounded-xl flex-1" />
            <div className="h-16 bg-gray-200 rounded-xl flex-1" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Status timeline step
const TimelineStep = ({ 
  status, 
  label, 
  description, 
  isActive, 
  isCompleted, 
  isCurrent,
  icon: Icon 
}: {
  status: string;
  label: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  icon: React.ElementType;
}) => (
  <div className="flex items-start gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : isCurrent 
            ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse' 
            : 'bg-gray-200 text-gray-400'
      }`}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
    </div>
    <div className="flex-1 pb-8">
      <p className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      )}
      {isCurrent && (
        <div className="mt-2 px-3 py-1.5 bg-orange-100 rounded-full inline-flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-xs text-orange-600 font-medium">Текущий статус</span>
        </div>
      )}
    </div>
  </div>
);

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

  const statusConfig: Record<string, { label: string; description: string; icon: React.ElementType }> = {
    pending: { label: 'Ожидает подтверждения', description: 'Продавец скоро подтвердит заказ', icon: Clock },
    confirmed: { label: 'Подтвержден продавцом', description: 'Товар готовится к отправке', icon: Package },
    ready_for_pickup: { label: 'Готов к забору', description: 'Курьер скоро заберет заказ', icon: Store },
    picked_up: { label: 'Забран курьером', description: 'Курьер забрал заказ у продавца', icon: Truck },
    in_transit: { label: 'В пути', description: 'Курьер доставляет заказ', icon: Navigation },
    delivered: { label: 'Доставлен', description: 'Заказ доставлен по адресу', icon: MapPin },
    completed: { label: 'Завершен', description: 'Заказ успешно завершен', icon: CheckCircle },
    cancelled: { label: 'Отменен', description: 'Заказ был отменен', icon: Clock },
  };

  const statusOrder = ['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'completed'];

  const getStatusIndex = (status: string) => statusOrder.indexOf(status);

  if (loading) {
    return <TrackingSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-red-400" />
        </div>
        <p className="text-xl font-semibold text-gray-900 mb-2">Заказ не найден</p>
        <p className="text-gray-500 mb-6">{error || 'Попробуйте еще раз'}</p>
        <Button
          onClick={() => navigate('/orders')}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Вернуться к заказам
        </Button>
      </div>
    );
  }

  const showMap = ['picked_up', 'in_transit'].includes(order.status);
  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header with map/status banner */}
      <div className="relative">
        {showMap ? (
          <div className="h-72 relative">
            <MapContainer
              center={TASHKENT_CENTER}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Tiled_web_map_numbering.png/320px-Tiled_web_map_numbering.png"
              />
              
              <Marker position={sellerLocation} icon={sellerIcon}>
                <Popup>
                  <div className="text-center">
                    <Store className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                    <p className="font-medium">Продавец</p>
                  </div>
                </Popup>
              </Marker>
              
              <Marker position={deliveryLocation} icon={destinationIcon}>
                <Popup>
                  <div className="text-center">
                    <MapPin className="w-5 h-5 mx-auto text-green-500 mb-1" />
                    <p className="font-medium">Ваш адрес</p>
                  </div>
                </Popup>
              </Marker>
              
              <Marker position={courierPosition} icon={courierIcon}>
                <Popup>
                  <div className="text-center">
                    <Truck className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <p className="font-medium">{order.courier?.firstName} {order.courier?.lastName}</p>
                    <p className="text-sm text-gray-500">Курьер</p>
                  </div>
                </Popup>
              </Marker>
              
              <Polyline
                positions={[sellerLocation, deliveryLocation]}
                color="#e5e7eb"
                weight={4}
                dashArray="10, 10"
              />
              
              <Polyline
                positions={[sellerLocation, courierPosition]}
                color="#f97316"
                weight={4}
              />
            </MapContainer>
            
            {/* Progress overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000]">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Курьер в пути</p>
                      <p className="text-sm text-gray-500">Примерно {Math.round((1 - progress) * 30)} мин</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-orange-500 to-orange-400 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/10 rounded-full" />
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
              <Package className="w-12 h-12 mb-3" />
              <p className="text-xl font-bold">Заказ #{order.orderNumber}</p>
              <p className="text-white/80 text-sm mt-1">{statusConfig[order.status]?.label}</p>
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate('/orders')}
          className="absolute top-4 left-4 z-[1001] w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        {/* Order status card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Заказ #{order.orderNumber}</h1>
                <p className="text-gray-500 text-sm mt-1">Отслеживание доставки</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'delivered' || order.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
              }`}>
                {statusConfig[order.status]?.label}
              </span>
            </div>
          </div>

          {/* Courier info */}
          {order.courier && (
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.courier.firstName} {order.courier.lastName}</p>
                    <p className="text-sm text-gray-500">Ваш курьер</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`tel:${order.courier.phone}`}
                    className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                  </a>
                  <button className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delivery address */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Адрес доставки</p>
                <p className="text-gray-600 mt-1">{order.shippingCity}, {order.shippingAddress}</p>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="p-6">
            <p className="font-semibold text-gray-900 mb-4">Товары в заказе</p>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.product.title}</p>
                    <p className="text-sm text-gray-500">{item.quantity} шт.</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="font-semibold text-gray-900">Итого</span>
              <span className="text-xl font-bold text-orange-500">{order.totalAmount.toLocaleString()} UZS</span>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">История статусов</h2>
          <div className="space-y-0">
            {statusOrder.slice(0, -1).map((status, index) => {
              const config = statusConfig[status];
              const isCompleted = currentStatusIndex > index;
              const isCurrent = currentStatusIndex === index;
              const isActive = currentStatusIndex >= index;
              
              return (
                <TimelineStep
                  key={status}
                  status={status}
                  label={config.label}
                  description={config.description}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  icon={config.icon}
                />
              );
            })}
          </div>
        </div>

        {/* Map legend (when map is shown) */}
        {showMap && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
            <p className="font-semibold text-gray-900 mb-3">Легенда карты</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="text-sm text-gray-600">Продавец</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Курьер</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Ваш адрес</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
