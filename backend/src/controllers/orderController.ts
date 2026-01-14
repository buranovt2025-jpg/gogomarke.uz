import { Response } from 'express';
import { Order, Product, User, Transaction, Video, sequelize } from '../models';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus, PaymentStatus, TransactionType, UserRole } from '../types';
import { config } from '../config';
import qrService from '../services/qrService';
import smsService from '../services/smsService';
import notificationService from '../services/notificationService';
import escrowService from '../services/escrowService';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const user = req.currentUser;
    if (!user) {
      await dbTransaction.rollback();
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

    const product = await Product.findByPk(productId, { transaction: dbTransaction });
    if (!product || !product.isActive) {
      await dbTransaction.rollback();
      res.status(404).json({
        success: false,
        error: 'Product not found or unavailable.',
      });
      return;
    }

    if (product.stock < quantity) {
      await dbTransaction.rollback();
      res.status(400).json({
        success: false,
        error: 'Insufficient stock.',
      });
      return;
    }

    const unitPrice = Number(product.price);
    const totalAmount = unitPrice * quantity;
    const courierFee = config.courierFeeDefault;
    const platformCommission = totalAmount * config.platformCommission;
    const sellerAmount = totalAmount - platformCommission;

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
      totalAmount: totalAmount + courierFee,
      courierFee,
      platformCommission,
      sellerAmount,
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
    }, { transaction: dbTransaction });

    const { qrCode: updatedSellerQr } = await qrService.generateSellerQr(order.id);
    order.sellerQrCode = updatedSellerQr;
    await order.save({ transaction: dbTransaction });

    product.stock -= quantity;
    await product.save({ transaction: dbTransaction });

    // Create PAYMENT transaction (buyer's payment)
    await Transaction.create({
      orderId: order.id,
      userId: user.id,
      type: TransactionType.PAYMENT,
      amount: totalAmount + courierFee,
      currency: 'UZS',
      status: PaymentStatus.PENDING,
      description: `Payment for order ${order.orderNumber}`,
    }, { transaction: dbTransaction });

    // Create ESCROW_HOLD transaction (buyer's money held in escrow)
    await Transaction.create({
      orderId: order.id,
      userId: user.id,
      type: TransactionType.ESCROW_HOLD,
      amount: totalAmount + courierFee,
      currency: 'UZS',
      status: PaymentStatus.HELD,
      description: `Escrow hold for order ${order.orderNumber}`,
      metadata: {
        buyerId: user.id,
        sellerId: product.sellerId,
        sellerAmount,
        courierFee,
        platformCommission,
        createdAt: new Date().toISOString(),
      },
    }, { transaction: dbTransaction });

    // Create PLATFORM_COMMISSION transaction with HELD status (two-phase model)
    // Commission is recorded immediately but only completed upon delivery
    await Transaction.create({
      orderId: order.id,
      type: TransactionType.PLATFORM_COMMISSION,
      amount: platformCommission,
      currency: 'UZS',
      status: PaymentStatus.HELD,
      description: `Platform commission (held) for order ${order.orderNumber}`,
    }, { transaction: dbTransaction });

    await dbTransaction.commit();

    // Notify seller about new order (outside transaction)
    const productForNotify = await Product.findByPk(productId);
    if (productForNotify) {
      await notificationService.notifyNewOrder(product.sellerId, order.orderNumber, productForNotify.title);
    }

    console.log(`[Order] Created order ${orderNumber} with ESCROW_HOLD for ${totalAmount + courierFee} UZS`);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    await dbTransaction.rollback();
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

    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({
        success: false,
        error: 'Order cannot be confirmed in current status.',
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

    if (order.status !== OrderStatus.CONFIRMED) {
      res.status(400).json({
        success: false,
        error: 'Order must be confirmed before handover.',
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
    if (!parsedQr || !qrService.validateQrCode(parsedQr, order.id, 'seller_pickup')) {
      res.status(400).json({
        success: false,
        error: 'Invalid QR code.',
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

    if (order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.IN_TRANSIT) {
      res.status(400).json({
        success: false,
        error: 'Order must be picked up before delivery.',
      });
      return;
    }

    let isValid = false;

    if (qrData) {
      const parsedQr = qrService.parseQrCode(qrData);
      isValid = !!parsedQr && qrService.validateQrCode(parsedQr, order.id, 'courier_delivery');
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

    // Use escrow service to release escrow and create payouts (atomic transaction)
    const escrowResult = await escrowService.releaseEscrowOnDelivery(order.id);
    
    if (!escrowResult.success) {
      // Fallback to legacy approach if escrow service fails
      console.warn(`[Order] Escrow service failed for order ${order.id}, using fallback: ${escrowResult.error}`);
      
      const dbTransaction = await sequelize.transaction();
      try {
        order.status = OrderStatus.DELIVERED;
        order.deliveredAt = new Date();
        order.paymentStatus = PaymentStatus.COMPLETED;
        await order.save({ transaction: dbTransaction });

        // Create seller payout transaction
        await Transaction.create({
          orderId: order.id,
          userId: order.sellerId,
          type: TransactionType.SELLER_PAYOUT,
          amount: Number(order.sellerAmount),
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Seller payout for order ${order.orderNumber}`,
        }, { transaction: dbTransaction });

        // Update seller's available balance
        const seller = await User.findByPk(order.sellerId, { transaction: dbTransaction });
        if (seller) {
          seller.availableBalance = Number(seller.availableBalance || 0) + Number(order.sellerAmount);
          seller.totalEarnings = Number(seller.totalEarnings || 0) + Number(order.sellerAmount);
          await seller.save({ transaction: dbTransaction });
        }

        // Create courier payout transaction
        if (order.courierId) {
          await Transaction.create({
            orderId: order.id,
            userId: order.courierId,
            type: TransactionType.COURIER_PAYOUT,
            amount: Number(order.courierFee),
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Courier fee for order ${order.orderNumber}`,
          }, { transaction: dbTransaction });

          const courier = await User.findByPk(order.courierId, { transaction: dbTransaction });
          if (courier) {
            courier.availableBalance = Number(courier.availableBalance || 0) + Number(order.courierFee);
            courier.totalEarnings = Number(courier.totalEarnings || 0) + Number(order.courierFee);
            await courier.save({ transaction: dbTransaction });
          }
        }

        // Update HELD commission to COMPLETED
        const heldCommission = await Transaction.findOne({
          where: {
            orderId: order.id,
            type: TransactionType.PLATFORM_COMMISSION,
            status: PaymentStatus.HELD,
          },
          transaction: dbTransaction,
        });

        if (heldCommission) {
          heldCommission.status = PaymentStatus.COMPLETED;
          heldCommission.description = `Platform commission for order ${order.orderNumber}`;
          await heldCommission.save({ transaction: dbTransaction });
        }

        await dbTransaction.commit();
      } catch (fallbackError) {
        await dbTransaction.rollback();
        throw fallbackError;
      }
    }

    // Reload order to get updated status
    await order.reload();

    // Notify buyer and seller about delivery (outside transaction)
    await notificationService.notifyOrderDelivered(order.buyerId, order.sellerId, order.orderNumber);

    console.log(`[Order] Delivery confirmed for order ${order.orderNumber} - escrow released`);

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

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
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

    if (
      order.buyerId !== user.id &&
      order.sellerId !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
      return;
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled.',
      });
      return;
    }

    // Use escrow service to refund escrow (atomic transaction)
    const escrowResult = await escrowService.refundEscrowOnCancellation(order.id, user.id, reason);
    
    if (!escrowResult.success) {
      // Fallback to legacy approach if escrow service fails
      console.warn(`[Order] Escrow refund failed for order ${order.id}, using fallback: ${escrowResult.error}`);
      
      const dbTransaction = await sequelize.transaction();
      try {
        const product = await Product.findByPk(order.productId, { transaction: dbTransaction });
        if (product) {
          product.stock += order.quantity;
          await product.save({ transaction: dbTransaction });
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        order.cancelReason = reason;
        order.paymentStatus = PaymentStatus.REFUNDED;
        await order.save({ transaction: dbTransaction });

        // Create refund transaction for buyer
        await Transaction.create({
          orderId: order.id,
          userId: order.buyerId,
          type: TransactionType.REFUND,
          amount: Number(order.totalAmount),
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Refund for cancelled order ${order.orderNumber}`,
        }, { transaction: dbTransaction });

        // Handle commission reversal (two-phase model)
        const heldCommission = await Transaction.findOne({
          where: {
            orderId: order.id,
            type: TransactionType.PLATFORM_COMMISSION,
            status: PaymentStatus.HELD,
          },
          transaction: dbTransaction,
        });

        if (heldCommission) {
          heldCommission.status = PaymentStatus.REFUNDED;
          heldCommission.description = `Platform commission (reversed) for cancelled order ${order.orderNumber}`;
          await heldCommission.save({ transaction: dbTransaction });

          await Transaction.create({
            orderId: order.id,
            type: TransactionType.COMMISSION_REVERSAL,
            amount: -Number(order.platformCommission),
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Commission reversal for cancelled order ${order.orderNumber}`,
          }, { transaction: dbTransaction });
        }

        await dbTransaction.commit();
      } catch (fallbackError) {
        await dbTransaction.rollback();
        throw fallbackError;
      }
    }

    // Reload order to get updated status
    await order.reload();

    console.log(`[Order] Order ${order.orderNumber} cancelled by user ${user.id} - escrow refunded`);

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

    order.status = status;
    await order.save();

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

    if (qrService.validateQrCode(parsedQr, order.id, 'seller_pickup')) {
      isValid = true;
      qrType = 'seller_pickup';
    } else if (qrService.validateQrCode(parsedQr, order.id, 'courier_delivery')) {
      isValid = true;
      qrType = 'courier_delivery';
    }

    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid or expired QR code.' });
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
