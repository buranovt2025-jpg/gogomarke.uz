import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
  };
}

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  in_review: 'На рассмотрении',
  resolved: 'Решен',
  closed: 'Закрыт',
};

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const reasonLabels: Record<string, string> = {
  not_received: 'Не получен',
  wrong_item: 'Неверный товар',
  damaged: 'Поврежден',
  quality: 'Качество',
  incomplete: 'Неполный заказ',
  other: 'Другое',
};

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params: { status?: string } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.getDisputes(params) as { success?: boolean; data?: Dispute[] };
      if (response.success) {
        setDisputes(response.data || []);
      } else {
        setError('Ошибка загрузки споров');
      }
    } catch (err) {
      setError('Ошибка загрузки споров');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDispute || !newStatus) return;

    try {
      setUpdating(true);
      const response = await api.updateDisputeStatus(selectedDispute.id, newStatus, resolution || undefined) as { success?: boolean };
      if (response.success) {
        setSelectedDispute(null);
        setResolution('');
        setNewStatus('');
        fetchDisputes();
      } else {
        alert('Ошибка обновления статуса');
      }
    } catch (err) {
      alert('Ошибка обновления статуса');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Управление спорами</h1>
          <p className="text-gray-500">Всего споров: {disputes.length}</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="text-gray-600 hover:text-gray-900"
        >
          Назад к панели
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'in_review', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Все' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">Споров не найдено</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Спор #{dispute.id.slice(0, 8)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[dispute.status]}`}>
                      {statusLabels[dispute.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Создан: {formatDate(dispute.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDispute(dispute);
                    setNewStatus(dispute.status);
                    setResolution(dispute.resolution || '');
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                >
                  Управлять
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Заказ</h4>
                  <p className="font-semibold">#{dispute.order?.orderNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {dispute.order?.totalAmount?.toLocaleString() || 0} UZS
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Заявитель</h4>
                  <p className="font-semibold">
                    {dispute.reporter?.firstName} {dispute.reporter?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{dispute.reporter?.phone}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500">Причина: </span>
                  <span className="text-sm">{reasonLabels[dispute.reason] || dispute.reason}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500">Описание: </span>
                  <p className="text-sm text-gray-700 mt-1">{dispute.description}</p>
                </div>
                {dispute.resolution && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-green-700">Решение: </span>
                    <p className="text-sm text-green-800 mt-1">{dispute.resolution}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Управление спором</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Спор #{selectedDispute.id.slice(0, 8)}</p>
              <p className="font-medium">{reasonLabels[selectedDispute.reason]}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="open">Открыт</option>
                <option value="in_review">На рассмотрении</option>
                <option value="resolved">Решен</option>
                <option value="closed">Закрыт</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Решение / Комментарий
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Опишите принятое решение..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedDispute(null);
                  setResolution('');
                  setNewStatus('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {updating ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
