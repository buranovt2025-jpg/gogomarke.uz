import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Camera, QrCode, CheckCircle, Upload, X, Package, MapPin, Phone, User } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPhone: string;
  courierFee: number;
  product?: {
    title: string;
    images?: string[];
  };
  buyer?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
  };
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

export default function CourierScanPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrData, setQrData] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'pickup' | 'deliver'>('pickup');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await api.getOrder(orderId!) as { success: boolean; data: Order };
      if (response.success) {
        setOrder(response.data);
        // Determine mode based on order status
        if (response.data.status === 'confirmed' || response.data.status === 'ready_for_pickup') {
          setMode('pickup');
        } else if (response.data.status === 'picked_up' || response.data.status === 'in_transit') {
          setMode('deliver');
        }
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      setError('Не удалось загрузить заказ');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const clearPhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handlePickup = async () => {
    if (!qrData.trim()) {
      setError('Введите данные QR-кода');
      return;
    }

    if (!photo) {
      setError('Фото обязательно при получении товара');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.scanPickupQrWithPhoto(orderId!, qrData.trim(), photo) as { success: boolean; error?: string };
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/courier');
        }, 2000);
      } else {
        setError(response.error || 'Не удалось подтвердить получение');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliver = async () => {
    if (!qrData.trim() && !deliveryCode.trim()) {
      setError('Введите QR-код или код доставки');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.confirmDelivery(orderId!, {
        qrData: qrData.trim() || undefined,
        deliveryCode: deliveryCode.trim() || undefined,
      }) as { success: boolean; error?: string };
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/courier');
        }, 2000);
      } else {
        setError(response.error || 'Не удалось подтвердить доставку');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'pickup' ? 'Товар получен!' : 'Доставка подтверждена!'}
            </h2>
            <p className="text-gray-500">
              {mode === 'pickup' 
                ? 'Теперь доставьте товар покупателю'
                : 'Заказ успешно доставлен'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/courier" className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">
            {mode === 'pickup' ? 'Получение товара' : 'Подтверждение доставки'}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Order Info */}
        {order && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Заказ #{order.orderNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{order.product?.title}</p>
              
              {mode === 'pickup' && order.seller && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-blue-800">Забрать у продавца:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{order.seller.firstName} {order.seller.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <a href={`tel:${order.seller.phone}`} className="text-blue-600">{order.seller.phone}</a>
                  </div>
                </div>
              )}

              {mode === 'deliver' && (
                <div className="bg-green-50 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-green-800">Доставить покупателю:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-green-600" />
                    <span>{order.buyer?.firstName} {order.buyer?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>{order.shippingAddress}, {order.shippingCity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-green-600" />
                    <a href={`tel:${order.shippingPhone}`} className="text-green-600">{order.shippingPhone}</a>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">Ваш заработок</p>
                <p className="text-xl font-bold text-green-600">{formatPrice(order.courierFee)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'pickup' ? 'default' : 'outline'}
            className={mode === 'pickup' ? 'bg-orange-500 hover:bg-orange-600 flex-1' : 'flex-1'}
            onClick={() => setMode('pickup')}
          >
            Получение
          </Button>
          <Button
            variant={mode === 'deliver' ? 'default' : 'outline'}
            className={mode === 'deliver' ? 'bg-orange-500 hover:bg-orange-600 flex-1' : 'flex-1'}
            onClick={() => setMode('deliver')}
          >
            Доставка
          </Button>
        </div>

        {/* QR/Code Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-500" />
              {mode === 'pickup' ? 'QR-код продавца' : 'Подтверждение доставки'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {mode === 'pickup' ? 'Данные QR-кода *' : 'QR-код или код доставки'}
              </label>
              <Input
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Введите или отсканируйте QR-код"
              />
            </div>

            {mode === 'deliver' && (
              <div>
                <label className="block text-sm font-medium mb-2">Код доставки (6 цифр)</label>
                <Input
                  value={deliveryCode}
                  onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Покупатель должен назвать вам этот код
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Upload (Required for Pickup) */}
        {mode === 'pickup' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                Фото при получении *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {!photo ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-orange-600">
                      <Camera className="w-10 h-10" />
                      <span className="font-medium">Сделать фото</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Выбрать из галереи</span>
                  </button>
                  <p className="text-sm text-gray-500 text-center">
                    Сфотографируйте товар при получении у продавца
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <p className="text-sm text-green-600 text-center mt-2">
                    Фото загружено
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={mode === 'pickup' ? handlePickup : handleDeliver}
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 py-6 text-lg"
        >
          {isSubmitting 
            ? 'Отправка...' 
            : mode === 'pickup' 
              ? 'Подтвердить получение' 
              : 'Подтвердить доставку'
          }
        </Button>
      </div>
    </div>
  );
}
