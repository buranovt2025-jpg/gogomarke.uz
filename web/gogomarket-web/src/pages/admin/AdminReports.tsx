import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, User, Package, Video, MessageSquare, Star } from 'lucide-react';
import api from '../../services/api';

interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  reporter?: {
    firstName?: string;
    phone: string;
  };
}

const typeLabels: Record<string, string> = {
  product: 'Товар',
  video: 'Видео',
  review: 'Отзыв',
  comment: 'Комментарий',
  user: 'Пользователь',
};

const typeIcons: Record<string, React.ReactNode> = {
  product: <Package className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  review: <Star className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  user: <User className="w-4 h-4" />,
};

const reasonLabels: Record<string, string> = {
  spam: 'Спам',
  inappropriate: 'Неприемлемый контент',
  fake: 'Подделка/Мошенничество',
  copyright: 'Нарушение авторских прав',
  violence: 'Насилие',
  harassment: 'Оскорбления',
  other: 'Другое',
};

const statusLabels: Record<string, string> = {
  pending: 'На рассмотрении',
  reviewed: 'Рассмотрено',
  resolved: 'Решено',
  dismissed: 'Отклонено',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [statusFilter, typeFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params: { status?: string; targetType?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.targetType = typeFilter;
      const data = await api.getAdminReports(params);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      setSubmitting(true);
      const updateData: { status: string; adminNotes?: string } = { status: newStatus };
      if (adminNotes) updateData.adminNotes = adminNotes;
      
      await api.updateReport(reportId, updateData);
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } catch (error) {
      console.error('Failed to update report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'reviewed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Flag className="w-4 h-4 text-yellow-500" />;
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
        <h1 className="text-xl font-bold">Жалобы на контент</h1>
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
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          На рассмотрении
        </Button>
        <Button
          variant={statusFilter === 'reviewed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('reviewed')}
        >
          Рассмотрено
        </Button>
        <Button
          variant={statusFilter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('resolved')}
        >
          Решено
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={typeFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('')}
        >
          Все типы
        </Button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={typeFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Нет жалоб</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getStatusIcon(report.status)}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[report.status] || 'bg-gray-100'}`}>
                        {statusLabels[report.status] || report.status}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                        {typeIcons[report.targetType]}
                        {typeLabels[report.targetType] || report.targetType}
                      </span>
                    </div>
                    <h3 className="font-medium text-red-600">
                      {reasonLabels[report.reason] || report.reason}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <User className="w-4 h-4" />
                  <span>Автор жалобы: {report.reporter?.firstName || report.reporter?.phone || 'Пользователь'}</span>
                </div>

                {report.description && (
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                )}

                <p className="text-xs text-gray-400 mb-2">
                  ID объекта: {report.targetId}
                </p>

                {report.adminNotes && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Заметки:</span> {report.adminNotes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                  {report.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setAdminNotes(report.adminNotes || '');
                      }}
                    >
                      Рассмотреть
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Рассмотрение жалобы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Тип</p>
                <p className="font-medium flex items-center gap-2">
                  {typeIcons[selectedReport.targetType]}
                  {typeLabels[selectedReport.targetType] || selectedReport.targetType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Причина</p>
                <p className="font-medium text-red-600">{reasonLabels[selectedReport.reason] || selectedReport.reason}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <p className="text-sm text-gray-500">Описание</p>
                  <p className="text-sm">{selectedReport.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">ID объекта</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedReport.targetId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Заметки администратора</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Опишите принятые меры..."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReport(null);
                    setAdminNotes('');
                  }}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')}
                  disabled={submitting}
                >
                  Рассмотрено
                </Button>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  disabled={submitting}
                >
                  Решено (удалить контент)
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                  disabled={submitting}
                >
                  Отклонить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
