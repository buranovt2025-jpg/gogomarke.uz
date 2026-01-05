import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { X, Flag, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'product' | 'video' | 'review' | 'comment' | 'user';
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'inappropriate', label: 'Неприемлемый контент' },
  { value: 'fake', label: 'Подделка / Мошенничество' },
  { value: 'copyright', label: 'Нарушение авторских прав' },
  { value: 'violence', label: 'Насилие' },
  { value: 'harassment', label: 'Оскорбления / Травля' },
  { value: 'other', label: 'Другое' },
];

const TARGET_TYPE_LABELS: Record<string, string> = {
  product: 'товар',
  video: 'видео',
  review: 'отзыв',
  comment: 'комментарий',
  user: 'пользователя',
};

export default function ReportDialog({ isOpen, onClose, targetType, targetId, targetTitle }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Выберите причину жалобы');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createReport({
        targetType,
        targetId,
        reason,
        description: description || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить жалобу');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Пожаловаться на {TARGET_TYPE_LABELS[targetType]}
          </CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-green-600">Жалоба отправлена</h3>
              <p className="text-gray-500 mt-2">Спасибо! Мы рассмотрим вашу жалобу.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {targetTitle && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Вы жалуетесь на:</p>
                  <p className="font-medium truncate">{targetTitle}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Причина жалобы *</label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={(e) => setReason(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          reason === r.value ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {reason === r.value && (
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Дополнительная информация (необязательно)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите проблему подробнее..."
                  className="h-20"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={loading}
                >
                  {loading ? 'Отправка...' : 'Отправить жалобу'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
