import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
        'en': {
          'app_name': 'GoGoMarket',
          'welcome': 'Welcome',
          'login': 'Login',
          'register': 'Register',
          'email': 'Email',
          'password': 'Password',
          'phone': 'Phone Number',
          'forgot_password': 'Forgot Password?',
          'dont_have_account': "Don't have an account?",
          'already_have_account': 'Already have an account?',
          'sign_up': 'Sign Up',
          'sign_in': 'Sign In',
          'home': 'Home',
          'search': 'Search',
          'search_products': 'Search products...',
          'cart': 'Cart',
          'orders': 'Orders',
          'profile': 'Profile',
          'settings': 'Settings',
          'logout': 'Logout',
          'add_to_cart': 'Add to Cart',
          'buy_now': 'Buy Now',
          'checkout': 'Checkout',
          'place_order': 'Place Order',
          'order_placed': 'Order Placed Successfully',
          'delivery_address': 'Delivery Address',
          'payment_method': 'Payment Method',
          'cash': 'Cash on Delivery',
          'card': 'Credit/Debit Card',
          'total': 'Total',
          'subtotal': 'Subtotal',
          'delivery_fee': 'Delivery Fee',
          'cancel': 'Cancel',
          'confirm': 'Confirm',
          'save': 'Save',
          'edit': 'Edit',
          'delete': 'Delete',
          'loading': 'Loading...',
          'error': 'Error',
          'success': 'Success',
          'no_data': 'No data available',
          'no_stories': 'No stories available',
          'retry': 'Retry',
          'scan_qr': 'Scan QR Code',
          'live': 'Live',
          'videos': 'Videos',
          'stories': 'Stories',
          'short': 'Short',
          'new_categories': 'New Categories',
          'hi_user': 'Hi, %s',
          'how_are_you': 'How are you feeling today?',
          'products': 'Products',
          'seller': 'Seller',
          'buyer': 'Buyer',
          'courier': 'Courier',
          'admin': 'Admin',
                  'my_videos': 'My Videos',
                  'no_videos': 'No videos yet',
                  'upload_video': 'Upload Video',
                  'add_video': 'Add Video',
                  'your_story': 'Your story',
                  'follow': 'Follow',
                  'following': 'Following',
                  'message': 'Message',
                  'no_products': 'No products',
                  'no_tagged_posts': 'No tagged posts',
                  'posts': 'posts',
                  'followers': 'followers',
                  'product_service': 'Product/Service',
                  'quality_products': 'Quality products',
                  'add': 'Add',
                  'story': 'Story',
                },
        'ru': {
          'app_name': 'GoGoMarket',
          'welcome': 'Добро пожаловать',
          'login': 'Вход',
          'register': 'Регистрация',
          'email': 'Электронная почта',
          'password': 'Пароль',
          'phone': 'Номер телефона',
          'forgot_password': 'Забыли пароль?',
          'dont_have_account': 'Нет аккаунта?',
          'already_have_account': 'Уже есть аккаунт?',
          'sign_up': 'Зарегистрироваться',
          'sign_in': 'Войти',
          'home': 'Главная',
          'search': 'Поиск',
          'search_products': 'Поиск товаров...',
          'cart': 'Корзина',
          'orders': 'Заказы',
          'profile': 'Профиль',
          'settings': 'Настройки',
          'logout': 'Выйти',
          'add_to_cart': 'В корзину',
          'buy_now': 'Купить сейчас',
          'checkout': 'Оформление',
          'place_order': 'Оформить заказ',
          'order_placed': 'Заказ успешно оформлен',
          'delivery_address': 'Адрес доставки',
          'payment_method': 'Способ оплаты',
          'cash': 'Наличными при получении',
          'card': 'Банковская карта',
          'total': 'Итого',
          'subtotal': 'Подытог',
          'delivery_fee': 'Доставка',
          'cancel': 'Отмена',
          'confirm': 'Подтвердить',
          'save': 'Сохранить',
          'edit': 'Редактировать',
          'delete': 'Удалить',
          'loading': 'Загрузка...',
          'error': 'Ошибка',
          'success': 'Успешно',
          'no_data': 'Нет данных',
          'no_stories': 'Нет историй',
          'retry': 'Повторить',
          'scan_qr': 'Сканировать QR-код',
          'live': 'Прямой эфир',
          'videos': 'Видео',
          'stories': 'Истории',
          'short': 'Короткие',
          'new_categories': 'Категории',
          'hi_user': 'Привет, %s',
          'how_are_you': 'Как дела сегодня?',
          'products': 'Товары',
          'seller': 'Продавец',
          'buyer': 'Покупатель',
          'courier': 'Курьер',
          'admin': 'Администратор',
          'my_videos': 'Мои видео',
          'no_videos': 'Нет видео',
          'upload_video': 'Загрузить видео',
          'add_video': 'Добавить видео',
          'your_story': 'Ваша история',
          'follow': 'Подписаться',
          'following': 'Подписки',
          'message': 'Сообщение',
          'no_products': 'Нет товаров',
          'no_tagged_posts': 'Нет отмеченных публикаций',
          'posts': 'публикации',
          'followers': 'подписчики',
          'product_service': 'Товар/услуга',
          'quality_products': 'Качественные товары',
          'add': 'Добавить',
          'story': 'История',
        },
        'uz': {
          'app_name': 'GoGoMarket',
          'welcome': 'Xush kelibsiz',
          'login': 'Kirish',
          'register': "Ro'yxatdan o'tish",
          'email': 'Elektron pochta',
          'password': 'Parol',
          'phone': 'Telefon raqami',
          'forgot_password': 'Parolni unutdingizmi?',
          'dont_have_account': "Hisobingiz yo'qmi?",
          'already_have_account': 'Hisobingiz bormi?',
          'sign_up': "Ro'yxatdan o'tish",
          'sign_in': 'Kirish',
          'home': 'Bosh sahifa',
          'search': 'Qidirish',
          'search_products': 'Mahsulotlarni qidirish...',
          'cart': 'Savat',
          'orders': 'Buyurtmalar',
          'profile': 'Profil',
          'settings': 'Sozlamalar',
          'logout': 'Chiqish',
          'add_to_cart': "Savatga qo'shish",
          'buy_now': 'Hozir sotib olish',
          'checkout': 'Rasmiylashtirish',
          'place_order': 'Buyurtma berish',
          'order_placed': 'Buyurtma muvaffaqiyatli berildi',
          'delivery_address': 'Yetkazib berish manzili',
          'payment_method': "To'lov usuli",
          'cash': 'Naqd pul',
          'card': 'Bank kartasi',
          'total': 'Jami',
          'subtotal': 'Oraliq jami',
          'delivery_fee': 'Yetkazib berish',
          'cancel': 'Bekor qilish',
          'confirm': 'Tasdiqlash',
          'save': 'Saqlash',
          'edit': 'Tahrirlash',
          'delete': "O'chirish",
          'loading': 'Yuklanmoqda...',
          'error': 'Xato',
          'success': 'Muvaffaqiyatli',
          'no_data': "Ma'lumot yo'q",
          'no_stories': "Hikoyalar yo'q",
          'retry': 'Qayta urinish',
          'scan_qr': 'QR kodni skanerlash',
          'live': 'Jonli efir',
          'videos': 'Videolar',
          'stories': 'Hikoyalar',
          'short': 'Qisqa',
          'new_categories': 'Kategoriyalar',
          'hi_user': 'Salom, %s',
          'how_are_you': "Bugun kayfiyatingiz qanday?",
          'products': 'Mahsulotlar',
          'seller': 'Sotuvchi',
          'buyer': 'Xaridor',
          'courier': 'Kuryer',
          'admin': 'Administrator',
          'my_videos': 'Mening videolarim',
          'no_videos': "Videolar yo'q",
          'upload_video': 'Video yuklash',
          'add_video': "Video qo'shish",
          'your_story': 'Sizning hikoyangiz',
          'follow': 'Obuna',
          'following': 'Obunalar',
          'message': 'Xabar',
          'no_products': "Mahsulotlar yo'q",
          'no_tagged_posts': "Belgilangan postlar yo'q",
          'posts': 'postlar',
          'followers': 'obunachilar',
          'product_service': 'Mahsulot/Xizmat',
          'quality_products': 'Sifatli mahsulotlar',
          'add': "Qo'shish",
          'story': 'Hikoya',
        },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }

  String get appName => translate('app_name');
  String get welcome => translate('welcome');
  String get login => translate('login');
  String get register => translate('register');
  String get email => translate('email');
  String get password => translate('password');
  String get phone => translate('phone');
  String get forgotPassword => translate('forgot_password');
  String get dontHaveAccount => translate('dont_have_account');
  String get alreadyHaveAccount => translate('already_have_account');
  String get signUp => translate('sign_up');
  String get signIn => translate('sign_in');
  String get home => translate('home');
  String get search => translate('search');
  String get cart => translate('cart');
  String get orders => translate('orders');
  String get profile => translate('profile');
  String get settings => translate('settings');
  String get logout => translate('logout');
  String get addToCart => translate('add_to_cart');
  String get buyNow => translate('buy_now');
  String get checkout => translate('checkout');
  String get placeOrder => translate('place_order');
  String get orderPlaced => translate('order_placed');
  String get deliveryAddress => translate('delivery_address');
  String get paymentMethod => translate('payment_method');
  String get cash => translate('cash');
  String get card => translate('card');
  String get total => translate('total');
  String get subtotal => translate('subtotal');
  String get deliveryFee => translate('delivery_fee');
  String get cancel => translate('cancel');
  String get confirm => translate('confirm');
  String get save => translate('save');
  String get edit => translate('edit');
  String get delete => translate('delete');
  String get loading => translate('loading');
  String get error => translate('error');
  String get success => translate('success');
  String get noData => translate('no_data');
  String get retry => translate('retry');
  String get scanQr => translate('scan_qr');
  String get live => translate('live');
  String get videos => translate('videos');
  String get products => translate('products');
  String get seller => translate('seller');
  String get buyer => translate('buyer');
  String get courier => translate('courier');
  String get admin => translate('admin');
  String get follow => translate('follow');
  String get following => translate('following');
  String get message => translate('message');
  String get noProducts => translate('no_products');
  String get noVideos => translate('no_videos');
  String get noTaggedPosts => translate('no_tagged_posts');
  String get posts => translate('posts');
  String get followers => translate('followers');
  String get productService => translate('product_service');
  String get qualityProducts => translate('quality_products');
  String get add => translate('add');
  String get story => translate('story');
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'ru', 'uz'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
