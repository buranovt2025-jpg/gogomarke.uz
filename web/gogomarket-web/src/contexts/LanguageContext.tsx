import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'uz' | 'en';

interface Translations {
  [key: string]: {
    ru: string;
    uz: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { ru: 'Главная', uz: 'Bosh sahifa', en: 'Home' },
  'nav.search': { ru: 'Поиск', uz: 'Qidiruv', en: 'Search' },
  'nav.orders': { ru: 'Заказы', uz: 'Buyurtmalar', en: 'Orders' },
  'nav.cart': { ru: 'Корзина', uz: 'Savat', en: 'Cart' },
  'nav.profile': { ru: 'Профиль', uz: 'Profil', en: 'Profile' },
  'nav.settings': { ru: 'Настройки', uz: 'Sozlamalar', en: 'Settings' },
  'nav.notifications': { ru: 'Уведомления', uz: 'Bildirishnomalar', en: 'Notifications' },
  'nav.favorites': { ru: 'Избранное', uz: 'Sevimlilar', en: 'Favorites' },
  'nav.chat': { ru: 'Чат', uz: 'Chat', en: 'Chat' },
  
  // Auth
  'auth.login': { ru: 'Войти', uz: 'Kirish', en: 'Login' },
  'auth.register': { ru: 'Регистрация', uz: 'Ro\'yxatdan o\'tish', en: 'Register' },
  'auth.logout': { ru: 'Выйти', uz: 'Chiqish', en: 'Logout' },
  'auth.phone': { ru: 'Телефон', uz: 'Telefon', en: 'Phone' },
  'auth.password': { ru: 'Пароль', uz: 'Parol', en: 'Password' },
  'auth.confirmPassword': { ru: 'Подтвердите пароль', uz: 'Parolni tasdiqlang', en: 'Confirm Password' },
  
  // Products
  'product.addToCart': { ru: 'В корзину', uz: 'Savatga', en: 'Add to Cart' },
  'product.buyNow': { ru: 'Купить сейчас', uz: 'Hozir sotib olish', en: 'Buy Now' },
  'product.price': { ru: 'Цена', uz: 'Narx', en: 'Price' },
  'product.description': { ru: 'Описание', uz: 'Tavsif', en: 'Description' },
  'product.reviews': { ru: 'Отзывы', uz: 'Sharhlar', en: 'Reviews' },
  'product.inStock': { ru: 'В наличии', uz: 'Mavjud', en: 'In Stock' },
  'product.outOfStock': { ru: 'Нет в наличии', uz: 'Mavjud emas', en: 'Out of Stock' },
  'product.share': { ru: 'Поделиться', uz: 'Ulashish', en: 'Share' },
  
  // Orders
  'order.status': { ru: 'Статус', uz: 'Holat', en: 'Status' },
  'order.pending': { ru: 'Ожидает', uz: 'Kutilmoqda', en: 'Pending' },
  'order.confirmed': { ru: 'Подтвержден', uz: 'Tasdiqlangan', en: 'Confirmed' },
  'order.shipped': { ru: 'Отправлен', uz: 'Jo\'natilgan', en: 'Shipped' },
  'order.delivered': { ru: 'Доставлен', uz: 'Yetkazilgan', en: 'Delivered' },
  'order.cancelled': { ru: 'Отменен', uz: 'Bekor qilingan', en: 'Cancelled' },
  'order.total': { ru: 'Итого', uz: 'Jami', en: 'Total' },
  'order.trackOrder': { ru: 'Отследить заказ', uz: 'Buyurtmani kuzatish', en: 'Track Order' },
  
  // Seller
  'seller.dashboard': { ru: 'Панель продавца', uz: 'Sotuvchi paneli', en: 'Seller Dashboard' },
  'seller.products': { ru: 'Мои товары', uz: 'Mening mahsulotlarim', en: 'My Products' },
  'seller.addProduct': { ru: 'Добавить товар', uz: 'Mahsulot qo\'shish', en: 'Add Product' },
  'seller.analytics': { ru: 'Аналитика', uz: 'Tahlil', en: 'Analytics' },
  'seller.earnings': { ru: 'Заработок', uz: 'Daromad', en: 'Earnings' },
  'seller.videos': { ru: 'Мои видео', uz: 'Mening videolarim', en: 'My Videos' },
  
  // Courier
  'courier.dashboard': { ru: 'Панель курьера', uz: 'Kuryer paneli', en: 'Courier Dashboard' },
  'courier.availableOrders': { ru: 'Доступные заказы', uz: 'Mavjud buyurtmalar', en: 'Available Orders' },
  'courier.myDeliveries': { ru: 'Мои доставки', uz: 'Mening yetkazishlarim', en: 'My Deliveries' },
  'courier.earnings': { ru: 'Заработок', uz: 'Daromad', en: 'Earnings' },
  'courier.withdraw': { ru: 'Вывести средства', uz: 'Mablag\'ni yechish', en: 'Withdraw' },
  
  // Admin
  'admin.dashboard': { ru: 'Админ панель', uz: 'Admin paneli', en: 'Admin Dashboard' },
  'admin.users': { ru: 'Пользователи', uz: 'Foydalanuvchilar', en: 'Users' },
  'admin.orders': { ru: 'Заказы', uz: 'Buyurtmalar', en: 'Orders' },
  'admin.products': { ru: 'Товары', uz: 'Mahsulotlar', en: 'Products' },
  'admin.reports': { ru: 'Жалобы', uz: 'Shikoyatlar', en: 'Reports' },
  'admin.disputes': { ru: 'Споры', uz: 'Nizolar', en: 'Disputes' },
  'admin.returns': { ru: 'Возвраты', uz: 'Qaytarishlar', en: 'Returns' },
  'admin.verify': { ru: 'Верифицировать', uz: 'Tasdiqlash', en: 'Verify' },
  'admin.broadcast': { ru: 'Рассылка', uz: 'Tarqatish', en: 'Broadcast' },
  
  // Common
  'common.save': { ru: 'Сохранить', uz: 'Saqlash', en: 'Save' },
  'common.cancel': { ru: 'Отмена', uz: 'Bekor qilish', en: 'Cancel' },
  'common.delete': { ru: 'Удалить', uz: 'O\'chirish', en: 'Delete' },
  'common.edit': { ru: 'Редактировать', uz: 'Tahrirlash', en: 'Edit' },
  'common.loading': { ru: 'Загрузка...', uz: 'Yuklanmoqda...', en: 'Loading...' },
  'common.error': { ru: 'Ошибка', uz: 'Xatolik', en: 'Error' },
  'common.success': { ru: 'Успешно', uz: 'Muvaffaqiyatli', en: 'Success' },
  'common.confirm': { ru: 'Подтвердить', uz: 'Tasdiqlash', en: 'Confirm' },
  'common.back': { ru: 'Назад', uz: 'Orqaga', en: 'Back' },
  'common.next': { ru: 'Далее', uz: 'Keyingi', en: 'Next' },
  'common.search': { ru: 'Поиск', uz: 'Qidirish', en: 'Search' },
  'common.filter': { ru: 'Фильтр', uz: 'Filtr', en: 'Filter' },
  'common.sort': { ru: 'Сортировка', uz: 'Saralash', en: 'Sort' },
  'common.all': { ru: 'Все', uz: 'Hammasi', en: 'All' },
  'common.noData': { ru: 'Нет данных', uz: 'Ma\'lumot yo\'q', en: 'No data' },
  
  // Settings
  'settings.language': { ru: 'Язык', uz: 'Til', en: 'Language' },
  'settings.theme': { ru: 'Тема', uz: 'Mavzu', en: 'Theme' },
  'settings.notifications': { ru: 'Уведомления', uz: 'Bildirishnomalar', en: 'Notifications' },
  'settings.privacy': { ru: 'Конфиденциальность', uz: 'Maxfiylik', en: 'Privacy' },
  'settings.help': { ru: 'Помощь', uz: 'Yordam', en: 'Help' },
  'settings.about': { ru: 'О приложении', uz: 'Ilova haqida', en: 'About' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ru';
  });

  const languages = [
    { code: 'ru' as Language, name: 'Русский' },
    { code: 'uz' as Language, name: 'O\'zbekcha' },
    { code: 'en' as Language, name: 'English' },
  ];

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language] || translation['ru'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { translations };
export type { Language };
