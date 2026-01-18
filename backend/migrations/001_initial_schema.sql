-- ============================================================
-- GoGoMarket.uz - Initial Database Schema Migration
-- Version: 001
-- Date: 2026-01-17
-- Description: Creates all tables for the GoGoMarket platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'buyer', 'courier');

-- Languages
CREATE TYPE language_type AS ENUM ('en', 'ru', 'uz');

-- Order statuses
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'picked_up', 'in_transit', 
  'delivered', 'cancelled', 'disputed'
);

-- Payment methods
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'cod', 'payme', 'click');

-- Payment statuses
CREATE TYPE payment_status AS ENUM (
  'pending', 'held', 'completed', 'refunded', 'failed', 'cancelled'
);

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
  'payment', 'escrow_hold', 'escrow_release', 'seller_payout',
  'courier_payout', 'platform_commission', 'commission_reversal', 'refund'
);

-- Dispute statuses
CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'closed');

-- Content types
CREATE TYPE content_type AS ENUM ('video', 'reel', 'story');

-- Content purposes
CREATE TYPE content_purpose AS ENUM ('product_review', 'shop_promotion', 'global_ad');

-- Coupon discount types
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  avatar VARCHAR(500),
  "isVerified" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  language language_type DEFAULT 'ru',
  "oneIdVerified" BOOLEAN DEFAULT FALSE,
  "acceptedTerms" BOOLEAN DEFAULT FALSE,
  "acceptedPrivacy" BOOLEAN DEFAULT FALSE,
  "lastLoginAt" TIMESTAMP,
  "availableBalance" DECIMAL(12, 2) DEFAULT 0,
  "pendingBalance" DECIMAL(12, 2) DEFAULT 0,
  "totalEarnings" DECIMAL(12, 2) DEFAULT 0,
  "fcmToken" VARCHAR(500),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  "titleRu" VARCHAR(255),
  "titleUz" VARCHAR(255),
  description TEXT NOT NULL,
  "descriptionRu" TEXT,
  "descriptionUz" TEXT,
  price DECIMAL(12, 2) NOT NULL,
  "originalPrice" DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'UZS',
  category VARCHAR(100) NOT NULL,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  "isActive" BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2, 1) DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_seller ON products("sellerId");
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products("isActive");

-- ============================================================
-- TABLE: product_variants
-- ============================================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50),
  price DECIMAL(12, 2),
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_variants_product ON product_variants("productId");

-- ============================================================
-- TABLE: videos
-- ============================================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ownerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" UUID REFERENCES products(id) ON DELETE SET NULL,
  "videoUrl" VARCHAR(500) NOT NULL,
  "thumbnailUrl" VARCHAR(500),
  title VARCHAR(255),
  description TEXT,
  type content_type DEFAULT 'video',
  purpose content_purpose DEFAULT 'product_review',
  duration INTEGER DEFAULT 0,
  "viewCount" INTEGER DEFAULT 0,
  "likeCount" INTEGER DEFAULT 0,
  "shareCount" INTEGER DEFAULT 0,
  "commentCount" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_videos_owner ON videos("ownerId");
CREATE INDEX idx_videos_product ON videos("productId");
CREATE INDEX idx_videos_type ON videos(type);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderNumber" VARCHAR(20) NOT NULL UNIQUE,
  "buyerId" UUID NOT NULL REFERENCES users(id),
  "sellerId" UUID NOT NULL REFERENCES users(id),
  "courierId" UUID REFERENCES users(id),
  "productId" UUID NOT NULL REFERENCES products(id),
  "videoId" UUID REFERENCES videos(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12, 2) NOT NULL,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "courierFee" DECIMAL(12, 2) DEFAULT 0,
  "platformCommission" DECIMAL(12, 2) DEFAULT 0,
  "sellerAmount" DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UZS',
  status order_status DEFAULT 'pending',
  "paymentMethod" payment_method NOT NULL,
  "paymentStatus" payment_status DEFAULT 'pending',
  "shippingAddress" TEXT NOT NULL,
  "shippingCity" VARCHAR(100) NOT NULL,
  "shippingPhone" VARCHAR(20) NOT NULL,
  "buyerNote" TEXT,
  "sellerQrCode" TEXT,
  "courierQrCode" TEXT,
  "deliveryCode" VARCHAR(6),
  "pickedUpAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_buyer ON orders("buyerId");
CREATE INDEX idx_orders_seller ON orders("sellerId");
CREATE INDEX idx_orders_courier ON orders("courierId");
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders("orderNumber");

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES orders(id),
  "userId" UUID REFERENCES users(id),
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UZS',
  status payment_status DEFAULT 'pending',
  description TEXT NOT NULL,
  "referenceId" VARCHAR(255),
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_order ON transactions("orderId");
CREATE INDEX idx_transactions_user ON transactions("userId");
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================================
-- TABLE: coupons
-- ============================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  "discountType" discount_type NOT NULL,
  "discountValue" DECIMAL(10, 2) NOT NULL,
  "minOrderAmount" DECIMAL(10, 2),
  "maxDiscount" DECIMAL(10, 2),
  "usageLimit" INTEGER,
  "usedCount" INTEGER DEFAULT 0,
  "sellerId" UUID REFERENCES users(id),
  "isActive" BOOLEAN DEFAULT TRUE,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_seller ON coupons("sellerId");

-- ============================================================
-- TABLE: disputes
-- ============================================================
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES orders(id),
  "reporterId" UUID NOT NULL REFERENCES users(id),
  "assignedAdminId" UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status dispute_status DEFAULT 'open',
  resolution TEXT,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disputes_order ON disputes("orderId");
CREATE INDEX idx_disputes_status ON disputes(status);

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES orders(id),
  "productId" UUID NOT NULL REFERENCES products(id),
  "buyerId" UUID NOT NULL REFERENCES users(id),
  "sellerId" UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  "sellerReply" TEXT,
  "isVerifiedPurchase" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_product ON reviews("productId");
CREATE INDEX idx_reviews_seller ON reviews("sellerId");

-- ============================================================
-- TABLE: addresses
-- ============================================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100),
  "fullAddress" TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  "postalCode" VARCHAR(20),
  phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  "isDefault" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses("userId");

-- ============================================================
-- TABLE: chats
-- ============================================================
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user1Id" UUID NOT NULL REFERENCES users(id),
  "user2Id" UUID NOT NULL REFERENCES users(id),
  "lastMessageAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_user1 ON chats("user1Id");
CREATE INDEX idx_chats_user2 ON chats("user2Id");

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "chatId" UUID REFERENCES chats(id) ON DELETE CASCADE,
  "orderId" UUID REFERENCES orders(id),
  "senderId" UUID NOT NULL REFERENCES users(id),
  "receiverId" UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  "messageType" VARCHAR(20) DEFAULT 'text',
  "mediaUrl" VARCHAR(500),
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat ON messages("chatId");
CREATE INDEX idx_messages_order ON messages("orderId");
CREATE INDEX idx_messages_sender ON messages("senderId");

-- ============================================================
-- TABLE: favorites
-- ============================================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "productId")
);

CREATE INDEX idx_favorites_user ON favorites("userId");
CREATE INDEX idx_favorites_product ON favorites("productId");

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "followerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("followerId", "sellerId")
);

CREATE INDEX idx_subscriptions_follower ON subscriptions("followerId");
CREATE INDEX idx_subscriptions_seller ON subscriptions("sellerId");

-- ============================================================
-- TABLE: comments
-- ============================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "videoId" UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "likeCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_video ON comments("videoId");
CREATE INDEX idx_comments_user ON comments("userId");

-- ============================================================
-- TABLE: tickets
-- ============================================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id),
  "orderId" UUID REFERENCES orders(id),
  "assignedTo" UUID REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_user ON tickets("userId");
CREATE INDEX idx_tickets_status ON tickets(status);

-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "reporterId" UUID NOT NULL REFERENCES users(id),
  "targetType" VARCHAR(50) NOT NULL,
  "targetId" UUID NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  "reviewedBy" UUID REFERENCES users(id),
  "reviewedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_reporter ON reports("reporterId");
CREATE INDEX idx_reports_target ON reports("targetType", "targetId");

-- ============================================================
-- TABLE: stories
-- ============================================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" UUID REFERENCES products(id) ON DELETE SET NULL,
  "mediaUrl" VARCHAR(500) NOT NULL,
  "mediaType" VARCHAR(20) DEFAULT 'image',
  caption TEXT,
  "viewCount" INTEGER DEFAULT 0,
  "expiresAt" TIMESTAMP NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stories_seller ON stories("sellerId");
CREATE INDEX idx_stories_expires ON stories("expiresAt");

-- ============================================================
-- TABLE: view_history
-- ============================================================
CREATE TABLE view_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "targetType" VARCHAR(50) NOT NULL,
  "targetId" UUID NOT NULL,
  "viewedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_view_history_user ON view_history("userId");
CREATE INDEX idx_view_history_target ON view_history("targetType", "targetId");

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications("userId");
CREATE INDEX idx_notifications_read ON notifications("isRead");

-- ============================================================
-- TABLE: carts
-- ============================================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carts_user ON carts("userId");

-- ============================================================
-- TABLE: cart_items
-- ============================================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cartId" UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "variantId" UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart ON cart_items("cartId");
CREATE INDEX idx_cart_items_product ON cart_items("productId");

-- ============================================================
-- TABLE: returns (for order returns)
-- ============================================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES orders(id),
  "buyerId" UUID NOT NULL REFERENCES users(id),
  "sellerId" UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending',
  "refundAmount" DECIMAL(12, 2),
  "processedAt" TIMESTAMP,
  "processedBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_returns_order ON returns("orderId");
CREATE INDEX idx_returns_status ON returns(status);

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After running this migration, verify tables with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Expected 24 tables:
-- users, products, product_variants, videos, orders, transactions,
-- coupons, disputes, reviews, addresses, chats, messages, favorites,
-- subscriptions, comments, tickets, reports, stories, view_history,
-- notifications, carts, cart_items, returns
