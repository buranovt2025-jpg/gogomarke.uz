import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Upload, Image, Video, Package, Link, FileUp, X } from 'lucide-react';
import api from '../../services/api';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'story' | 'video'>('story');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Поддерживаются только изображения и видео');
      return;
    }

    // Set media type based on file
    setMediaType(isImage ? 'image' : 'video');
    setSelectedFile(file);
    setError('');

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const response = await api.uploadFile(selectedFile, mediaType === 'image' ? 'images' : 'videos') as { success: boolean; data: { url: string } };
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      throw new Error('Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Не удалось загрузить файл');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalMediaUrl = mediaUrl;

    // If file mode and file selected, upload first
    if (uploadMode === 'file') {
      if (!selectedFile) {
        setError('Выберите файл для загрузки');
        return;
      }
      const uploadedUrl = await uploadFile();
      if (!uploadedUrl) return;
      finalMediaUrl = uploadedUrl;
    } else {
      if (!mediaUrl) {
        setError('Добавьте ссылку на медиа');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (contentType === 'story') {
        await api.createStory({
          mediaUrl: finalMediaUrl,
          mediaType,
          caption: caption || undefined,
          productId: selectedProductId || undefined,
        });
      } else {
        // Create video/reel
        await api.createVideo({
          videoUrl: finalMediaUrl,
          title: title || caption || undefined,
          description: caption || undefined,
          productId: selectedProductId || undefined,
        });
      }
      navigate('/seller/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Не удалось создать ${contentType === 'story' ? 'историю' : 'видео'}`);
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
          <h1 className="text-xl font-bold">
            {contentType === 'story' ? 'Создать историю' : 'Создать видео'}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-500" />
              {contentType === 'story' ? 'Новая история' : 'Новое видео (Рилс)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Content type toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Тип контента</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setContentType('story')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      contentType === 'story'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image className="w-5 h-5" />
                    <div className="text-left">
                      <span className="block font-medium">История</span>
                      <span className="text-xs opacity-70">Исчезает через 24ч</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setContentType('video'); setMediaType('video'); }}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      contentType === 'video'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <div className="text-left">
                      <span className="block font-medium">Видео/Рилс</span>
                      <span className="text-xs opacity-70">Постоянно</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title for videos */}
              {contentType === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Название видео</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введите название видео"
                    maxLength={100}
                  />
                </div>
              )}

              {/* Upload mode toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Способ загрузки</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setUploadMode('file'); clearSelectedFile(); setMediaUrl(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      uploadMode === 'file'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileUp className="w-5 h-5" />
                    <span>Загрузить файл</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUploadMode('url'); clearSelectedFile(); }}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      uploadMode === 'url'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Link className="w-5 h-5" />
                    <span>Вставить ссылку</span>
                  </button>
                </div>
              </div>

              {/* File upload mode */}
              {uploadMode === 'file' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Выберите файл *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload className="w-10 h-10" />
                        <span className="font-medium">Нажмите для выбора файла</span>
                        <span className="text-sm">Фото или видео (до 50 МБ)</span>
                      </div>
                    </button>
                  ) : (
                    <div className="relative border rounded-lg p-4 bg-gray-50">
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-3 mb-3">
                        {mediaType === 'image' ? <Image className="w-6 h-6 text-orange-500" /> : <Video className="w-6 h-6 text-orange-500" />}
                        <div>
                          <p className="font-medium truncate max-w-xs">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} МБ</p>
                        </div>
                      </div>
                      {previewUrl && (
                        <div className="mt-2">
                          {mediaType === 'image' ? (
                            <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg mx-auto" />
                          ) : (
                            <video src={previewUrl} className="max-h-64 rounded-lg mx-auto" controls />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* URL input mode */}
              {uploadMode === 'url' && (
                <>
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
                    />
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
                </>
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
                  {contentType === 'story' 
                    ? 'История будет доступна 24 часа с момента публикации'
                    : 'Видео будет доступно постоянно в вашем профиле и ленте'}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading || uploading}
              >
                {uploading ? 'Загрузка файла...' : loading ? 'Публикация...' : contentType === 'story' ? 'Опубликовать историю' : 'Опубликовать видео'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
