'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── ENUMS ──
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('admin','seller','buyer','courier');
      CREATE TYPE "enum_users_language" AS ENUM ('en','ru','uz');
      CREATE TYPE "enum_orders_status" AS ENUM ('pending','confirmed','picked_up','in_transit','delivered','cancelled','disputed');
      CREATE TYPE "enum_orders_payment_method" AS ENUM ('card','cash','cod','payme','click');
      CREATE TYPE "enum_orders_payment_status" AS ENUM ('pending','held','completed','refunded','failed','cancelled');
      CREATE TYPE "enum_transactions_type" AS ENUM ('payment','escrow_hold','escrow_release','seller_payout','courier_payout','platform_commission','commission_reversal','refund');
      CREATE TYPE "enum_disputes_status" AS ENUM ('open','in_review','resolved','closed');
      CREATE TYPE "enum_videos_content_type" AS ENUM ('video','reel','story');
      CREATE TYPE "enum_videos_content_purpose" AS ENUM ('product_review','shop_promotion','global_ad');
      CREATE TYPE "enum_stories_media_type" AS ENUM ('image','video');
      CREATE TYPE "enum_coupons_discount_type" AS ENUM ('percentage','fixed');
      CREATE TYPE "enum_reports_target_type" AS ENUM ('product','video','review','comment','user');
      CREATE TYPE "enum_reports_reason" AS ENUM ('spam','inappropriate','fake','copyright','violence','harassment','other');
      CREATE TYPE "enum_reports_status" AS ENUM ('pending','reviewed','resolved','dismissed');
      CREATE TYPE "enum_tickets_status" AS ENUM ('open','in_progress','resolved','closed');
      CREATE TYPE "enum_tickets_priority" AS ENUM ('low','medium','high','urgent');
      CREATE TYPE "enum_tickets_category" AS ENUM ('order','payment','delivery','product','account','technical','other');
      CREATE TYPE "enum_returns_status" AS ENUM ('pending','approved','rejected','shipped','received','refunded','closed');
      CREATE TYPE "enum_returns_reason" AS ENUM ('defective','wrong_item','not_as_described','changed_mind','damaged','other');
      CREATE TYPE "enum_notifications_type" AS ENUM ('new_order','order_confirmed','order_picked_up','order_delivered','order_cancelled','new_message','payment_received','new_follower','new_comment','new_review','product_approved','product_rejected','withdrawal_approved','withdrawal_rejected','dispute_opened','dispute_resolved','system');
      CREATE TYPE "enum_view_history_target_type" AS ENUM ('product','video');
    `);

    // ── users ──
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      phone: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(255), allowNull: true, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      first_name: { type: Sequelize.STRING(100), allowNull: false },
      last_name: { type: Sequelize.STRING(100), allowNull: false },
      role: { type: Sequelize.ENUM('admin','seller','buyer','courier'), allowNull: false, defaultValue: 'buyer' },
      avatar: { type: Sequelize.STRING(500), allowNull: true },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      language: { type: Sequelize.ENUM('en','ru','uz'), defaultValue: 'ru' },
      one_id_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      accepted_terms: { type: Sequelize.BOOLEAN, defaultValue: false },
      accepted_privacy: { type: Sequelize.BOOLEAN, defaultValue: false },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      available_balance: { type: Sequelize.DECIMAL(12,2), defaultValue: 0 },
      pending_balance: { type: Sequelize.DECIMAL(12,2), defaultValue: 0 },
      total_earnings: { type: Sequelize.DECIMAL(12,2), defaultValue: 0 },
      fcm_token: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── products ──
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      title: { type: Sequelize.STRING(255), allowNull: false },
      title_ru: { type: Sequelize.STRING(255), allowNull: true },
      title_uz: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: false },
      description_ru: { type: Sequelize.TEXT, allowNull: true },
      description_uz: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      original_price: { type: Sequelize.DECIMAL(12,2), allowNull: true },
      currency: { type: Sequelize.STRING(3), defaultValue: 'UZS' },
      category: { type: Sequelize.STRING(100), allowNull: false },
      sizes: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      colors: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      images: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      rating: { type: Sequelize.DECIMAL(3,2), defaultValue: 0 },
      review_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── product_variants ──
    await queryInterface.createTable('product_variants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      sku: { type: Sequelize.STRING(100), allowNull: false },
      color: { type: Sequelize.STRING(50), allowNull: true },
      color_hex: { type: Sequelize.STRING(7), allowNull: true },
      size: { type: Sequelize.STRING(20), allowNull: true },
      price_modifier: { type: Sequelize.DECIMAL(12,2), defaultValue: 0 },
      stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      images: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── videos ──
    await queryInterface.createTable('videos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      product_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'products', key: 'id' } },
      content_type: { type: Sequelize.ENUM('video','reel','story'), defaultValue: 'video' },
      content_purpose: { type: Sequelize.ENUM('product_review','shop_promotion','global_ad'), defaultValue: 'product_review' },
      video_url: { type: Sequelize.STRING(500), allowNull: false },
      thumbnail_url: { type: Sequelize.STRING(500), allowNull: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      title_ru: { type: Sequelize.STRING(255), allowNull: true },
      title_uz: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      description_ru: { type: Sequelize.TEXT, allowNull: true },
      description_uz: { type: Sequelize.TEXT, allowNull: true },
      duration: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      view_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      like_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      share_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_live: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      ai_extracted_title: { type: Sequelize.STRING(255), allowNull: true },
      ai_extracted_price: { type: Sequelize.DECIMAL(12,2), allowNull: true },
      ai_extracted_description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── orders ──
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      buyer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      courier_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
      video_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'videos', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      courier_fee: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      platform_commission: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      seller_amount: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: 'UZS' },
      status: { type: Sequelize.ENUM('pending','confirmed','picked_up','in_transit','delivered','cancelled','disputed'), defaultValue: 'pending' },
      payment_method: { type: Sequelize.ENUM('card','cash','cod','payme','click'), allowNull: false },
      payment_status: { type: Sequelize.ENUM('pending','held','completed','refunded','failed','cancelled'), defaultValue: 'pending' },
      shipping_address: { type: Sequelize.TEXT, allowNull: false },
      shipping_city: { type: Sequelize.STRING(100), allowNull: false },
      shipping_phone: { type: Sequelize.STRING(20), allowNull: false },
      buyer_note: { type: Sequelize.TEXT, allowNull: true },
      seller_qr_code: { type: Sequelize.TEXT, allowNull: true },
      courier_qr_code: { type: Sequelize.TEXT, allowNull: true },
      delivery_code: { type: Sequelize.STRING(6), allowNull: true },
      picked_up_at: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      cancel_reason: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── transactions ──
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      user_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      type: { type: Sequelize.ENUM('payment','escrow_hold','escrow_release','seller_payout','courier_payout','platform_commission','commission_reversal','refund'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: 'UZS' },
      status: { type: Sequelize.ENUM('pending','held','completed','refunded','failed','cancelled'), defaultValue: 'pending' },
      description: { type: Sequelize.TEXT, allowNull: false },
      reference_id: { type: Sequelize.STRING(255), allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── disputes ──
    await queryInterface.createTable('disputes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      reporter_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_admin_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      status: { type: Sequelize.ENUM('open','in_review','resolved','closed'), defaultValue: 'open' },
      reason: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      evidence: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      resolution: { type: Sequelize.TEXT, allowNull: true },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── reviews ──
    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'orders', key: 'id' } },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
      buyer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      images: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      is_verified_purchase: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── addresses ──
    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      title: { type: Sequelize.STRING(100), allowNull: false },
      full_name: { type: Sequelize.STRING(200), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: false },
      district: { type: Sequelize.STRING(100), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10,7), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(10,7), allowNull: true },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── chats ──
    await queryInterface.createTable('chats', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user1_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      user2_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      last_message_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('chats', ['user1_id', 'user2_id'], { unique: true });

    // ── messages ──
    await queryInterface.createTable('messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'orders', key: 'id' } },
      chat_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'chats', key: 'id' } },
      sender_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      receiver_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      content: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── favorites ──
    await queryInterface.createTable('favorites', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('favorites', ['user_id', 'product_id'], { unique: true });

    // ── subscriptions ──
    await queryInterface.createTable('subscriptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      follower_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('subscriptions', ['follower_id', 'seller_id'], { unique: true });

    // ── comments ──
    await queryInterface.createTable('comments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      video_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'videos', key: 'id' } },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      text: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── tickets ──
    await queryInterface.createTable('tickets', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      order_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'orders', key: 'id' } },
      category: { type: Sequelize.ENUM('order','payment','delivery','product','account','technical','other'), allowNull: false },
      subject: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      priority: { type: Sequelize.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
      status: { type: Sequelize.ENUM('open','in_progress','resolved','closed'), defaultValue: 'open' },
      assigned_to: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      admin_notes: { type: Sequelize.TEXT, allowNull: true },
      resolution: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── reports ──
    await queryInterface.createTable('reports', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reporter_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      target_type: { type: Sequelize.ENUM('product','video','review','comment','user'), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      reason: { type: Sequelize.ENUM('spam','inappropriate','fake','copyright','violence','harassment','other'), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('pending','reviewed','resolved','dismissed'), defaultValue: 'pending' },
      admin_notes: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── stories ──
    await queryInterface.createTable('stories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      media_url: { type: Sequelize.STRING(500), allowNull: false },
      media_type: { type: Sequelize.ENUM('image','video'), allowNull: false, defaultValue: 'image' },
      thumbnail_url: { type: Sequelize.STRING(500), allowNull: true },
      caption: { type: Sequelize.STRING(500), allowNull: true },
      product_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'products', key: 'id' } },
      view_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── view_history ──
    await queryInterface.createTable('view_history', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      target_type: { type: Sequelize.ENUM('product','video'), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      viewed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('view_history', ['user_id', 'target_type']);
    await queryInterface.addIndex('view_history', ['user_id', 'target_id', 'target_type'], { unique: true });

    // ── notifications ──
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      type: { type: Sequelize.ENUM('new_order','order_confirmed','order_picked_up','order_delivered','order_cancelled','new_message','payment_received','new_follower','new_comment','new_review','product_approved','product_rejected','withdrawal_approved','withdrawal_rejected','dispute_opened','dispute_resolved','system'), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      data: { type: Sequelize.JSONB, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── carts ──
    await queryInterface.createTable('carts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── cart_items ──
    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cart_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'carts', key: 'id' } },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
      variant_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'product_variants', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('cart_items', ['cart_id', 'product_id', 'variant_id'], { unique: true });

    // ── coupons ──
    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      discount_type: { type: Sequelize.ENUM('percentage','fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      min_order_amount: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      max_discount: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      usage_limit: { type: Sequelize.INTEGER, allowNull: true },
      used_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      seller_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // ── returns ──
    await queryInterface.createTable('returns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      buyer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      reason: { type: Sequelize.ENUM('defective','wrong_item','not_as_described','changed_mind','damaged','other'), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      images: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      status: { type: Sequelize.ENUM('pending','approved','rejected','shipped','received','refunded','closed'), defaultValue: 'pending' },
      refund_amount: { type: Sequelize.DECIMAL(12,2), allowNull: true },
      admin_notes: { type: Sequelize.TEXT, allowNull: true },
      seller_response: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    const tables = [
      'returns','coupons','cart_items','carts','notifications','view_history',
      'stories','reports','tickets','comments','subscriptions','favorites',
      'messages','chats','addresses','reviews','disputes','transactions',
      'orders','videos','product_variants','products','users'
    ];
    for (const t of tables) {
      await queryInterface.dropTable(t, { cascade: true });
    }
    // Drop all custom enums
    const enums = await queryInterface.sequelize.query(
      `SELECT typname FROM pg_type WHERE typname LIKE 'enum_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    for (const e of enums) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${e.typname}" CASCADE`);
    }
  },
};
