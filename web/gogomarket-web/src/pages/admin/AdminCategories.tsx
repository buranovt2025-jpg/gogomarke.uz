import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { api } from '../../services/api';

interface Category {
  name: string;
  productCount: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const productsResponse = await api.getProducts({ limit: 1000 });
      const products = productsResponse.data || [];
      
      const categoryMap = new Map<string, number>();
      products.forEach((product: { category: string }) => {
        const count = categoryMap.get(product.category) || 0;
        categoryMap.set(product.category, count + 1);
      });

      const categoriesArray: Category[] = Array.from(categoryMap.entries()).map(([name, productCount]) => ({
        name,
        productCount,
      }));

      categoriesArray.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const exists = categories.some(c => c.name.toLowerCase() === newCategory.toLowerCase());
    if (exists) {
      alert('Категория уже существует');
      return;
    }

    setCategories([...categories, { name: newCategory.trim(), productCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    setNewCategory('');
  };

  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setEditValue(oldName);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim() || !editingCategory) return;
    
    const exists = categories.some(c => c.name.toLowerCase() === editValue.toLowerCase() && c.name !== editingCategory);
    if (exists) {
      alert('Категория с таким именем уже существует');
      return;
    }

    setCategories(categories.map(c => 
      c.name === editingCategory ? { ...c, name: editValue.trim() } : c
    ).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingCategory(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const handleDeleteCategory = (name: string) => {
    const category = categories.find(c => c.name === name);
    if (category && category.productCount > 0) {
      alert(`Невозможно удалить категорию "${name}" - в ней ${category.productCount} товаров`);
      return;
    }
    
    if (confirm(`Удалить категорию "${name}"?`)) {
      setCategories(categories.filter(c => c.name !== name));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Управление категориями</h1>
        <span className="text-gray-500">Всего: {categories.length}</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Добавить категорию</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Название категории"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Товаров
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Категории не найдены
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingCategory === category.name ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {category.productCount}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingCategory === category.name ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category.name)}>
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCategory(category.name)}
                          disabled={category.productCount > 0}
                        >
                          <Trash2 className={`w-4 h-4 ${category.productCount > 0 ? 'text-gray-300' : 'text-red-600'}`} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Примечание:</strong> Категории создаются автоматически при добавлении товаров. 
          Здесь вы можете просмотреть существующие категории и их статистику. 
          Удалить можно только пустые категории (без товаров).
        </p>
      </div>
    </div>
  );
}
