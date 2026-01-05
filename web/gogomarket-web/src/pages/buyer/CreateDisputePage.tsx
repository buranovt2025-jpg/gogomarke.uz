import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';

const disputeReasons = [
  { value: 'not_received', label: 'Товар не получен' },
  { value: 'wrong_item', label: 'Получен не тот товар' },
  { value: 'damaged', label: 'Товар поврежден' },
  { value: 'quality', label: 'Качество не соответствует описанию' },
  { value: 'incomplete', label: 'Заказ неполный' },
  { value: 'other', label: 'Другое' },
];

export default function CreateDisputePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      setError('Не удалось загрузить заказ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Выберите причину спора');
      return;
    }

    if (!description.trim()) {
      setError('Опишите проблему подробнее');
      return;
    }

    setIsSubmitting(true);

    try {
      const reasonLabel = disputeReasons.find(r => r.value === reason)?.label || reason;
      await api.createDispute({
        orderId: orderId!,
        reason: reasonLabel,
        description: description.trim(),
      });
      navigate('/disputes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать спор');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/orders`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Открыть спор</h1>
        </div>

        {order && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900">Заказ #{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">
                    Сумма: {new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} сум
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Опишите проблему</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Причина спора *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите причину" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeReasons.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание проблемы *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите проблему подробнее. Что произошло? Какой результат вы ожидали?"
                  rows={5}
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Важно:</strong> После открытия спора заказ будет заморожен до его разрешения. 
                  Наша команда рассмотрит ваше обращение в течение 24-48 часов.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/orders')}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Открыть спор
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
