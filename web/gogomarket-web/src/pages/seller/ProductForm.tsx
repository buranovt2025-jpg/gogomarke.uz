import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, ArrowLeft, Plus, X } from 'lucide-react';

const categories = [
  { value: 'electronics', label: 'Электроника' },
  { value: 'clothing', label: 'Одежда' },
  { value: 'home', label: 'Дом и сад' },
  { value: 'beauty', label: 'Красота' },
  { value: 'sports', label: 'Спорт' },
  { value: 'food', label: 'Продукты' },
  { value: 'other', label: 'Другое' },
];

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('1');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await api.getProduct(id!) as { success: boolean; data: { product: Product } };
      if (response.success) {
        const product = response.data.product;
        setTitle(product.title);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setOriginalPrice(product.originalPrice?.toString() || '');
        setCategory(product.category || '');
        setStock(product.stock.toString());
        setImages(product.images || []);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Не удалось загрузить товар');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Укажите название товара');
      return;
    }

    if (!price || Number(price) <= 0) {
      setError('Укажите корректную цену');
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category: category || undefined,
        stock: Number(stock) || 1,
        images: images.length > 0 ? images : undefined,
      };

      if (isEditing) {
        await api.updateProduct(id!, data);
      } else {
        await api.createProduct(data);
      }

      navigate('/seller/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения товара');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/seller/products')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к товарам
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Редактировать товар' : 'Новый товар'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Название *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название товара"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите товар подробнее"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Цена (сум) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Старая цена (сум)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Количество</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="1"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Изображения</Label>
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="URL изображения"
                  />
                  <Button type="button" variant="outline" onClick={handleAddImage}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/seller/products')}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
