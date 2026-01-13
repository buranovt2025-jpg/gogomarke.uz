// API_URL should be set via environment variable VITE_API_URL
// For production: VITE_API_URL=https://api.gogomarket.uz/api/v1
const API_URL = import.meta.env.VITE_API_URL || 'https://api.gogomarket.uz/api/v1';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Order {
  id: number;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: Product;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || 'Login failed' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<ApiResponse<LoginResponse['user']>> {
    return this.request<LoginResponse['user']>('/auth/me');
  }

  // Products endpoints
  async getProducts(params?: {
    category_id?: number;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<Product[]>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}`);
  }

  // Categories endpoints
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/categories');
  }

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/categories/${id}`);
  }

  // Cart endpoints
  async getCart(): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>('/cart');
  }

  async addToCart(productId: number, quantity: number): Promise<ApiResponse<CartItem>> {
    return this.request<CartItem>('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(itemId: number, quantity: number): Promise<ApiResponse<CartItem>> {
    return this.request<CartItem>(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse<void>> {
    return this.request<void>('/cart', {
      method: 'DELETE',
    });
  }

  // Orders endpoints
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/orders');
  }

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(deliveryAddress: string): Promise<ApiResponse<Order>> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ delivery_address: deliveryAddress }),
    });
  }
}

export const apiService = new ApiService();
