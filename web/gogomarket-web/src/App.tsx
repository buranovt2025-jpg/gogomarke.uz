import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserRole } from './types';
import Layout from './components/Layout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

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

import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import ProductForm from './pages/seller/ProductForm';
import SellerAnalytics from './pages/seller/SellerAnalytics';
import SellerOrders from './pages/seller/SellerOrders';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTransactions from './pages/admin/AdminTransactions';
import FinancialOverview from './pages/admin/FinancialOverview';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminCategories from './pages/admin/AdminCategories';

import CourierDashboard from './pages/courier/CourierDashboard';

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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/products"
        element={
          <Layout>
            <ProductsPage />
          </Layout>
        }
      />
      <Route
        path="/products/:id"
        element={
          <Layout>
            <ProductDetailPage />
          </Layout>
        }
      />
      <Route
        path="/cart"
        element={
          <Layout>
            <CartPage />
          </Layout>
        }
      />
      <Route
        path="/checkout"
        element={
          <Layout>
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          </Layout>
        }
      />
            <Route
              path="/orders"
              element={
                <Layout>
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/orders/:orderId/chat"
              element={
                <Layout>
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                </Layout>
              }
            />
                        <Route
                          path="/favorites"
                          element={
                            <Layout>
                              <ProtectedRoute>
                                <FavoritesPage />
                              </ProtectedRoute>
                            </Layout>
                          }
                        />
                                                <Route
                                                  path="/store/:sellerId"
                                                  element={
                                                    <Layout>
                                                      <SellerStorePage />
                                                    </Layout>
                                                  }
                                                />
                                                <Route
                                                  path="/disputes"
                                                  element={
                                                    <Layout>
                                                      <ProtectedRoute>
                                                        <DisputesPage />
                                                      </ProtectedRoute>
                                                    </Layout>
                                                  }
                                                />
                                                                                                <Route
                                                                                                  path="/orders/:orderId/dispute"
                                                                                                  element={
                                                                                                    <Layout>
                                                                                                      <ProtectedRoute>
                                                                                                        <CreateDisputePage />
                                                                                                      </ProtectedRoute>
                                                                                                    </Layout>
                                                                                                  }
                                                                                                />
                                                                                                                                                                                                <Route
                                                                                                                          path="/orders/:orderId/tracking"
                                                                                                                          element={
                                                                                                                            <Layout>
                                                                                                                              <ProtectedRoute>
                                                                                                                                <OrderTrackingPage />
                                                                                                                              </ProtectedRoute>
                                                                                                                            </Layout>
                                                                                                                          }
                                                                                                                        />
                                                                                                                        <Route
                                                                                                                          path="/notifications"
                                                                                                                          element={
                                                                                                                            <Layout>
                                                                                                                              <ProtectedRoute>
                                                                                                                                <NotificationsPage />
                                                                                                                              </ProtectedRoute>
                                                                                                                            </Layout>
                                                                                                                          }
                                                                                                                        />

                                                                                                                        <Route
                                                                                                                          path="/seller"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
              <SellerDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/seller/products"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
              <SellerProducts />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/seller/products/new"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
              <ProductForm />
            </ProtectedRoute>
          </Layout>
        }
      />
            <Route
              path="/seller/products/:id/edit"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
                    <ProductForm />
                  </ProtectedRoute>
                </Layout>
              }
            />
                        <Route
                          path="/seller/analytics"
                          element={
                            <Layout>
                              <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
                                <SellerAnalytics />
                              </ProtectedRoute>
                            </Layout>
                          }
                        />
                        <Route
                          path="/seller/orders"
                          element={
                            <Layout>
                              <ProtectedRoute allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
                                <SellerOrders />
                              </ProtectedRoute>
                            </Layout>
                          }
                        />

                        <Route
                          path="/admin"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminUsers />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminOrders />
            </ProtectedRoute>
          </Layout>
        }
      />
            <Route
              path="/admin/transactions"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                    <AdminTransactions />
                  </ProtectedRoute>
                </Layout>
              }
            />
                        <Route
                          path="/admin/financial"
                          element={
                            <Layout>
                              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                <FinancialOverview />
                              </ProtectedRoute>
                            </Layout>
                          }
                        />
                                                <Route
                                                  path="/admin/disputes"
                                                  element={
                                                    <Layout>
                                                      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                                        <AdminDisputes />
                                                      </ProtectedRoute>
                                                    </Layout>
                                                  }
                                                />
                                                <Route
                                                  path="/admin/categories"
                                                  element={
                                                    <Layout>
                                                      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                                        <AdminCategories />
                                                      </ProtectedRoute>
                                                    </Layout>
                                                  }
                                                />

                                                <Route
                                                  path="/courier"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={[UserRole.COURIER, UserRole.ADMIN]}>
                    <CourierDashboard />
                  </ProtectedRoute>
                </Layout>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
