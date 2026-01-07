import { Request, Response } from 'express';
import { Order, User, Transaction } from '../models';
import { AuthRequest } from '../middleware/auth';
import { PaymentStatus, TransactionType, OrderStatus } from '../types';
import paymentService from '../services/paymentService';

// Initialize payment - returns payment URL for Payme or Click
export const initializePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { orderId, provider } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!['payme', 'click'].includes(provider)) {
      res.status(400).json({ success: false, error: 'Invalid payment provider. Use "payme" or "click".' });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    if (order.buyerId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const result = await paymentService.initializePayment(orderId, provider);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({
      success: true,
      data: {
        paymentUrl: result.paymentUrl,
        orderId: order.id,
        amount: order.totalAmount,
        provider,
      },
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  }
};

// Payme webhook handler
export const paymeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || '';
    
    if (!paymentService.verifyPaymeAuth(authHeader)) {
      res.json({ error: { code: -32504, message: 'Unauthorized' } });
      return;
    }

    const { method, params, id } = req.body;
    const result = await paymentService.handlePaymeRequest(method, params || {});

    res.json({ id, ...result });
  } catch (error) {
    console.error('Payme webhook error:', error);
    res.json({ error: { code: -32400, message: 'Internal error' } });
  }
};

// Click webhook handler
export const clickWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body;

    if (params.action === 0) {
      // Prepare
      const result = await paymentService.handleClickPrepare(params);
      res.json(result);
    } else if (params.action === 1) {
      // Complete
      const result = await paymentService.handleClickComplete(params);
      res.json(result);
    } else {
      res.json({ error: -3, error_note: 'Invalid action' });
    }
  } catch (error) {
    console.error('Click webhook error:', error);
    res.json({ error: -8, error_note: 'Internal error' });
  }
};

// Mock payment - simulates Payme/Click payment (for testing)
export const mockPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { orderId } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    if (order.buyerId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      res.status(400).json({ success: false, error: 'Order already paid or processed.' });
      return;
    }

    // Update order payment status to HELD (escrow)
    order.paymentStatus = PaymentStatus.HELD;
    await order.save();

    // Update the PAYMENT transaction to HELD
    await Transaction.update(
      { status: PaymentStatus.HELD },
      { where: { orderId: order.id, type: TransactionType.PAYMENT } }
    );

    // The PLATFORM_COMMISSION was already created with HELD status in createOrder

    res.json({
      success: true,
      message: 'Payment successful (mock)',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ success: false, error: 'Payment failed' });
  }
};

// Get financial overview for admin dashboard
export const getFinancialOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Admin access required.' });
      return;
    }

    // Total sales (completed orders)
    const totalSalesResult = await Order.sum('totalAmount', {
      where: { status: OrderStatus.DELIVERED },
    });
    const totalSales = totalSalesResult || 0;

    // Total platform profit (completed commissions)
    const totalProfitResult = await Transaction.sum('amount', {
      where: { 
        type: TransactionType.PLATFORM_COMMISSION,
        status: PaymentStatus.COMPLETED,
      },
    });
    const totalProfit = totalProfitResult || 0;

    // Pending commissions (held)
    const pendingProfitResult = await Transaction.sum('amount', {
      where: { 
        type: TransactionType.PLATFORM_COMMISSION,
        status: PaymentStatus.HELD,
      },
    });
    const pendingProfit = pendingProfitResult || 0;

    // Pending payouts to sellers
    const pendingSellerPayoutsResult = await Order.sum('sellerAmount', {
      where: { 
        status: [OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT],
        paymentStatus: PaymentStatus.HELD,
      },
    });
    const pendingSellerPayouts = pendingSellerPayoutsResult || 0;

    // Pending payouts to couriers
    const pendingCourierPayoutsResult = await Order.sum('courierFee', {
      where: { 
        status: [OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT],
        paymentStatus: PaymentStatus.HELD,
      },
    });
    const pendingCourierPayouts = pendingCourierPayoutsResult || 0;

    // Order counts
    const totalOrders = await Order.count();
    const deliveredOrders = await Order.count({ where: { status: OrderStatus.DELIVERED } });
    const pendingOrders = await Order.count({ 
      where: { status: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT] } 
    });
    const cancelledOrders = await Order.count({ where: { status: OrderStatus.CANCELLED } });

    res.json({
      success: true,
      data: {
        totalSales: Number(totalSales),
        totalProfit: Number(totalProfit),
        pendingProfit: Number(pendingProfit),
        pendingPayouts: {
          sellers: Number(pendingSellerPayouts),
          couriers: Number(pendingCourierPayouts),
          total: Number(pendingSellerPayouts) + Number(pendingCourierPayouts),
        },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
        },
      },
    });
  } catch (error) {
    console.error('Financial overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to get financial overview' });
  }
};

// Get seller's wallet/balance
export const getSellerWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || (user.role !== 'seller' && user.role !== 'courier')) {
      res.status(403).json({ success: false, error: 'Seller or courier access required.' });
      return;
    }

    const userData = await User.findByPk(user.id);
    if (!userData) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        availableBalance: Number(userData.availableBalance) || 0,
        pendingBalance: Number(userData.pendingBalance) || 0,
        totalEarnings: Number(userData.totalEarnings) || 0,
      },
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ success: false, error: 'Failed to get wallet' });
  }
};
