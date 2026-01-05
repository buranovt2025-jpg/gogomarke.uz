import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Plus, MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface Ticket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolution?: string;
}

const categoryLabels: Record<string, string> = {
  order: 'Заказ',
  payment: 'Оплата',
  delivery: 'Доставка',
  product: 'Товар',
  account: 'Аккаунт',
  technical: 'Техническая проблема',
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

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getTickets();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Поддержка</h1>
        </div>
        <Link to="/support/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Новый запрос
          </Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">У вас нет обращений в поддержку</p>
            <Link to="/support/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Создать обращение
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(ticket.status)}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[ticket.status] || 'bg-gray-100'}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {categoryLabels[ticket.category] || ticket.category}
                      </span>
                    </div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

                {ticket.resolution && (
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Решение:</span> {ticket.resolution}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  {new Date(ticket.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
