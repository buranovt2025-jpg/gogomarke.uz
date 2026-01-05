import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, RotateCcw, ArrowLeft } from 'lucide-react';

const returnReasons = [
  { value: 'defective', label: 'Бракованный товар' },
  { value: 'wrong_item', label: 'Неправильный товар' },
  { value: 'not_as_described', label: 'Не соответствует описанию' },
  { value: 'changed_mind', label: 'Передумал' },
  { value: 'damaged', label: 'Поврежден при доставке' },
  { value: 'other', label: 'Другое' },
];

export default function CreateReturnPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Выберите причину возврата');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Опишите причину возврата подробнее (минимум 10 символов)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.createReturn({
        orderId: orderId!,
        reason,
        description,
      }) as { success: boolean; error?: string };

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Ошибка создания запроса на возврат');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания запроса на возврат');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Запрос отправлен!</h1>
          <p className="text-gray-600 mb-8">
            Ваш запрос на возврат отправлен продавцу. Мы уведомим вас о решении.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/returns')}>
              Мои возвраты
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/orders')}>
              К заказам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Запрос на возврат
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="text-base font-medium mb-3 block">Причина возврата *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {returnReasons.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        reason === r.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание проблемы *</Label>
                <Textarea
                  id="description"
                  placeholder="Опишите подробно причину возврата..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Важно:</strong> После одобрения возврата вам нужно будет отправить товар обратно продавцу. 
                  Возврат средств будет выполнен после получения товара.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                size="lg"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Отправить запрос
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
