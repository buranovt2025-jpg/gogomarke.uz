import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const categories = [
  { value: 'order', label: 'Проблема с заказом' },
  { value: 'payment', label: 'Вопрос по оплате' },
  { value: 'delivery', label: 'Проблема с доставкой' },
  { value: 'product', label: 'Вопрос о товаре' },
  { value: 'account', label: 'Проблема с аккаунтом' },
  { value: 'technical', label: 'Техническая проблема' },
  { value: 'other', label: 'Другое' },
];

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      setError('Выберите категорию');
      return;
    }
    if (!subject.trim()) {
      setError('Введите тему обращения');
      return;
    }
    if (description.trim().length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
      });
      navigate('/support');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError('Не удалось создать обращение. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Новое обращение</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Опишите вашу проблему</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Категория *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg p-3"
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Тема *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Кратко опишите проблему"
                className="w-full border rounded-lg p-3"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Описание *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробно опишите вашу проблему или вопрос..."
                className="w-full border rounded-lg p-3 min-h-[150px]"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Минимум 10 символов
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={submitting}
            >
              {submitting ? (
                'Отправка...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Полезная информация</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Обычно мы отвечаем в течение 24 часов</li>
          <li>• Укажите номер заказа, если вопрос связан с заказом</li>
          <li>• Приложите скриншоты, если это поможет решить проблему</li>
        </ul>
      </div>
    </div>
  );
}
