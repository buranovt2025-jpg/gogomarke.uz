import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, AlertTriangle, User } from 'lucide-react';
import api from '../../services/api';

interface Ticket {
  id: string;
  userId: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  adminNotes?: string;
  resolution?: string;
  user?: {
    firstName?: string;
    phone: string;
    role: string;
  };
}

const categoryLabels: Record<string, string> = {
  order: 'Заказ',
  payment: 'Оплата',
  delivery: 'Доставка',
  product: 'Товар',
  account: 'Аккаунт',
  technical: 'Техническая',
  other: 'Другое',
};

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.getAdminTickets(params);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      setSubmitting(true);
      const updateData: { status: string; resolution?: string; adminNotes?: string } = { status: newStatus };
      if (resolution) updateData.resolution = resolution;
      if (adminNotes) updateData.adminNotes = adminNotes;
      
      await api.updateTicket(ticketId, updateData);
      setSelectedTicket(null);
      setResolution('');
      setAdminNotes('');
      loadTickets();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Обращения в поддержку</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          Все
        </Button>
        <Button
          variant={statusFilter === 'open' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('open')}
        >
          Открытые
        </Button>
        <Button
          variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('in_progress')}
        >
          В работе
        </Button>
        <Button
          variant={statusFilter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('resolved')}
        >
          Решённые
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Нет обращений</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getStatusIcon(ticket.status)}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[ticket.status] || 'bg-gray-100'}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[ticket.priority] || 'bg-gray-100'}`}>
                        {priorityLabels[ticket.priority] || ticket.priority}
                      </span>
                      <span className="text-xs text-gray-400">
                        {categoryLabels[ticket.category] || ticket.category}
                      </span>
                    </div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <User className="w-4 h-4" />
                  <span>{ticket.user?.firstName || ticket.user?.phone || 'Пользователь'}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{ticket.user?.role}</span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>

                {ticket.adminNotes && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Заметки:</span> {ticket.adminNotes}
                    </p>
                  </div>
                )}

                {ticket.resolution && (
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Решение:</span> {ticket.resolution}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                  {ticket.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setAdminNotes(ticket.adminNotes || '');
                        setResolution(ticket.resolution || '');
                      }}
                    >
                      Управление
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Управление обращением</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Тема</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Описание</p>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Заметки администратора</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Внутренние заметки..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Решение (видно пользователю)</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Опишите решение проблемы..."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTicket(null);
                    setResolution('');
                    setAdminNotes('');
                  }}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                {selectedTicket.status === 'open' && (
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                    disabled={submitting}
                  >
                    Взять в работу
                  </Button>
                )}
                {selectedTicket.status !== 'resolved' && (
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    disabled={submitting}
                  >
                    Решено
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                  disabled={submitting}
                >
                  Закрыть
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
