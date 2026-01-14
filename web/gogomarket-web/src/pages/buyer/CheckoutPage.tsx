import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentMethod } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Loader2, CreditCard, Banknote, CheckCircle, Tag, X, MapPin, Phone, User, Truck, ShieldCheck, Package, ArrowLeft, AlertCircle } from 'lucide-react';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Number(price)) + ' сум';
}

const COURIER_FEE = 15000;

// Progress Steps Component
const CheckoutProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: 'Контакты', icon: User },
    { id: 2, label: 'Доставка', icon: MapPin },
    { id: 3, label: 'Оплата', icon: CreditCard },
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-orange-500 text-white ring-4 ring-orange-100' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-sm mt-2 font-medium ${
                isCurrent ? 'text-orange-500' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Form Field with enhanced states
const FormField = ({ 
  label, 
  error, 
  success,
  children 
}: { 
  label: string; 
  error?: string; 
  success?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className={`text-sm font-medium ${error ? 'text-red-500' : success ? 'text-green-600' : 'text-gray-700'}`}>
      {label}
    </Label>
    {children}
    {error && (
      <p className="text-red-500 text-xs flex items-center gap-1 animate-shake">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// Success Screen Component
const SuccessScreen = ({ orderNumber, paymentMethod, onGoToOrders, onGoHome }: {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  onGoToOrders: () => void;
  onGoHome: () => void;
}) => (
  <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16">
    <div className="container mx-auto px-4 max-w-md text-center">
      <div className="relative">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-green-200/50 rounded-full animate-ping-slow" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Заказ оформлен!</h1>
      <p className="text-gray-500 mb-2">Номер заказа:</p>
      <p className="text-2xl font-bold text-orange-500 mb-6">{orderNumber}</p>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 text-left">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            {paymentMethod === PaymentMethod.CASH ? (
              <Banknote className="w-5 h-5 text-orange-500" />
            ) : (
              <CreditCard className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {paymentMethod === PaymentMethod.CASH ? 'Оплата при получении' : 'Онлайн оплата'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {paymentMethod === PaymentMethod.CASH
                ? 'Курьер свяжется с вами для уточнения времени доставки.'
                : 'Ожидайте подтверждения оплаты. Курьер свяжется с вами после оплаты.'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onGoToOrders} className="flex-1 h-12 rounded-xl">
          Мои заказы
        </Button>
        <Button className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600" onClick={onGoHome}>
          На главную
        </Button>
      </div>
    </div>
  </div>
);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ташкент');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Validation logic
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'phone':
        if (!value.trim()) return 'Укажите номер телефона';
        if (!/^\+998[0-9]{9}$/.test(value)) return 'Формат: +998XXXXXXXXX';
        return '';
      case 'city':
        if (!value.trim() || value.trim().length < 2) return 'Укажите город';
        return '';
      case 'address':
        if (!value.trim()) return 'Укажите адрес';
        if (value.trim().length < 10) return 'Адрес должен содержать минимум 10 символов';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  // Calculate if step is valid
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !validateField('phone', phone);
      case 2:
        return !validateField('city', city) && !validateField('address', address);
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, phone, city, address]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
  
    setCouponError('');
    setValidatingCoupon(true);
  
    try {
      const response = await api.validateCoupon(couponCode, totalAmount) as { 
        success: boolean; 
        data?: { discount: number }; 
        error?: string 
      };
    
      if (response.success && response.data) {
        setCouponDiscount(response.data.discount);
        setCouponApplied(true);
      } else {
        setCouponError('Недействительный купон');
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Ошибка проверки купона');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
  };

  const handleNextStep = () => {
    if (isStepValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const phoneError = validateField('phone', phone);
    const cityError = validateField('city', city);
    const addressError = validateField('address', address);

    if (phoneError || cityError || addressError) {
      setErrors({ phone: phoneError, city: cityError, address: addressError });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.createOrderFromCart(
        items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        address,
        city,
        phone,
        paymentMethod,
      ) as { success: boolean; data: { orders: Array<{ success: boolean; data: { orderNumber: string } }> } };

      if (response.success && response.data.orders.length > 0) {
        const firstOrder = response.data.orders[0] as unknown as { success: boolean; data: { orderNumber: string } };
        setOrderNumber(firstOrder.data?.orderNumber || 'Заказ создан');
        setOrderCreated(true);
        clearCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания заказа');
    } finally {
      setIsLoading(false);
    }
  };

  if (orderCreated) {
    return (
      <SuccessScreen 
        orderNumber={orderNumber}
        paymentMethod={paymentMethod}
        onGoToOrders={() => navigate('/orders')}
        onGoHome={() => navigate('/')}
      />
    );
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Оформление заказа</h1>
        </div>

        {/* Progress indicator */}
        <CheckoutProgress currentStep={currentStep} />

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Error alert */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Ошибка</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Contact Info */}
              <Card className={`transition-all duration-300 ${currentStep === 1 ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep > 1 ? 'bg-green-500' : currentStep === 1 ? 'bg-orange-500' : 'bg-gray-200'
                    }`}>
                      {currentStep > 1 ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <CardTitle>Контактные данные</CardTitle>
                  </div>
                  {currentStep !== 1 && (
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(1)}
                      className="text-sm text-orange-500 hover:underline"
                    >
                      Изменить
                    </button>
                  )}
                </CardHeader>
                {currentStep === 1 && (
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField label="Имя">
                        <Input 
                          value={user?.firstName || ''} 
                          disabled 
                          className="bg-gray-50 border-gray-200"
                        />
                      </FormField>
                      <FormField 
                        label="Телефон для доставки *" 
                        error={touched.phone ? errors.phone : undefined}
                        success={touched.phone && !errors.phone && phone.length > 0}
                      >
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            onBlur={() => handleBlur('phone', phone)}
                            placeholder="+998901234567"
                            className={`pl-10 transition-all ${
                              touched.phone && errors.phone 
                                ? 'border-red-500 focus:ring-red-500' 
                                : touched.phone && !errors.phone && phone.length > 0
                                  ? 'border-green-500 focus:ring-green-500'
                                  : 'focus:ring-orange-500'
                            }`}
                          />
                          {touched.phone && !errors.phone && phone.length > 0 && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </FormField>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button 
                        type="button" 
                        onClick={handleNextStep}
                        disabled={!isStepValid}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Далее
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Step 2: Delivery Address */}
              <Card className={`transition-all duration-300 ${currentStep === 2 ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep > 2 ? 'bg-green-500' : currentStep === 2 ? 'bg-orange-500' : 'bg-gray-200'
                    }`}>
                      {currentStep > 2 ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <MapPin className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <CardTitle>Адрес доставки</CardTitle>
                  </div>
                  {currentStep !== 2 && currentStep > 2 && (
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(2)}
                      className="text-sm text-orange-500 hover:underline"
                    >
                      Изменить
                    </button>
                  )}
                </CardHeader>
                {currentStep === 2 && (
                  <CardContent className="space-y-4">
                    <FormField 
                      label="Город *"
                      error={touched.city ? errors.city : undefined}
                      success={touched.city && !errors.city && city.length > 0}
                    >
                      <Input 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                        onBlur={() => handleBlur('city', city)}
                        placeholder="Ташкент"
                        className={`transition-all ${
                          touched.city && errors.city 
                            ? 'border-red-500 focus:ring-red-500' 
                            : touched.city && !errors.city && city.length > 0
                              ? 'border-green-500 focus:ring-green-500'
                              : 'focus:ring-orange-500'
                        }`}
                      />
                    </FormField>
                    <FormField 
                      label="Адрес *"
                      error={touched.address ? errors.address : undefined}
                      success={touched.address && !errors.address && address.length > 0}
                    >
                      <Textarea
                        placeholder="Укажите полный адрес: улица, дом, квартира, подъезд, этаж"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onBlur={() => handleBlur('address', address)}
                        rows={3}
                        className={`transition-all resize-none ${
                          touched.address && errors.address 
                            ? 'border-red-500 focus:ring-red-500' 
                            : touched.address && !errors.address && address.length > 0
                              ? 'border-green-500 focus:ring-green-500'
                              : 'focus:ring-orange-500'
                        }`}
                      />
                    </FormField>
                    <div className="flex justify-between pt-2">
                      <Button type="button" variant="outline" onClick={handlePrevStep}>
                        Назад
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleNextStep}
                        disabled={!isStepValid}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Далее
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Step 3: Payment Method */}
              <Card className={`transition-all duration-300 ${currentStep === 3 ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === 3 ? 'bg-orange-500' : 'bg-gray-200'
                    }`}>
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle>Способ оплаты</CardTitle>
                  </div>
                </CardHeader>
                {currentStep === 3 && (
                  <CardContent>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                      <div className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        paymentMethod === PaymentMethod.CASH 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                        <RadioGroupItem value={PaymentMethod.CASH} id="cash" />
                        <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Наличными при получении</p>
                            <p className="text-sm text-gray-500">Оплата курьеру</p>
                          </div>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all mt-3 ${
                        paymentMethod === PaymentMethod.CARD 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                        <RadioGroupItem value={PaymentMethod.CARD} id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Картой онлайн</p>
                            <p className="text-sm text-gray-500">Payme / Click</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={handlePrevStep}>
                        Назад
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-600" />
                  </div>
                  <CardTitle>Товары в заказе</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product.title}</p>
                        <p className="text-sm text-gray-500">{item.quantity} шт.</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Coupon Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="w-5 h-5 text-orange-500" />
                    Промокод
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div>
                        <p className="font-medium text-green-700">{couponCode}</p>
                        <p className="text-sm text-green-600">Скидка: -{formatPrice(couponDiscount)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите промокод"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className="px-4"
                        >
                          {validatingCoupon ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'ОК'
                          )}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="sticky top-4 shadow-lg">
                <CardHeader>
                  <CardTitle>Итого</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Товары ({items.length})</span>
                    <span className="font-medium">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Доставка
                    </span>
                    <span className="font-medium">{formatPrice(COURIER_FEE)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Скидка по купону</span>
                      <span className="font-medium">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>К оплате</span>
                      <span className="text-orange-500">{formatPrice(totalAmount + COURIER_FEE - couponDiscount)}</span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 h-12 rounded-xl shadow-lg shadow-orange-200 mt-4"
                    size="lg"
                    disabled={isLoading || currentStep !== 3}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {currentStep !== 3 ? 'Заполните все данные' : 'Подтвердить заказ'}
                  </Button>
                  
                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t mt-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Безопасно
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Truck className="w-4 h-4 text-blue-500" />
                      Быстрая доставка
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes ping-slow {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        .animate-ping-slow {
          animation: ping-slow 1.5s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
