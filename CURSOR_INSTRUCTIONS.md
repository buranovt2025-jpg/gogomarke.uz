# Cursor AI Instructions - GoGoMarket.uz

## Project Overview
GoGoMarket.uz is a social video marketplace platform with multiple frontend implementations (Flutter mobile app and React web application). This document provides instructions for Cursor AI to assist with frontend development, UI/UX implementation, and integration tasks.

---

## Technology Stack

### Flutter Mobile App (Android/iOS)
- **Framework**: Flutter 3.x
- **Language**: Dart
- **State Management**: Provider
- **HTTP Client**: Dio
- **Storage**: SharedPreferences + FlutterSecureStorage
- **Video**: video_player, chewie
- **Biometrics**: local_auth
- **QR Codes**: qr_flutter, mobile_scanner
- **Localization**: intl (RU, UZ, EN)

### React Web Application
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI + Tailwind CSS
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **HTTP Client**: fetch API
- **Real-time**: Socket.io Client
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts

---

## Project Structure

### Flutter Mobile App
```
frontend/
├── lib/
│   ├── config/
│   │   ├── theme.dart          # App themes (light/dark)
│   │   ├── routes.dart         # Navigation routes
│   │   └── api_config.dart     # API endpoints
│   ├── l10n/                   # Localization files
│   │   ├── app_en.arb          # English
│   │   ├── app_ru.arb          # Russian
│   │   └── app_uz.arb          # Uzbek
│   ├── models/                 # Data models
│   ├── providers/              # State management
│   │   ├── auth_provider.dart
│   │   ├── product_provider.dart
│   │   ├── video_provider.dart
│   │   └── theme_provider.dart
│   ├── screens/                # UI screens
│   │   ├── auth/
│   │   ├── home/
│   │   ├── product/
│   │   ├── video/
│   │   ├── seller/
│   │   ├── courier/
│   │   └── admin/
│   ├── services/               # API & business logic
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   └── storage_service.dart
│   ├── utils/                  # Helper functions
│   └── widgets/                # Reusable components
│       ├── common/
│       ├── video/
│       └── product/
├── pubspec.yaml
└── analysis_options.yaml
```

### React Web App
```
web/gogomarket-web/
├── src/
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Radix UI components
│   │   ├── layout/             # Layout components
│   │   ├── product/
│   │   ├── video/
│   │   └── common/
│   ├── pages/                  # Page components
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── Videos.tsx
│   │   ├── Auth/
│   │   └── Dashboard/
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # API client
│   │   ├── utils.ts            # Helper functions
│   │   └── constants.ts
│   ├── hooks/                  # Custom React hooks
│   ├── context/                # React Context
│   │   └── AuthContext.tsx
│   ├── types/                  # TypeScript types
│   └── App.tsx
├── public/
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Design System

### Color Palette
```css
/* Primary Colors */
--primary: #FF6600;           /* Orange - Brand color */
--primary-dark: #E65A00;
--primary-light: #FF7F26;

/* Neutral Colors */
--black: #000000;
--white: #FFFFFF;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Semantic Colors */
--success: #10B981;
--error: #EF4444;
--warning: #F59E0B;
--info: #3B82F6;
```

### Typography
```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing
```css
/* Use 8px base unit */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### Borders & Radius
```css
--border-width: 1px;
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Full rounded */
```

---

## Coding Standards

### Flutter/Dart Guidelines

1. **File Naming**
   - Use snake_case for files: `product_card.dart`, `auth_provider.dart`
   - One widget per file (unless closely related)

2. **Widget Organization**
```dart
// Example widget structure
class ProductCard extends StatelessWidget {
  // 1. Constants
  static const double cardHeight = 200.0;
  
  // 2. Properties
  final Product product;
  final VoidCallback? onTap;
  
  // 3. Constructor
  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
  });
  
  // 4. Build method
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: _buildCard(context),
    );
  }
  
  // 5. Private helper methods
  Widget _buildCard(BuildContext context) {
    // Implementation
  }
}
```

3. **State Management with Provider**
```dart
// Provider setup
class ProductProvider extends ChangeNotifier {
  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;

  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchProducts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _products = await apiService.getProducts();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// Usage in widget
Consumer<ProductProvider>(
  builder: (context, provider, child) {
    if (provider.isLoading) {
      return const CircularProgressIndicator();
    }
    
    if (provider.error != null) {
      return ErrorWidget(message: provider.error!);
    }
    
    return ProductList(products: provider.products);
  },
)
```

4. **Localization**
```dart
// Access localized strings
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

final l10n = AppLocalizations.of(context)!;
Text(l10n.welcomeMessage);
```

### React/TypeScript Guidelines

1. **Component Naming**
   - Use PascalCase for components: `ProductCard.tsx`, `VideoPlayer.tsx`
   - Use camelCase for utilities: `apiClient.ts`, `formatPrice.ts`

2. **Component Structure**
```typescript
// Functional component with TypeScript
import { FC } from 'react';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export const ProductCard: FC<ProductCardProps> = ({ product, onSelect }) => {
  const handleClick = () => {
    onSelect?.(product);
  };

  return (
    <div 
      className="product-card cursor-pointer hover:shadow-lg"
      onClick={handleClick}
    >
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{formatPrice(product.price)}</p>
    </div>
  );
};
```

3. **Custom Hooks**
```typescript
// useAuth hook example
export const useAuth = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { phone, password });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return { user, login, logout, loading };
};
```

4. **Form Handling with React Hook Form**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data.phone, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('phone')} placeholder="Phone number" />
      {errors.phone && <span>{errors.phone.message}</span>}
      
      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
};
```

5. **Tailwind CSS Classes**
```tsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-2xl font-bold text-gray-900">Product Name</h2>
  <span className="text-lg font-semibold text-orange-600">$99.99</span>
</div>

// For complex components, use clsx or cn utility
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>
```

---

## Frontend Tasks & Best Practices

### F0.1: Responsive Design Implementation

**Objective**: Ensure all screens work perfectly on mobile, tablet, and desktop

**Flutter**:
```dart
// Use MediaQuery for responsive layouts
class ResponsiveLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 600;
    final isMedium = size.width >= 600 && size.width < 1200;
    final isLarge = size.width >= 1200;

    if (isSmall) {
      return MobileLayout();
    } else if (isMedium) {
      return TabletLayout();
    } else {
      return DesktopLayout();
    }
  }
}

// Use LayoutBuilder for dynamic layouts
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth < 600) {
      return SingleColumnLayout();
    } else {
      return DoubleColumnLayout();
    }
  },
)
```

**React**:
```tsx
// Use Tailwind responsive prefixes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>

// Or use CSS media queries
import { useMediaQuery } from '@/hooks/useMediaQuery';

const isMobile = useMediaQuery('(max-width: 768px)');
```

---

### F0.2: Video Feed Implementation (TikTok-style)

**Flutter**:
```dart
// Vertical scrolling video feed
class VideoFeed extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      scrollDirection: Axis.vertical,
      itemCount: videos.length,
      itemBuilder: (context, index) {
        return VideoPlayerItem(
          video: videos[index],
          onLike: () => handleLike(videos[index]),
          onComment: () => showComments(videos[index]),
          onShare: () => shareVideo(videos[index]),
        );
      },
    );
  }
}

// Video player with controls
class VideoPlayerItem extends StatefulWidget {
  final Video video;
  
  @override
  _VideoPlayerItemState createState() => _VideoPlayerItemState();
}

class _VideoPlayerItemState extends State<VideoPlayerItem> {
  late VideoPlayerController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.network(widget.video.url)
      ..initialize().then((_) {
        setState(() {});
        _controller.play();
        _controller.setLooping(true);
      });
  }
  
  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video player
        _controller.value.isInitialized
          ? AspectRatio(
              aspectRatio: _controller.value.aspectRatio,
              child: VideoPlayer(_controller),
            )
          : const Center(child: CircularProgressIndicator()),
        
        // Overlay UI (buttons, info, etc.)
        _buildOverlay(),
      ],
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

**React**:
```tsx
// Vertical scrolling video feed
export const VideoFeed: FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: videos } = useQuery('videos', fetchVideos);

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
      {videos?.map((video, index) => (
        <div 
          key={video.id} 
          className="h-screen snap-start"
        >
          <VideoPlayer 
            video={video}
            isActive={index === currentIndex}
          />
        </div>
      ))}
    </div>
  );
};
```

---

### F0.3: Real-time Features with Socket.io

**Flutter**:
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;
  
  void connect() {
    socket = IO.io('http://64.226.94.133:3000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    socket.connect();
    
    socket.on('connect', (_) {
      print('Connected to socket server');
    });
    
    socket.on('new_order', (data) {
      // Handle new order notification
      handleNewOrder(data);
    });
    
    socket.on('message', (data) {
      // Handle chat message
      handleMessage(data);
    });
  }
  
  void disconnect() {
    socket.disconnect();
  }
  
  void emit(String event, dynamic data) {
    socket.emit(event, data);
  }
}
```

**React**:
```typescript
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://64.226.94.133:3000', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('new_order', (data) => {
      // Handle new order
      toast.success('New order received!');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return socket;
};
```

---

### F0.4: Biometric Authentication (Flutter)

```dart
import 'package:local_auth/local_auth.dart';

class BiometricAuth {
  final LocalAuthentication auth = LocalAuthentication();
  
  Future<bool> canCheckBiometrics() async {
    return await auth.canCheckBiometrics;
  }
  
  Future<List<BiometricType>> getAvailableBiometrics() async {
    return await auth.getAvailableBiometrics();
  }
  
  Future<bool> authenticate() async {
    try {
      return await auth.authenticate(
        localizedReason: 'Authenticate to complete purchase',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
    } catch (e) {
      print('Error: $e');
      return false;
    }
  }
}

// Usage in checkout
class CheckoutScreen extends StatelessWidget {
  final biometric = BiometricAuth();
  
  Future<void> completePurchase() async {
    final authenticated = await biometric.authenticate();
    
    if (authenticated) {
      // Process payment
      await processPayment();
    } else {
      // Show error
      showError('Authentication failed');
    }
  }
}
```

---

### F0.5: QR Code Generation and Scanning

**Generation (Flutter)**:
```dart
import 'package:qr_flutter/qr_flutter.dart';

class OrderQRCode extends StatelessWidget {
  final String orderId;
  
  @override
  Widget build(BuildContext context) {
    return QrImageView(
      data: orderId,
      version: QrVersions.auto,
      size: 200.0,
      backgroundColor: Colors.white,
    );
  }
}
```

**Scanning (Flutter)**:
```dart
import 'package:mobile_scanner/mobile_scanner.dart';

class QRScanner extends StatelessWidget {
  final Function(String) onScan;
  
  @override
  Widget build(BuildContext context) {
    return MobileScanner(
      onDetect: (capture) {
        final List<Barcode> barcodes = capture.barcodes;
        for (final barcode in barcodes) {
          if (barcode.rawValue != null) {
            onScan(barcode.rawValue!);
          }
        }
      },
    );
  }
}
```

---

### F0.6: Image Upload with Preview

**Flutter**:
```dart
import 'package:image_picker/image_picker.dart';

class ImageUploadWidget extends StatefulWidget {
  @override
  _ImageUploadWidgetState createState() => _ImageUploadWidgetState();
}

class _ImageUploadWidgetState extends State<ImageUploadWidget> {
  final ImagePicker _picker = ImagePicker();
  List<XFile> _images = [];
  
  Future<void> pickImages() async {
    final List<XFile> images = await _picker.pickMultiImage();
    setState(() {
      _images = images;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ElevatedButton(
          onPressed: pickImages,
          child: Text('Select Images'),
        ),
        GridView.builder(
          shrinkWrap: true,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 4,
            mainAxisSpacing: 4,
          ),
          itemCount: _images.length,
          itemBuilder: (context, index) {
            return Image.file(File(_images[index].path));
          },
        ),
      ],
    );
  }
}
```

**React**:
```tsx
export const ImageUpload: FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);

    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        {previews.map((preview, index) => (
          <img 
            key={index} 
            src={preview} 
            alt={`Preview ${index}`}
            className="w-full h-32 object-cover rounded"
          />
        ))}
      </div>
    </div>
  );
};
```

---

### F0.7: Offline Mode with Sync

**Flutter**:
```dart
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  
  Stream<ConnectivityResult> get connectivityStream {
    return _connectivity.onConnectivityChanged;
  }
  
  Future<bool> checkConnection() async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
}

class OfflineProvider extends ChangeNotifier {
  bool _isOnline = true;
  List<dynamic> _pendingSync = [];
  
  bool get isOnline => _isOnline;
  
  void setConnectionStatus(bool online) {
    _isOnline = online;
    if (online) {
      syncPendingData();
    }
    notifyListeners();
  }
  
  void addToPendingSync(dynamic data) {
    _pendingSync.add(data);
    notifyListeners();
  }
  
  Future<void> syncPendingData() async {
    for (var data in _pendingSync) {
      try {
        await apiService.sync(data);
      } catch (e) {
        print('Sync error: $e');
      }
    }
    _pendingSync.clear();
    notifyListeners();
  }
}
```

---

## Localization

### Adding New Translations

**Flutter** (`l10n/app_en.arb`):
```json
{
  "@@locale": "en",
  "welcomeMessage": "Welcome to GoGoMarket",
  "login": "Login",
  "logout": "Logout",
  "productName": "Product Name",
  "price": "Price",
  "addToCart": "Add to Cart",
  "checkout": "Checkout",
  "orderPlaced": "Order placed successfully",
  "@orderPlaced": {
    "description": "Message shown when order is placed"
  }
}
```

**React** (create i18n config):
```typescript
// src/i18n/index.ts
export const translations = {
  en: {
    welcomeMessage: 'Welcome to GoGoMarket',
    login: 'Login',
    logout: 'Logout',
    addToCart: 'Add to Cart',
  },
  ru: {
    welcomeMessage: 'Добро пожаловать в GoGoMarket',
    login: 'Войти',
    logout: 'Выйти',
    addToCart: 'Добавить в корзину',
  },
  uz: {
    welcomeMessage: 'GoGoMarketga xush kelibsiz',
    login: 'Kirish',
    logout: 'Chiqish',
    addToCart: 'Savatga qo\'shish',
  },
};
```

---

## Performance Optimization

### Flutter
1. **Use const constructors** wherever possible
2. **Implement lazy loading** for lists
3. **Cache network images** with `cached_network_image`
4. **Use `ListView.builder`** instead of `ListView` for long lists
5. **Avoid rebuilding entire trees** - use `Consumer` or `Selector`

### React
1. **Code splitting** with `React.lazy()` and `Suspense`
2. **Memoization** with `useMemo` and `useCallback`
3. **Virtual scrolling** for long lists
4. **Image optimization** - use WebP format, lazy loading
5. **Bundle analysis** - use Vite's build analyzer

---

## Testing

### Flutter
```dart
// Widget test example
testWidgets('ProductCard displays product info', (WidgetTester tester) async {
  final product = Product(
    id: '1',
    name: 'Test Product',
    price: 99.99,
  );

  await tester.pumpWidget(
    MaterialApp(
      home: ProductCard(product: product),
    ),
  );

  expect(find.text('Test Product'), findsOneWidget);
  expect(find.text('99.99'), findsOneWidget);
});
```

### React
```tsx
// Component test with React Testing Library
import { render, screen } from '@testing-library/react';

describe('ProductCard', () => {
  it('displays product information', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

---

## Common Commands

### Flutter
```bash
# Run app
flutter run

# Build APK
flutter build apk --release

# Build for iOS
flutter build ios --release

# Run tests
flutter test

# Analyze code
flutter analyze

# Generate localization files
flutter gen-l10n

# Clean build
flutter clean
```

### React
```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run build:typecheck

# Lint code
npm run lint

# Preview production build
npm run preview
```

---

## API Integration

### Base API Configuration

**Flutter**:
```dart
class ApiConfig {
  static const String baseUrl = 'http://64.226.94.133:3000/api/v1';
  static const Duration timeout = Duration(seconds: 30);
  
  static Map<String, String> getHeaders() {
    final token = StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
```

**React**:
```typescript
const API_BASE_URL = 'http://64.226.94.133:3000/api/v1';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return response.json();
  },
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return response.json();
  },
};
```

---

## Git Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `style/` - UI/UX changes
- `docs/` - Documentation

### Commit Messages
Use conventional commits:
```
feat(ui): add product card component
fix(auth): resolve login token expiration issue
style(home): update hero section layout
docs(readme): add setup instructions
```

---

## Resources

### Flutter
- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Provider Package](https://pub.dev/packages/provider)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)

### React
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [React Router](https://reactrouter.com/)

---

*Last Updated: January 2026*
*Project: GoGoMarket.uz Frontend*
