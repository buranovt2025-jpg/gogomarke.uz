import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Upload, Image, Video, Package } from 'lucide-react';
import api from '../../services/api';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.getProducts() as { success: boolean; data: Product[] };
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaUrl) {
      setError('Добавьте ссылку на медиа');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createStory({
        mediaUrl,
        mediaType,
        caption: caption || undefined,
        productId: selectedProductId || undefined,
      });
      navigate('/seller');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать историю');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Создать историю</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-500" />
              Новая история
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Тип медиа</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      mediaType === 'image'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image className="w-5 h-5" />
                    <span>Фото</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      mediaType === 'video'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span>Видео</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ссылка на {mediaType === 'image' ? 'изображение' : 'видео'} *
                </label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={mediaType === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Загрузите медиа на хостинг и вставьте ссылку
                </p>
              </div>

              {mediaUrl && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">Предпросмотр:</p>
                  {mediaType === 'image' ? (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="max-h-64 rounded-lg mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      className="max-h-64 rounded-lg mx-auto"
                      controls
                      onError={(e) => {
                        (e.target as HTMLVideoElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Подпись (необязательно)</label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Добавьте подпись к истории..."
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Прикрепить товар (необязательно)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white"
                >
                  <option value="">Без товара</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - {product.price.toLocaleString()} сум
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Товар будет показан внизу истории с кнопкой "Купить"
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-800">
                  История будет доступна 24 часа с момента публикации
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading ? 'Публикация...' : 'Опубликовать историю'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
