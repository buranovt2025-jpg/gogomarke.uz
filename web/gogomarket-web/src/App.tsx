import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserRole } from './types';
import Layout from './components/Layout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Public/Buyer pages
import HomePage from './pages/buyer/HomePage';
import ProductsPage from './pages/buyer/ProductsPage';
import ProductDetailPage from './pages/buyer/ProductDetailPage';
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrdersPage from './pages/buyer/OrdersPage';
import ChatPage from './pages/buyer/ChatPage';
import FavoritesPage from './pages/buyer/FavoritesPage';
import { SellerStorePage } from './pages/buyer/SellerStorePage';
import DisputesPage from './pages/buyer/DisputesPage';
import CreateDisputePage from './pages/buyer/CreateDisputePage';
import OrderTrackingPage from './pages/buyer/OrderTrackingPage';
import NotificationsPage from './pages/buyer/NotificationsPage';
import ReturnsPage from './pages/buyer/ReturnsPage';
import CreateReturnPage from './pages/buyer/CreateReturnPage';
import SupportPage from './pages/buyer/SupportPage';
import CreateTicketPage from './pages/buyer/CreateTicketPage';
import ViewHistoryPage from './pages/buyer/ViewHistoryPage';
import VideoFeedPage from './pages/buyer/VideoFeedPage';

// Seller pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import ProductForm from './pages/seller/ProductForm';
import SellerAnalytics from './pages/seller/SellerAnalytics';
import SellerOrders from './pages/seller/SellerOrders';
import SellerCoupons from './pages/seller/SellerCoupons';
import SellerReturns from './pages/seller/SellerReturns';
import CreateStoryPage from './pages/seller/CreateStoryPage';
import SellerPayouts from './pages/seller/SellerPayouts';
import SellerVideosPage from './pages/seller/SellerVideosPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTransactions from './pages/admin/AdminTransactions';
import FinancialOverview from './pages/admin/FinancialOverview';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminReturns from './pages/admin/AdminReturns';
import AdminTickets from './pages/admin/AdminTickets';
import AdminModeration from './pages/admin/AdminModeration';
import AdminReports from './pages/admin/AdminReports';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminStoriesPage from './pages/admin/AdminStoriesPage';

// Courier pages
import CourierDashboard from './pages/courier/CourierDashboard';
import CourierPayouts from './pages/courier/CourierPayouts';

// Profile page
import ProfilePage from './pages/buyer/ProfilePage';

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case UserRole.SELLER:
        return <Navigate to="/seller" replace />;
      case UserRole.COURIER:
        return <Navigate to="/courier" replace />;
      case UserRole.ADMIN:
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

// ============================================================================
// Role-based Redirect Component (for login/register)
// ============================================================================

function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  switch (user.role) {
    case UserRole.SELLER:
      return <Navigate to="/seller" replace />;
    case UserRole.COURIER:
      return <Navigate to="/courier" replace />;
    case UserRole.ADMIN:
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

// ============================================================================
// Main Routes
// ============================================================================

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/redirect" element={<RoleBasedRedirect />} />

      {/* ================================================================== */}
      {/* PUBLIC ROUTES - Available for guests and all users */}
      {/* ================================================================== */}
      
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
      <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />
      <Route path="/videos" element={<VideoFeedPage />} />
      <Route path="/store/:sellerId" element={<Layout><SellerStorePage /></Layout>} />
      
      {/* Cart - accessible by guests (localStorage) and authenticated users */}
      <Route path="/cart" element={<Layout><CartPage /></Layout>} />

      {/* ================================================================== */}
      {/* BUYER ROUTES - Requires authentication */}
      {/* ================================================================== */}
      
      <Route path="/checkout" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.BUYER, UserRole.SELLER, UserRole.ADMIN]}>
            <CheckoutPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/orders" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.BUYER, UserRole.SELLER, UserRole.ADMIN]}>
            <OrdersPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/orders/:orderId/chat" element={
        <Layout>
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/orders/:orderId/tracking" element={
        <Layout>
          <ProtectedRoute>
            <OrderTrackingPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/orders/:orderId/dispute" element={
        <Layout>
          <ProtectedRoute>
            <CreateDisputePage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/orders/:orderId/return" element={
        <Layout>
          <ProtectedRoute>
            <CreateReturnPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/favorites" element={
        <Layout>
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/disputes" element={
        <Layout>
          <ProtectedRoute>
            <DisputesPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/returns" element={
        <Layout>
          <ProtectedRoute>
            <ReturnsPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/notifications" element={
        <Layout>
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/support" element={
        <Layout>
          <ProtectedRoute>
            <SupportPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/support/new" element={
        <Layout>
          <ProtectedRoute>
            <CreateTicketPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/history" element={
        <Layout>
          <ProtectedRoute>
            <ViewHistoryPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/profile" element={
        <Layout>
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Layout>
      } />

      {/* ================================================================== */}
      {/* SELLER ROUTES */}
      {/* ================================================================== */}
      
      <Route path="/seller" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerDashboard />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/products" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerProducts />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/products/new" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <ProductForm />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/products/:id/edit" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <ProductForm />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/orders" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerOrders />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/analytics" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerAnalytics />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/coupons" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerCoupons />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/returns" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerReturns />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/payouts" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerPayouts />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/videos" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <SellerVideosPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/stories/new" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <CreateStoryPage />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/seller/stories/create" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
            <CreateStoryPage />
          </ProtectedRoute>
        </Layout>
      } />

      {/* ================================================================== */}
      {/* COURIER ROUTES */}
      {/* ================================================================== */}
      
      <Route path="/courier" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.COURIER, UserRole.ADMIN]}>
            <CourierDashboard />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/courier/payouts" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.COURIER, UserRole.ADMIN]}>
            <CourierPayouts />
          </ProtectedRoute>
        </Layout>
      } />

      {/* ================================================================== */}
      {/* ADMIN ROUTES */}
      {/* ================================================================== */}
      
      <Route path="/admin" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/users" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminUsers />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/orders" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminOrders />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/transactions" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminTransactions />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/financial" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <FinancialOverview />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/disputes" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDisputes />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/categories" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminCategories />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/returns" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminReturns />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/tickets" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminTickets />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/moderation" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminModeration />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/reports" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminReports />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/withdrawals" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminWithdrawals />
          </ProtectedRoute>
        </Layout>
      } />
      
      <Route path="/admin/stories" element={
        <Layout>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminStoriesPage />
          </ProtectedRoute>
        </Layout>
      } />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================================================
// App Component
// ============================================================================

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
