import { Response } from 'express';
import { Op } from 'sequelize';
import { Order, Product, User, Transaction, Video } from '../models';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus, PaymentStatus, TransactionType, UserRole } from '../types';
import qrService from '../services/qrService';
import smsService from '../services/smsService';
import notificationService from '../services/notificationService';
import financeService from '../services/financeService';
import orderStateMachine from '../services/orderStateMachine';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    const {
      productId,
      videoId,
      quantity,
      paymentMethod,
      shippingAddress,
      shippingCity,
      shippingPhone,
      buyerNote,
    } = req.body;

    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        error: 'Product not found or unavailable.',
      });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        error: 'Insufficient stock.',
      });
      return;
    }

    // CRITICAL: Use atomic decrement to prevent race condition
    // This prevents multiple buyers from purchasing the last item simultaneously
    const [affectedRows] = await Product.update(
      { stock: product.stock - quantity },
      { 
        where: { 
          id: productId, 
          stock: { [Op.gte]: quantity } // Only update if stock >= quantity
        } 
      }
    );

    if (affectedRows === 0) {
      res.status(400).json({
        success: false,
        error: 'Insufficient stock. Item may have been purchased by another buyer.',
      });
      return;
    }

    // Refresh product to get updated stock
    await product.reload();

    const unitPrice = Number(product.price);
    
    // Use centralized finance service for calculations
    // Support for coupon discount (passed in request body)
    const { couponCode } = req.body;
    let couponDiscount = 0;
    
    if (couponCode) {
      const couponResult = await financeService.validateAndCalculateCouponDiscount(
        couponCode,
        unitPrice * quantity,
        product.sellerId
      );
      if (couponResult.valid) {
        couponDiscount = couponResult.discount;
        // Increment coupon usage
        if (couponResult.coupon) {
          await couponResult.coupon.update({ usedCount: couponResult.coupon.usedCount + 1 });
        }
      }
    }
    
    // Calculate all financial totals using centralized service
    const orderTotals = financeService.calculateOrderTotals(unitPrice, quantity, couponDiscount);
    
    const { qrCode: sellerQrCode } = await qrService.generateSellerQr('temp');

    // Generate orderNumber explicitly
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `GGM-${timestamp}-${random}`;

    const order = await Order.create({
      buyerId: user.id,
      sellerId: product.sellerId,
      productId,
      videoId,
      quantity,
      unitPrice,
      totalAmount: orderTotals.totalAmount,
      courierFee: orderTotals.courierFee,
      platformCommission: orderTotals.platformCommission,
      sellerAmount: orderTotals.sellerAmount,
      currency: 'UZS',
      status: OrderStatus.PENDING,
      paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      shippingAddress,
      shippingCity,
      shippingPhone,
      buyerNote,
      orderNumber,
      sellerQrCode,
    });

    const { qrCode: updatedSellerQr } = await qrService.generateSellerQr(order.id);
    order.sellerQrCode = updatedSellerQr;
    await order.save();

    // Stock already decremented atomically above

    // Create PAYMENT transaction (buyer's payment)
    await Transaction.create({
      orderId: order.id,
      userId: user.id,
      type: TransactionType.PAYMENT,
      amount: orderTotals.totalAmount,
      currency: 'UZS',
      status: PaymentStatus.PENDING,
      description: `Payment for order ${order.orderNumber}${couponDiscount > 0 ? ` (discount: ${couponDiscount} UZS)` : ''}`,
    });

    // Create PLATFORM_COMMISSION transaction with HELD status (two-phase model)
    // Commission is recorded immediately but only completed upon delivery
    await Transaction.create({
      orderId: order.id,
      type: TransactionType.PLATFORM_COMMISSION,
      amount: orderTotals.platformCommission,
      currency: 'UZS',
      status: PaymentStatus.HELD,
      description: `Platform commission (held) for order ${order.orderNumber}`,
    });

    // Notify seller about new order
    const productForNotify = await Product.findByPk(productId);
    if (productForNotify) {
      await notificationService.notifyNewOrder(product.sellerId, order.orderNumber, productForNotify.title);
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};

    if (user.role === UserRole.BUYER) {
      where.buyerId = user.id;
    } else if (user.role === UserRole.SELLER) {
      where.sellerId = user.id;
    } else if (user.role === UserRole.COURIER) {
      where.courierId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images', 'price'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
        {
          model: User,
          as: 'courier',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
        },
        {
          model: Video,
          as: 'video',
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'avatar'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'avatar'],
        },
        {
          model: User,
          as: 'courier',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'avatar'],
        },
        {
          model: Transaction,
          as: 'transactions',
        },
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (
      user?.role !== UserRole.ADMIN &&
      order.buyerId !== user?.id &&
      order.sellerId !== user?.id &&
      order.courierId !== user?.id
    ) {
      res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order',
    });
  }
};

export const confirmOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (order.sellerId !== user?.id && user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only the seller can confirm this order.',
      });
      return;
    }

    // Use state machine to validate transition
    const transition = orderStateMachine.validateTransition(order.status, OrderStatus.CONFIRMED);
    if (!transition.valid) {
      res.status(400).json({
        success: false,
        error: transition.error || 'Order cannot be confirmed in current status.',
      });
      return;
    }

    order.status = OrderStatus.CONFIRMED;
    await order.save();
    // Notify buyer about order confirmation
    await notificationService.notifyOrderConfirmed(order.buyerId, order.orderNumber);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm order',
    });
  }
};

// Seller hands over package to courier (simulates QR1 scan)
export const handoverToCourier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (order.sellerId !== user?.id && user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only the seller can handover this order.',
      });
      return;
    }

    // Use state machine to validate transition
    const transition = orderStateMachine.validateTransition(order.status, OrderStatus.PICKED_UP);
    if (!transition.valid) {
      res.status(400).json({
        success: false,
        error: transition.error || 'Order must be confirmed before handover.',
      });
      return;
    }

    // Generate courier QR and delivery code if not already assigned
    if (!order.courierQrCode) {
      const { qrCode: courierQrCode } = await qrService.generateCourierQr(order.id);
      const deliveryCode = smsService.generateDeliveryCode();
      order.courierQrCode = courierQrCode;
      order.deliveryCode = deliveryCode;
      
      // Send delivery code to buyer
      await smsService.sendDeliveryCode(order.shippingPhone, deliveryCode, order.orderNumber);
    }

    order.status = OrderStatus.PICKED_UP;
    order.pickedUpAt = new Date();
    // Notify buyer about pickup
    await notificationService.notifyOrderPickedUp(order.buyerId, order.orderNumber);
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Package handed over to courier successfully.',
    });
  } catch (error) {
    console.error('Handover to courier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handover to courier',
    });
  }
};

export const assignCourier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { courierId } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (order.sellerId !== user?.id && user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only the seller or admin can assign a courier.',
      });
      return;
    }

    const courier = await User.findByPk(courierId);
    if (!courier || courier.role !== UserRole.COURIER) {
      res.status(404).json({
        success: false,
        error: 'Courier not found.',
      });
      return;
    }

    const { qrCode: courierQrCode } = await qrService.generateCourierQr(order.id);
    const deliveryCode = smsService.generateDeliveryCode();

    order.courierId = courierId;
    order.courierQrCode = courierQrCode;
    order.deliveryCode = deliveryCode;
    await order.save();

    await smsService.sendDeliveryCode(order.shippingPhone, deliveryCode, order.orderNumber);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Assign courier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign courier',
    });
  }
};

export const scanPickupQr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { qrData } = req.body;

    if (user?.role !== UserRole.COURIER) {
      res.status(403).json({
        success: false,
        error: 'Only couriers can scan pickup QR codes.',
      });
      return;
    }

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (order.courierId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'This order is not assigned to you.',
      });
      return;
    }

    const parsedQr = qrService.parseQrCode(qrData);
    if (!parsedQr) {
      res.status(400).json({
        success: false,
        error: 'Invalid QR code format.',
      });
      return;
    }
    
    const qrValidation = qrService.validateQrCode(parsedQr, order.id, 'seller_pickup');
    if (!qrValidation.valid) {
      res.status(400).json({
        success: false,
        error: qrValidation.error || 'Invalid QR code.',
      });
      return;
    }

    order.status = OrderStatus.PICKED_UP;
    order.pickedUpAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Scan pickup QR error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process QR scan',
    });
  }
};

export const confirmDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { qrData, deliveryCode } = req.body;

    if (user?.role !== UserRole.COURIER) {
      res.status(403).json({
        success: false,
        error: 'Only couriers can confirm delivery.',
      });
      return;
    }

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (order.courierId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'This order is not assigned to you.',
      });
      return;
    }

    // Use state machine to validate transition
    const transition = orderStateMachine.validateTransition(order.status, OrderStatus.DELIVERED);
    if (!transition.valid) {
      res.status(400).json({
        success: false,
        error: transition.error || 'Order must be picked up before delivery.',
      });
      return;
    }

    let isValid = false;

    if (qrData) {
      const parsedQr = qrService.parseQrCode(qrData);
      if (parsedQr) {
        const qrValidation = qrService.validateQrCode(parsedQr, order.id, 'courier_delivery');
        isValid = qrValidation.valid;
      }
    }

    if (!isValid && deliveryCode) {
      isValid = order.deliveryCode === deliveryCode;
    }

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid QR code or delivery code.',
      });
      return;
    }

    // Update order status
    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.paymentStatus = PaymentStatus.COMPLETED;
    await order.save();

    // Notify buyer and seller about delivery
    await notificationService.notifyOrderDelivered(order.buyerId, order.sellerId, order.orderNumber);

    // Use centralized finance service to distribute funds
    // This ensures consistent fund distribution across the application
    const fundDistribution = await financeService.distributeFunds(order);
    if (!fundDistribution.success) {
      console.error('Fund distribution failed:', fundDistribution.error);
      // Order is still marked as delivered, but log the error
      // In production, this should trigger an alert
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm delivery',
    });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (
      order.buyerId !== user?.id &&
      order.sellerId !== user?.id &&
      user?.role !== UserRole.ADMIN
    ) {
      res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
      return;
    }

    // Use state machine to validate cancellation
    if (!orderStateMachine.canCancel(order.status)) {
      res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled in its current status.',
      });
      return;
    }

    // Restore product stock
    const product = await Product.findByPk(order.productId);
    if (product) {
      product.stock += order.quantity;
      await product.save();
    }

    // Check if payment was held (for fund reversal)
    const paymentWasHeld = order.paymentStatus === PaymentStatus.HELD;

    // Update order status
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.paymentStatus = PaymentStatus.REFUNDED;
    await order.save();

    // Use centralized finance service to reverse funds
    // This handles commission reversal and refund creation
    // paymentWasHeld indicates money was held in escrow and needs to be reversed
    if (paymentWasHeld) {
      const reversal = await financeService.reverseFunds(order);
      if (!reversal.success) {
        console.error('Fund reversal failed:', reversal.error);
        // Order is still cancelled, but log the error
      }
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
};

export const getAvailableOrdersForCourier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (user?.role !== UserRole.COURIER) {
      res.status(403).json({
        success: false,
        error: 'Only couriers can view available orders.',
      });
      return;
    }

    const { page = 1, limit = 20, city } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      status: OrderStatus.CONFIRMED,
      courierId: null,
    };

    if (city) {
      where.shippingCity = city;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'ASC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available orders',
    });
  }
};

export const acceptOrderAsCourier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (user?.role !== UserRole.COURIER) {
      res.status(403).json({
        success: false,
        error: 'Only couriers can accept orders.',
      });
      return;
    }

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found.',
      });
      return;
    }

    if (order.status !== OrderStatus.CONFIRMED || order.courierId) {
      res.status(400).json({
        success: false,
        error: 'Order is not available for pickup.',
      });
      return;
    }

    const { qrCode: courierQrCode } = await qrService.generateCourierQr(order.id);
    const deliveryCode = smsService.generateDeliveryCode();

    order.courierId = user.id;
    order.courierQrCode = courierQrCode;
    order.deliveryCode = deliveryCode;
    await order.save();

    await smsService.sendDeliveryCode(order.shippingPhone, deliveryCode, order.orderNumber);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept order',
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'Status is required.' });
      return;
    }

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    // Check permissions
    const isSeller = order.sellerId === user?.id;
    const isCourier = order.courierId === user?.id;
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isSeller && !isCourier && !isAdmin) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Use state machine to validate transition (strict enforcement)
    const transition = orderStateMachine.validateTransition(order.status, status);
    if (!transition.valid) {
      res.status(400).json({
        success: false,
        error: transition.error || 'Invalid status transition.',
        validTransitions: orderStateMachine.getValidNextStatuses(order.status),
      });
      return;
    }

    const previousStatus = order.status;
    order.status = status;

    // Handle special status transitions
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
      order.paymentStatus = PaymentStatus.COMPLETED;
      await order.save();
      
      // Distribute funds on delivery
      await financeService.distributeFunds(order);
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      order.paymentStatus = PaymentStatus.REFUNDED;
      await order.save();
      
      // Reverse funds on cancellation
      const paymentWasHeld = previousStatus !== OrderStatus.PENDING;
      if (paymentWasHeld) {
        await financeService.reverseFunds(order);
      }
    } else {
      await order.save();
    }

    res.json({
      success: true,
      data: order,
      message: 'Order status updated.',
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
};

export const getOrderQr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    // Check permissions - buyer, seller, courier, or admin can view QR
    if (
      user?.role !== UserRole.ADMIN &&
      order.buyerId !== user?.id &&
      order.sellerId !== user?.id &&
      order.courierId !== user?.id
    ) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        sellerQrCode: order.sellerQrCode,
        courierQrCode: order.courierQrCode,
        deliveryCode: order.deliveryCode,
      },
    });
  } catch (error) {
    console.error('Get order QR error:', error);
    res.status(500).json({ success: false, error: 'Failed to get order QR' });
  }
};

export const verifyOrderQr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { qrData } = req.body;

    if (!qrData) {
      res.status(400).json({ success: false, error: 'QR data is required.' });
      return;
    }

    const parsedQr = qrService.parseQrCode(qrData);
    if (!parsedQr) {
      res.status(400).json({ success: false, error: 'Invalid QR code format.' });
      return;
    }

    const order = await Order.findByPk(parsedQr.orderId, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
      ],
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found.' });
      return;
    }

    // Validate QR code
    let isValid = false;
    let qrType = '';
    let validationError = '';

    const sellerValidation = qrService.validateQrCode(parsedQr, order.id, 'seller_pickup');
    if (sellerValidation.valid) {
      isValid = true;
      qrType = 'seller_pickup';
    } else {
      const courierValidation = qrService.validateQrCode(parsedQr, order.id, 'courier_delivery');
      if (courierValidation.valid) {
        isValid = true;
        qrType = 'courier_delivery';
      } else {
        validationError = courierValidation.error || sellerValidation.error || 'Invalid QR code';
      }
    }

    if (!isValid) {
      res.status(400).json({ success: false, error: validationError || 'Invalid or expired QR code.' });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        qrType,
        order,
      },
    });
  } catch (error) {
    console.error('Verify order QR error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify order QR' });
  }
};

export const getSellerOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Only sellers and admins can access this endpoint.' });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      sellerId: user.id,
    };

    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images', 'price'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
        {
          model: User,
          as: 'courier',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller orders' });
  }
};
