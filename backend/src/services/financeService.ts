/**
 * Finance Service - Centralized Financial Logic for GoGoMarket
 * 
 * This service is the single source of truth for all financial calculations.
 * All controllers MUST use this service for financial operations.
 * 
 * Key responsibilities:
 * - Order total calculations (with coupon support)
 * - Commission calculations
 * - Courier fee calculations
 * - Fund distribution upon delivery
 * - Financial statistics and reporting
 */

import { Order, User, Transaction, Product } from '../models';
import Coupon from '../models/Coupon';
import { config } from '../config';
import { TransactionType, PaymentStatus, OrderStatus } from '../types';
import { Op } from 'sequelize';

// Types for financial calculations
export interface OrderTotals {
  subtotal: number;           // Price * quantity (before discount)
  discount: number;           // Coupon discount amount
  courierFee: number;         // Delivery fee
  totalAmount: number;        // Final amount (subtotal - discount + courierFee)
  platformCommission: number; // Platform's cut (from subtotal - discount)
  sellerAmount: number;       // What seller receives (subtotal - discount - commission)
}

export interface MultiSellerOrderTotals {
  items: Array<{
    sellerId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discount: number;          // Proportional discount for this seller
    platformCommission: number;
    sellerAmount: number;
  }>;
  totalSubtotal: number;
  totalDiscount: number;
  courierFee: number;
  grandTotal: number;
  totalCommission: number;
}

export interface FinancialStats {
  totalSales: number;
  totalProfit: number;
  pendingProfit: number;
  pendingSellerPayouts: number;
  pendingCourierPayouts: number;
  orderCounts: {
    total: number;
    delivered: number;
    pending: number;
    cancelled: number;
  };
}

class FinanceService {
  private platformCommissionRate: number;
  private defaultCourierFee: number;

  constructor() {
    this.platformCommissionRate = config.platformCommission; // Default: 0.10 (10%)
    this.defaultCourierFee = config.courierFeeDefault;       // Default: 15000 UZS
  }

  // ============================================================
  // ORDER TOTAL CALCULATIONS
  // ============================================================

  /**
   * Calculate order totals for a single product order
   * Supports coupon discounts
   */
  calculateOrderTotals(
    unitPrice: number,
    quantity: number,
    couponDiscount: number = 0,
    courierFee?: number
  ): OrderTotals {
    const subtotal = unitPrice * quantity;
    const discount = Math.min(couponDiscount, subtotal); // Discount cannot exceed subtotal
    const discountedSubtotal = subtotal - discount;
    
    // Commission is calculated AFTER discount is applied
    const platformCommission = Math.round(discountedSubtotal * this.platformCommissionRate);
    const sellerAmount = discountedSubtotal - platformCommission;
    const actualCourierFee = courierFee ?? this.defaultCourierFee;
    const totalAmount = discountedSubtotal + actualCourierFee;

    return {
      subtotal,
      discount,
      courierFee: actualCourierFee,
      totalAmount,
      platformCommission,
      sellerAmount,
    };
  }

  /**
   * Calculate order totals for multi-seller cart checkout
   * Distributes coupon discount proportionally across sellers
   */
  calculateMultiSellerOrderTotals(
    items: Array<{
      sellerId: string;
      productId: string;
      unitPrice: number;
      quantity: number;
    }>,
    totalCouponDiscount: number = 0,
    courierFee?: number
  ): MultiSellerOrderTotals {
    // Calculate total subtotal first (for proportional distribution)
    const totalSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Limit discount to total subtotal
    const effectiveDiscount = Math.min(totalCouponDiscount, totalSubtotal);

    // Calculate each seller's portion with proportional discount
    const calculatedItems = items.map((item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      
      // Proportional discount: (item's subtotal / total subtotal) * total discount
      const proportionalDiscount = totalSubtotal > 0
        ? Math.round((itemSubtotal / totalSubtotal) * effectiveDiscount)
        : 0;
      
      const discountedItemTotal = itemSubtotal - proportionalDiscount;
      const platformCommission = Math.round(discountedItemTotal * this.platformCommissionRate);
      const sellerAmount = discountedItemTotal - platformCommission;

      return {
        sellerId: item.sellerId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: itemSubtotal,
        discount: proportionalDiscount,
        platformCommission,
        sellerAmount,
      };
    });

    const actualCourierFee = courierFee ?? this.defaultCourierFee;
    const totalCommission = calculatedItems.reduce((sum, item) => sum + item.platformCommission, 0);
    const grandTotal = totalSubtotal - effectiveDiscount + actualCourierFee;

    return {
      items: calculatedItems,
      totalSubtotal,
      totalDiscount: effectiveDiscount,
      courierFee: actualCourierFee,
      grandTotal,
      totalCommission,
    };
  }

  // ============================================================
  // COMMISSION CALCULATIONS
  // ============================================================

  /**
   * Calculate platform commission for an amount
   * Commission is always calculated AFTER discount is applied
   */
  calculateCommission(amountAfterDiscount: number): number {
    return Math.round(amountAfterDiscount * this.platformCommissionRate);
  }

  /**
   * Get commission rate
   */
  getCommissionRate(): number {
    return this.platformCommissionRate;
  }

  // ============================================================
  // COURIER FEE CALCULATIONS
  // ============================================================

  /**
   * Calculate courier fee
   * Can be fixed or percentage-based in the future
   */
  calculateCourierFee(
    _totalAmount?: number,
    _distance?: number,
    customFee?: number
  ): number {
    // Currently using fixed fee
    // TODO: Can be extended for distance-based or percentage-based fees
    if (customFee !== undefined) {
      return customFee;
    }
    return this.defaultCourierFee;
  }

  /**
   * Get default courier fee
   */
  getDefaultCourierFee(): number {
    return this.defaultCourierFee;
  }

  // ============================================================
  // COUPON VALIDATION & DISCOUNT CALCULATION
  // ============================================================

  /**
   * Validate coupon and calculate discount amount
   */
  async validateAndCalculateCouponDiscount(
    couponCode: string,
    orderAmount: number,
    sellerId?: string
  ): Promise<{ valid: boolean; discount: number; error?: string; coupon?: Coupon }> {
    if (!couponCode) {
      return { valid: false, discount: 0, error: 'Coupon code is required' };
    }

    const coupon = await Coupon.findOne({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return { valid: false, discount: 0, error: 'Coupon not found or inactive' };
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, discount: 0, error: 'Coupon has expired' };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, error: 'Coupon usage limit reached' };
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return {
        valid: false,
        discount: 0,
        error: `Minimum order amount is ${coupon.minOrderAmount} UZS`,
      };
    }

    // Check if coupon is seller-specific
    if (coupon.sellerId && sellerId && coupon.sellerId !== sellerId) {
      return {
        valid: false,
        discount: 0,
        error: 'This coupon is not valid for this seller',
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round(orderAmount * (Number(coupon.discountValue) / 100));
      // Apply max discount cap
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      // Fixed amount discount
      discount = Number(coupon.discountValue);
    }

    // Discount cannot exceed order amount
    discount = Math.min(discount, orderAmount);

    return { valid: true, discount, coupon };
  }

  // ============================================================
  // FUND DISTRIBUTION (On Delivery)
  // ============================================================

  /**
   * Distribute funds when order is delivered
   * This is the core financial transaction that moves money from escrow
   * to seller and courier accounts
   */
  async distributeFunds(order: Order): Promise<{
    success: boolean;
    sellerPayout: number;
    courierPayout: number;
    platformCommission: number;
    error?: string;
  }> {
    try {
      const sellerAmount = Number(order.sellerAmount);
      const courierFee = Number(order.courierFee);
      const platformCommission = Number(order.platformCommission);

      // 1. Create seller payout transaction
      await Transaction.create({
        orderId: order.id,
        userId: order.sellerId,
        type: TransactionType.SELLER_PAYOUT,
        amount: sellerAmount,
        currency: 'UZS',
        status: PaymentStatus.COMPLETED,
        description: `Seller payout for order ${order.orderNumber}`,
      });

      // 2. Update seller's balance
      const seller = await User.findByPk(order.sellerId);
      if (seller) {
        seller.availableBalance = Number(seller.availableBalance || 0) + sellerAmount;
        seller.totalEarnings = Number(seller.totalEarnings || 0) + sellerAmount;
        await seller.save();
      }

      // 3. Create courier payout transaction (if courier is assigned)
      if (order.courierId) {
        await Transaction.create({
          orderId: order.id,
          userId: order.courierId,
          type: TransactionType.COURIER_PAYOUT,
          amount: courierFee,
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Courier fee for order ${order.orderNumber}`,
        });

        // 4. Update courier's balance
        const courier = await User.findByPk(order.courierId);
        if (courier) {
          courier.availableBalance = Number(courier.availableBalance || 0) + courierFee;
          courier.totalEarnings = Number(courier.totalEarnings || 0) + courierFee;
          await courier.save();
        }
      }

      // 5. Update platform commission status from HELD to COMPLETED
      const heldCommission = await Transaction.findOne({
        where: {
          orderId: order.id,
          type: TransactionType.PLATFORM_COMMISSION,
          status: PaymentStatus.HELD,
        },
      });

      if (heldCommission) {
        heldCommission.status = PaymentStatus.COMPLETED;
        heldCommission.description = `Platform commission for order ${order.orderNumber}`;
        await heldCommission.save();
      } else {
        // Fallback: create commission if not found (legacy orders)
        await Transaction.create({
          orderId: order.id,
          type: TransactionType.PLATFORM_COMMISSION,
          amount: platformCommission,
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Platform commission for order ${order.orderNumber}`,
        });
      }

      return {
        success: true,
        sellerPayout: sellerAmount,
        courierPayout: courierFee,
        platformCommission,
      };
    } catch (error) {
      console.error('Fund distribution error:', error);
      return {
        success: false,
        sellerPayout: 0,
        courierPayout: 0,
        platformCommission: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reverse funds when order is cancelled
   */
  async reverseFunds(order: Order): Promise<{ success: boolean; error?: string }> {
    try {
      // Handle commission reversal
      const heldCommission = await Transaction.findOne({
        where: {
          orderId: order.id,
          type: TransactionType.PLATFORM_COMMISSION,
          status: PaymentStatus.HELD,
        },
      });

      if (heldCommission) {
        heldCommission.status = PaymentStatus.REFUNDED;
        heldCommission.description = `Platform commission (reversed) for cancelled order ${order.orderNumber}`;
        await heldCommission.save();

        // Create reversal transaction for audit trail
        await Transaction.create({
          orderId: order.id,
          type: TransactionType.COMMISSION_REVERSAL,
          amount: -Number(order.platformCommission),
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Commission reversal for cancelled order ${order.orderNumber}`,
        });
      }

      // Create refund transaction for buyer
      await Transaction.create({
        orderId: order.id,
        userId: order.buyerId,
        type: TransactionType.REFUND,
        amount: Number(order.totalAmount),
        currency: 'UZS',
        status: PaymentStatus.COMPLETED,
        description: `Refund for cancelled order ${order.orderNumber}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Fund reversal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================
  // FINANCIAL STATISTICS (For Admin Dashboard)
  // ============================================================

  /**
   * Get comprehensive financial statistics
   * This is the ONLY method admin dashboard should use for financial data
   */
  async getFinancialStats(): Promise<FinancialStats> {
    // Total sales from delivered orders
    const totalSalesResult = await Order.sum('totalAmount', {
      where: { status: OrderStatus.DELIVERED },
    });
    const totalSales = Number(totalSalesResult) || 0;

    // Total platform profit (completed commissions)
    const totalProfitResult = await Transaction.sum('amount', {
      where: {
        type: TransactionType.PLATFORM_COMMISSION,
        status: PaymentStatus.COMPLETED,
      },
    });
    const totalProfit = Number(totalProfitResult) || 0;

    // Pending commissions (held)
    const pendingProfitResult = await Transaction.sum('amount', {
      where: {
        type: TransactionType.PLATFORM_COMMISSION,
        status: PaymentStatus.HELD,
      },
    });
    const pendingProfit = Number(pendingProfitResult) || 0;

    // Pending seller payouts (orders in transit)
    const pendingSellerPayoutsResult = await Order.sum('sellerAmount', {
      where: {
        status: {
          [Op.in]: [OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT],
        },
        paymentStatus: PaymentStatus.HELD,
      },
    });
    const pendingSellerPayouts = Number(pendingSellerPayoutsResult) || 0;

    // Pending courier payouts
    const pendingCourierPayoutsResult = await Order.sum('courierFee', {
      where: {
        status: {
          [Op.in]: [OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT],
        },
        paymentStatus: PaymentStatus.HELD,
      },
    });
    const pendingCourierPayouts = Number(pendingCourierPayoutsResult) || 0;

    // Order counts
    const totalOrders = await Order.count();
    const deliveredOrders = await Order.count({ where: { status: OrderStatus.DELIVERED } });
    const pendingOrders = await Order.count({
      where: {
        status: {
          [Op.in]: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT],
        },
      },
    });
    const cancelledOrders = await Order.count({ where: { status: OrderStatus.CANCELLED } });

    return {
      totalSales,
      totalProfit,
      pendingProfit,
      pendingSellerPayouts,
      pendingCourierPayouts,
      orderCounts: {
        total: totalOrders,
        delivered: deliveredOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
      },
    };
  }

  /**
   * Get seller-specific financial stats
   */
  async getSellerStats(sellerId: string): Promise<{
    totalSales: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    availableBalance: number;
    pendingBalance: number;
    totalEarnings: number;
  }> {
    const totalSalesResult = await Order.sum('sellerAmount', {
      where: { sellerId, status: OrderStatus.DELIVERED },
    });
    const totalSales = Number(totalSalesResult) || 0;

    const totalOrders = await Order.count({ where: { sellerId } });
    const pendingOrders = await Order.count({
      where: {
        sellerId,
        status: { [Op.in]: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
      },
    });
    const completedOrders = await Order.count({
      where: { sellerId, status: OrderStatus.DELIVERED },
    });

    const seller = await User.findByPk(sellerId);

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      completedOrders,
      availableBalance: Number(seller?.availableBalance) || 0,
      pendingBalance: Number(seller?.pendingBalance) || 0,
      totalEarnings: Number(seller?.totalEarnings) || 0,
    };
  }

  /**
   * Get courier-specific financial stats
   */
  async getCourierStats(courierId: string): Promise<{
    totalDeliveries: number;
    totalEarnings: number;
    todayEarnings: number;
    availableBalance: number;
    pendingBalance: number;
  }> {
    const totalDeliveries = await Order.count({
      where: { courierId, status: OrderStatus.DELIVERED },
    });

    const totalEarningsResult = await Order.sum('courierFee', {
      where: { courierId, status: OrderStatus.DELIVERED },
    });
    const totalEarnings = Number(totalEarningsResult) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarningsResult = await Order.sum('courierFee', {
      where: {
        courierId,
        status: OrderStatus.DELIVERED,
        deliveredAt: { [Op.gte]: today },
      },
    });
    const todayEarnings = Number(todayEarningsResult) || 0;

    const courier = await User.findByPk(courierId);

    return {
      totalDeliveries,
      totalEarnings,
      todayEarnings,
      availableBalance: Number(courier?.availableBalance) || 0,
      pendingBalance: Number(courier?.pendingBalance) || 0,
    };
  }

  // ============================================================
  // TRANSACTION HISTORY
  // ============================================================

  /**
   * Get transaction history with proper filtering
   */
  async getTransactionHistory(
    filters: {
      userId?: string;
      orderId?: string;
      type?: TransactionType;
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: { page: number; limit: number }
  ) {
    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>)[Op.gte as unknown as string] = filters.startDate;
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>)[Op.lte as unknown as string] = filters.endDate;
      }
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] },
        { model: Order, as: 'order', attributes: ['id', 'orderNumber'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: pagination.limit,
      offset,
    });

    return {
      transactions,
      pagination: {
        total: count,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(count / pagination.limit),
      },
    };
  }
}

// Export singleton instance
const financeService = new FinanceService();
export default financeService;
