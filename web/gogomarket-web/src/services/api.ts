const API_URL = import.meta.env.VITE_API_URL || 'http://64.226.94.133/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  async register(phone: string, password: string, role: string = 'buyer') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, role }),
    });
  }

  async verifyOtp(phone: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async login(phone: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data: { firstName?: string; lastName?: string; email?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProducts(params?: { page?: number; limit?: number; category?: string; sellerId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.sellerId) searchParams.set('sellerId', params.sellerId);
    return this.request(`/products?${searchParams.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: {
    title: string;
    description?: string;
    price: number;
    originalPrice?: number;
    images?: string[];
    category?: string;
    stock?: number;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<{
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    images: string[];
    category: string;
    stock: number;
    isActive: boolean;
  }>) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getVideoFeed(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return this.request(`/videos/feed?${searchParams.toString()}`);
  }

  async getSellerVideos() {
    return this.request('/videos/my');
  }

  async createVideo(data: {
    url: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    productId?: string;
  }) {
    return this.request('/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    return this.request(`/orders?${searchParams.toString()}`);
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data: {
    productId: string;
    quantity: number;
    paymentMethod: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPhone: string;
    buyerNote?: string;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createOrderFromCart(items: { productId: string; quantity: number }[], shippingAddress: string, shippingCity: string, shippingPhone: string, paymentMethod: string) {
    const results = [];
    for (const item of items) {
      const result = await this.createOrder({
        productId: item.productId,
        quantity: item.quantity,
        paymentMethod,
        shippingAddress,
        shippingCity,
        shippingPhone,
      });
      results.push(result);
    }
    return { success: true, data: { orders: results } };
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getUsers(params?: { page?: number; limit?: number; role?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.role) searchParams.set('role', params.role);
    return this.request(`/admin/users?${searchParams.toString()}`);
  }

  async getTransactions(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return this.request(`/admin/transactions?${searchParams.toString()}`);
  }

  async getStats() {
    return this.request('/admin/stats');
  }

  async getFinancialOverview() {
    return this.request('/payments/financial-overview');
  }

  async mockPayment(orderId: string) {
    return this.request('/payments/mock-pay', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  async getSellerWallet() {
    return this.request('/payments/wallet');
  }

  async getCourierStats() {
    return this.request('/courier/stats');
  }

  async getAvailableOrders() {
    return this.request('/orders/available');
  }

  async acceptOrder(orderId: string) {
    return this.request(`/orders/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async scanPickupQr(orderId: string, qrData: string) {
    return this.request(`/orders/${orderId}/pickup`, {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  }

  async confirmDelivery(orderId: string, data: { qrData?: string; deliveryCode?: string }) {
    return this.request(`/orders/${orderId}/deliver`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

    async getFavorites() {
      return this.request('/favorites');
    }

    async addToFavorites(productId: string) {
      return this.request('/favorites', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
    }

    async removeFromFavorites(productId: string) {
      return this.request(`/favorites/${productId}`, {
        method: 'DELETE',
      });
    }

    async checkFavorite(productId: string) {
      return this.request(`/favorites/${productId}/check`);
    }

  async getSubscriptions() {
    return this.request('/subscriptions');
  }

  async subscribe(sellerId: string) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ sellerId }),
    });
  }

  async unsubscribe(sellerId: string) {
    return this.request(`/subscriptions/${sellerId}`, {
      method: 'DELETE',
    });
  }

  async getVideoComments(videoId: string) {
    return this.request(`/videos/${videoId}/comments`);
  }

  async addVideoComment(videoId: string, text: string) {
    return this.request(`/videos/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getMessages(orderId: string) {
    return this.request(`/chat/${orderId}/messages`);
  }

  async sendMessage(orderId: string, text: string, receiverId: string) {
    return this.request(`/chat/${orderId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, receiverId }),
    });
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return response.json();
  }

  async getSellerAnalytics() {
    return this.request('/seller/analytics');
  }
}

export const api = new ApiService();
export default api;
