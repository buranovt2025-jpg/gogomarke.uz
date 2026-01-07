export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  BUYER = 'buyer',
  COURIER = 'courier',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  language: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: string;
  sizes?: string[];
  colors?: string[];
  stock: number;
  isActive: boolean;
  rating?: number;
  reviewCount: number;
  createdAt: string;
  seller?: User;
}

export interface Video {
  id: string;
  sellerId: string;
  productId?: string;
  url?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  isLive: boolean;
  createdAt: string;
  seller?: User;
  product?: Product;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  courierId?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  courierFee: number;
  platformCommission: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  deliveryAddress: string;
  pickupQrCode?: string;
  deliveryQrCode?: string;
  createdAt: string;
  buyer?: User;
  seller?: User;
  courier?: User;
}

export interface Transaction {
  id: string;
  orderId: string;
  type: 'payment' | 'payout' | 'commission' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  order?: Order;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}
