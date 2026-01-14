import { Transaction as SequelizeTransaction } from 'sequelize';
import { sequelize, Transaction, Order, User, Dispute, Product } from '../models';
import { TransactionType, PaymentStatus, OrderStatus, DisputeStatus } from '../types';

interface EscrowResult {
  success: boolean;
  transactions?: Transaction[];
  error?: string;
}

interface DisputeResolutionParams {
  disputeId: string;
  resolution: 'refund_buyer' | 'payout_seller' | 'partial_refund';
  adminId: string;
  adminNote?: string;
  refundPercentage?: number; // For partial refund (0-100)
}

/**
 * Escrow Service - handles all escrow-related operations with database transactions
 * 
 * 4 Main Scenarios:
 * 1. Order Creation → ESCROW_HOLD (buyer's money held)
 * 2. Delivery → ESCROW_RELEASE + SELLER_PAYOUT + COURIER_PAYOUT
 * 3. Cancellation → REFUND (money returned to buyer)
 * 4. Disputes → DISPUTE_REFUND or DISPUTE_PAYOUT based on resolution
 */
class EscrowService {
  
  /**
   * Scenario 1: Create escrow hold when order is created
   * Holds buyer's payment until delivery is confirmed
   */
  async createEscrowHold(
    orderId: string,
    buyerId: string,
    amount: number,
    description?: string
  ): Promise<EscrowResult> {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId, { transaction: dbTransaction });
      if (!order) {
        await dbTransaction.rollback();
        return { success: false, error: 'Order not found' };
      }

      // Create ESCROW_HOLD transaction
      const escrowTransaction = await Transaction.create({
        orderId,
        userId: buyerId,
        type: TransactionType.ESCROW_HOLD,
        amount,
        currency: 'UZS',
        status: PaymentStatus.HELD,
        description: description || `Escrow hold for order ${order.orderNumber}`,
        metadata: {
          buyerId,
          sellerId: order.sellerId,
          sellerAmount: order.sellerAmount,
          courierFee: order.courierFee,
          platformCommission: order.platformCommission,
          createdAt: new Date().toISOString(),
        },
      }, { transaction: dbTransaction });

      await dbTransaction.commit();
      console.log(`[Escrow] Created ESCROW_HOLD for order ${order.orderNumber}, amount: ${amount} UZS`);
      
      return { success: true, transactions: [escrowTransaction] };
    } catch (error) {
      await dbTransaction.rollback();
      console.error('[Escrow] createEscrowHold error:', error);
      return { success: false, error: 'Failed to create escrow hold' };
    }
  }

  /**
   * Scenario 2: Release escrow upon delivery
   * Releases held funds and creates payouts for seller and courier
   */
  async releaseEscrowOnDelivery(orderId: string): Promise<EscrowResult> {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId, { transaction: dbTransaction });
      if (!order) {
        await dbTransaction.rollback();
        return { success: false, error: 'Order not found' };
      }

      // Check if order can have escrow released
      if (order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.IN_TRANSIT) {
        await dbTransaction.rollback();
        return { success: false, error: 'Order must be picked up or in transit to release escrow' };
      }

      // Find the escrow hold transaction
      const escrowHold = await Transaction.findOne({
        where: {
          orderId,
          type: TransactionType.ESCROW_HOLD,
          status: PaymentStatus.HELD,
        },
        transaction: dbTransaction,
      });

      if (!escrowHold) {
        await dbTransaction.rollback();
        return { success: false, error: 'No active escrow hold found for this order' };
      }

      const transactions: Transaction[] = [];

      // 1. Release escrow (mark as completed)
      escrowHold.status = PaymentStatus.COMPLETED;
      escrowHold.description = `Escrow released for delivered order ${order.orderNumber}`;
      await escrowHold.save({ transaction: dbTransaction });
      transactions.push(escrowHold);

      // 2. Create ESCROW_RELEASE transaction for audit
      const releaseTransaction = await Transaction.create({
        orderId,
        userId: order.buyerId,
        type: TransactionType.ESCROW_RELEASE,
        amount: Number(order.totalAmount),
        currency: 'UZS',
        status: PaymentStatus.COMPLETED,
        description: `Escrow released for order ${order.orderNumber}`,
        metadata: {
          releasedAt: new Date().toISOString(),
          reason: 'delivery_confirmed',
        },
      }, { transaction: dbTransaction });
      transactions.push(releaseTransaction);

      // 3. Create SELLER_PAYOUT transaction
      const sellerPayout = await Transaction.create({
        orderId,
        userId: order.sellerId,
        type: TransactionType.SELLER_PAYOUT,
        amount: Number(order.sellerAmount),
        currency: 'UZS',
        status: PaymentStatus.COMPLETED,
        description: `Seller payout for order ${order.orderNumber}`,
        metadata: {
          grossAmount: Number(order.totalAmount) - Number(order.courierFee),
          commission: Number(order.platformCommission),
          netAmount: Number(order.sellerAmount),
        },
      }, { transaction: dbTransaction });
      transactions.push(sellerPayout);

      // 4. Update seller's balance
      const seller = await User.findByPk(order.sellerId, { transaction: dbTransaction });
      if (seller) {
        seller.availableBalance = Number(seller.availableBalance || 0) + Number(order.sellerAmount);
        seller.totalEarnings = Number(seller.totalEarnings || 0) + Number(order.sellerAmount);
        await seller.save({ transaction: dbTransaction });
      }

      // 5. Create COURIER_PAYOUT transaction if courier is assigned
      if (order.courierId) {
        const courierPayout = await Transaction.create({
          orderId,
          userId: order.courierId,
          type: TransactionType.COURIER_PAYOUT,
          amount: Number(order.courierFee),
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Courier fee for order ${order.orderNumber}`,
        }, { transaction: dbTransaction });
        transactions.push(courierPayout);

        // Update courier's balance
        const courier = await User.findByPk(order.courierId, { transaction: dbTransaction });
        if (courier) {
          courier.availableBalance = Number(courier.availableBalance || 0) + Number(order.courierFee);
          courier.totalEarnings = Number(courier.totalEarnings || 0) + Number(order.courierFee);
          await courier.save({ transaction: dbTransaction });
        }
      }

      // 6. Complete platform commission (if held)
      const heldCommission = await Transaction.findOne({
        where: {
          orderId,
          type: TransactionType.PLATFORM_COMMISSION,
          status: PaymentStatus.HELD,
        },
        transaction: dbTransaction,
      });

      if (heldCommission) {
        heldCommission.status = PaymentStatus.COMPLETED;
        heldCommission.description = `Platform commission for order ${order.orderNumber}`;
        await heldCommission.save({ transaction: dbTransaction });
        transactions.push(heldCommission);
      }

      // 7. Update order status
      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();
      order.paymentStatus = PaymentStatus.COMPLETED;
      await order.save({ transaction: dbTransaction });

      await dbTransaction.commit();
      console.log(`[Escrow] Released escrow for order ${order.orderNumber}`);
      
      return { success: true, transactions };
    } catch (error) {
      await dbTransaction.rollback();
      console.error('[Escrow] releaseEscrowOnDelivery error:', error);
      return { success: false, error: 'Failed to release escrow on delivery' };
    }
  }

  /**
   * Scenario 3: Refund escrow on cancellation
   * Returns held funds to buyer
   */
  async refundEscrowOnCancellation(
    orderId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<EscrowResult> {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId, { transaction: dbTransaction });
      if (!order) {
        await dbTransaction.rollback();
        return { success: false, error: 'Order not found' };
      }

      // Check if order can be cancelled
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        await dbTransaction.rollback();
        return { success: false, error: 'Order cannot be cancelled' };
      }

      const transactions: Transaction[] = [];

      // 1. Find and update escrow hold (if exists)
      const escrowHold = await Transaction.findOne({
        where: {
          orderId,
          type: TransactionType.ESCROW_HOLD,
          status: PaymentStatus.HELD,
        },
        transaction: dbTransaction,
      });

      if (escrowHold) {
        escrowHold.status = PaymentStatus.REFUNDED;
        escrowHold.description = `Escrow refunded for cancelled order ${order.orderNumber}`;
        await escrowHold.save({ transaction: dbTransaction });
        transactions.push(escrowHold);
      }

      // 2. Create REFUND transaction
      const refundTransaction = await Transaction.create({
        orderId,
        userId: order.buyerId,
        type: TransactionType.REFUND,
        amount: Number(order.totalAmount),
        currency: 'UZS',
        status: PaymentStatus.COMPLETED,
        description: `Refund for cancelled order ${order.orderNumber}`,
        metadata: {
          cancelledBy,
          reason: reason || 'Order cancelled',
          cancelledAt: new Date().toISOString(),
        },
      }, { transaction: dbTransaction });
      transactions.push(refundTransaction);

      // 3. Handle commission reversal (if commission was held)
      const heldCommission = await Transaction.findOne({
        where: {
          orderId,
          type: TransactionType.PLATFORM_COMMISSION,
          status: PaymentStatus.HELD,
        },
        transaction: dbTransaction,
      });

      if (heldCommission) {
        heldCommission.status = PaymentStatus.REFUNDED;
        heldCommission.description = `Platform commission (reversed) for cancelled order ${order.orderNumber}`;
        await heldCommission.save({ transaction: dbTransaction });

        // Create reversal transaction for audit
        const reversalTransaction = await Transaction.create({
          orderId,
          type: TransactionType.COMMISSION_REVERSAL,
          amount: -Number(order.platformCommission),
          currency: 'UZS',
          status: PaymentStatus.COMPLETED,
          description: `Commission reversal for cancelled order ${order.orderNumber}`,
        }, { transaction: dbTransaction });
        transactions.push(reversalTransaction);
      }

      // 4. Restore product stock
      const product = await Product.findByPk(order.productId, { transaction: dbTransaction });
      if (product) {
        product.stock += order.quantity;
        await product.save({ transaction: dbTransaction });
      }

      // 5. Update order status
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelReason = reason;
      order.paymentStatus = PaymentStatus.REFUNDED;
      await order.save({ transaction: dbTransaction });

      await dbTransaction.commit();
      console.log(`[Escrow] Refunded escrow for cancelled order ${order.orderNumber}`);
      
      return { success: true, transactions };
    } catch (error) {
      await dbTransaction.rollback();
      console.error('[Escrow] refundEscrowOnCancellation error:', error);
      return { success: false, error: 'Failed to refund escrow on cancellation' };
    }
  }

  /**
   * Scenario 4: Handle dispute resolution
   * Admin resolves dispute and escrow is distributed accordingly
   */
  async resolveDispute(params: DisputeResolutionParams): Promise<EscrowResult> {
    const { disputeId, resolution, adminId, adminNote, refundPercentage = 100 } = params;
    const dbTransaction = await sequelize.transaction();
    
    try {
      // Import Dispute model
      const Dispute = (await import('../models/Dispute')).default;
      
      const dispute = await Dispute.findByPk(disputeId, { transaction: dbTransaction });
      if (!dispute) {
        await dbTransaction.rollback();
        return { success: false, error: 'Dispute not found' };
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        await dbTransaction.rollback();
        return { success: false, error: 'Dispute is already resolved or closed' };
      }

      const order = await Order.findByPk(dispute.orderId, { transaction: dbTransaction });
      if (!order) {
        await dbTransaction.rollback();
        return { success: false, error: 'Order not found for dispute' };
      }

      const transactions: Transaction[] = [];

      // Find the escrow hold
      const escrowHold = await Transaction.findOne({
        where: {
          orderId: order.id,
          type: TransactionType.ESCROW_HOLD,
          status: PaymentStatus.HELD,
        },
        transaction: dbTransaction,
      });

      if (!escrowHold) {
        // No held escrow, check if order was already processed
        await dbTransaction.rollback();
        return { success: false, error: 'No active escrow hold found for this disputed order' };
      }

      switch (resolution) {
        case 'refund_buyer': {
          // Full refund to buyer
          escrowHold.status = PaymentStatus.REFUNDED;
          escrowHold.description = `Escrow refunded (dispute resolution) for order ${order.orderNumber}`;
          await escrowHold.save({ transaction: dbTransaction });

          // Create DISPUTE_REFUND transaction
          const disputeRefund = await Transaction.create({
            orderId: order.id,
            userId: order.buyerId,
            type: TransactionType.DISPUTE_REFUND,
            amount: Number(order.totalAmount),
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Dispute refund for order ${order.orderNumber}`,
            metadata: {
              disputeId,
              resolution: 'refund_buyer',
              adminId,
              adminNote,
              resolvedAt: new Date().toISOString(),
            },
          }, { transaction: dbTransaction });
          transactions.push(disputeRefund);

          // Reverse held commission
          await this.reverseHeldCommission(order, dbTransaction, transactions);

          // Restore product stock
          const product = await Product.findByPk(order.productId, { transaction: dbTransaction });
          if (product) {
            product.stock += order.quantity;
            await product.save({ transaction: dbTransaction });
          }

          // Update order status
          order.paymentStatus = PaymentStatus.REFUNDED;
          await order.save({ transaction: dbTransaction });
          break;
        }

        case 'payout_seller': {
          // Full payout to seller (and courier if assigned)
          escrowHold.status = PaymentStatus.COMPLETED;
          escrowHold.description = `Escrow released (dispute resolution) for order ${order.orderNumber}`;
          await escrowHold.save({ transaction: dbTransaction });

          // Create DISPUTE_PAYOUT to seller
          const sellerPayout = await Transaction.create({
            orderId: order.id,
            userId: order.sellerId,
            type: TransactionType.DISPUTE_PAYOUT,
            amount: Number(order.sellerAmount),
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Dispute payout (seller) for order ${order.orderNumber}`,
            metadata: {
              disputeId,
              resolution: 'payout_seller',
              adminId,
              adminNote,
              resolvedAt: new Date().toISOString(),
            },
          }, { transaction: dbTransaction });
          transactions.push(sellerPayout);

          // Update seller balance
          const seller = await User.findByPk(order.sellerId, { transaction: dbTransaction });
          if (seller) {
            seller.availableBalance = Number(seller.availableBalance || 0) + Number(order.sellerAmount);
            seller.totalEarnings = Number(seller.totalEarnings || 0) + Number(order.sellerAmount);
            await seller.save({ transaction: dbTransaction });
          }

          // Payout to courier if assigned
          if (order.courierId) {
            const courierPayout = await Transaction.create({
              orderId: order.id,
              userId: order.courierId,
              type: TransactionType.DISPUTE_PAYOUT,
              amount: Number(order.courierFee),
              currency: 'UZS',
              status: PaymentStatus.COMPLETED,
              description: `Dispute payout (courier) for order ${order.orderNumber}`,
              metadata: {
                disputeId,
                resolution: 'payout_seller',
                adminId,
              },
            }, { transaction: dbTransaction });
            transactions.push(courierPayout);

            const courier = await User.findByPk(order.courierId, { transaction: dbTransaction });
            if (courier) {
              courier.availableBalance = Number(courier.availableBalance || 0) + Number(order.courierFee);
              courier.totalEarnings = Number(courier.totalEarnings || 0) + Number(order.courierFee);
              await courier.save({ transaction: dbTransaction });
            }
          }

          // Complete held commission
          await this.completeHeldCommission(order, dbTransaction, transactions);

          // Update order status
          order.paymentStatus = PaymentStatus.COMPLETED;
          await order.save({ transaction: dbTransaction });
          break;
        }

        case 'partial_refund': {
          // Partial refund to buyer, rest to seller
          const refundAmount = Math.round(Number(order.totalAmount) * (refundPercentage / 100));
          const sellerPartialAmount = Number(order.totalAmount) - refundAmount - Number(order.courierFee) - Number(order.platformCommission);

          escrowHold.status = PaymentStatus.COMPLETED;
          escrowHold.description = `Escrow partially released (dispute resolution) for order ${order.orderNumber}`;
          await escrowHold.save({ transaction: dbTransaction });

          // Partial refund to buyer
          const disputeRefund = await Transaction.create({
            orderId: order.id,
            userId: order.buyerId,
            type: TransactionType.DISPUTE_REFUND,
            amount: refundAmount,
            currency: 'UZS',
            status: PaymentStatus.COMPLETED,
            description: `Partial dispute refund (${refundPercentage}%) for order ${order.orderNumber}`,
            metadata: {
              disputeId,
              resolution: 'partial_refund',
              refundPercentage,
              adminId,
              adminNote,
              resolvedAt: new Date().toISOString(),
            },
          }, { transaction: dbTransaction });
          transactions.push(disputeRefund);

          // Partial payout to seller (if any remaining)
          if (sellerPartialAmount > 0) {
            const sellerPayout = await Transaction.create({
              orderId: order.id,
              userId: order.sellerId,
              type: TransactionType.DISPUTE_PAYOUT,
              amount: sellerPartialAmount,
              currency: 'UZS',
              status: PaymentStatus.COMPLETED,
              description: `Partial dispute payout (seller) for order ${order.orderNumber}`,
              metadata: {
                disputeId,
                resolution: 'partial_refund',
                refundPercentage,
                adminId,
              },
            }, { transaction: dbTransaction });
            transactions.push(sellerPayout);

            const seller = await User.findByPk(order.sellerId, { transaction: dbTransaction });
            if (seller) {
              seller.availableBalance = Number(seller.availableBalance || 0) + sellerPartialAmount;
              seller.totalEarnings = Number(seller.totalEarnings || 0) + sellerPartialAmount;
              await seller.save({ transaction: dbTransaction });
            }
          }

          // Handle platform commission proportionally
          const commissionToKeep = Math.round(Number(order.platformCommission) * ((100 - refundPercentage) / 100));
          if (commissionToKeep > 0) {
            await this.completeHeldCommission(order, dbTransaction, transactions, commissionToKeep);
          } else {
            await this.reverseHeldCommission(order, dbTransaction, transactions);
          }

          // Update order status
          order.paymentStatus = PaymentStatus.COMPLETED;
          await order.save({ transaction: dbTransaction });
          break;
        }
      }

      // Update dispute status
      dispute.status = DisputeStatus.RESOLVED;
      dispute.resolution = adminNote || `Resolved: ${resolution}`;
      dispute.resolvedAt = new Date();
      dispute.assignedAdminId = adminId;
      await dispute.save({ transaction: dbTransaction });

      // Update order to reflect dispute resolution
      order.status = OrderStatus.CANCELLED; // Mark as cancelled since it's disputed
      await order.save({ transaction: dbTransaction });

      await dbTransaction.commit();
      console.log(`[Escrow] Resolved dispute ${disputeId} with resolution: ${resolution}`);
      
      return { success: true, transactions };
    } catch (error) {
      await dbTransaction.rollback();
      console.error('[Escrow] resolveDispute error:', error);
      return { success: false, error: 'Failed to resolve dispute' };
    }
  }

  /**
   * Helper: Reverse held commission
   */
  private async reverseHeldCommission(
    order: Order,
    dbTransaction: SequelizeTransaction,
    transactions: Transaction[]
  ): Promise<void> {
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
      heldCommission.description = `Platform commission (reversed) for order ${order.orderNumber}`;
      await heldCommission.save({ transaction: dbTransaction });

      const reversalTransaction = await Transaction.create({
        orderId: order.id,
        type: TransactionType.COMMISSION_REVERSAL,
        amount: -Number(order.platformCommission),
        currency: 'UZS',
        status: PaymentStatus.COMPLETED,
        description: `Commission reversal for order ${order.orderNumber}`,
      }, { transaction: dbTransaction });
      transactions.push(reversalTransaction);
    }
  }

  /**
   * Helper: Complete held commission
   */
  private async completeHeldCommission(
    order: Order,
    dbTransaction: SequelizeTransaction,
    transactions: Transaction[],
    customAmount?: number
  ): Promise<void> {
    const heldCommission = await Transaction.findOne({
      where: {
        orderId: order.id,
        type: TransactionType.PLATFORM_COMMISSION,
        status: PaymentStatus.HELD,
      },
      transaction: dbTransaction,
    });

    if (heldCommission) {
      if (customAmount !== undefined) {
        heldCommission.amount = customAmount;
      }
      heldCommission.status = PaymentStatus.COMPLETED;
      heldCommission.description = `Platform commission for order ${order.orderNumber}`;
      await heldCommission.save({ transaction: dbTransaction });
      transactions.push(heldCommission);
    }
  }

  /**
   * Get escrow status for an order
   */
  async getEscrowStatus(orderId: string): Promise<{
    hasEscrow: boolean;
    status?: PaymentStatus;
    amount?: number;
    transactions: Transaction[];
  }> {
    try {
      const transactions = await Transaction.findAll({
        where: { orderId },
        order: [['createdAt', 'ASC']],
      });

      const escrowHold = transactions.find(t => t.type === TransactionType.ESCROW_HOLD);

      return {
        hasEscrow: !!escrowHold,
        status: escrowHold?.status,
        amount: escrowHold ? Number(escrowHold.amount) : undefined,
        transactions,
      };
    } catch (error) {
      console.error('[Escrow] getEscrowStatus error:', error);
      return { hasEscrow: false, transactions: [] };
    }
  }

  /**
   * Validate balance before withdrawal
   */
  async validateBalanceForWithdrawal(userId: string, amount: number): Promise<{
    valid: boolean;
    availableBalance: number;
    error?: string;
  }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return { valid: false, availableBalance: 0, error: 'User not found' };
      }

      const availableBalance = Number(user.availableBalance || 0);
      
      if (amount <= 0) {
        return { valid: false, availableBalance, error: 'Invalid withdrawal amount' };
      }

      if (amount > availableBalance) {
        return { 
          valid: false, 
          availableBalance, 
          error: `Insufficient balance. Available: ${availableBalance} UZS` 
        };
      }

      const minWithdrawal = 50000;
      if (amount < minWithdrawal) {
        return { 
          valid: false, 
          availableBalance, 
          error: `Minimum withdrawal amount is ${minWithdrawal} UZS` 
        };
      }

      return { valid: true, availableBalance };
    } catch (error) {
      console.error('[Escrow] validateBalanceForWithdrawal error:', error);
      return { valid: false, availableBalance: 0, error: 'Validation failed' };
    }
  }
}

export default new EscrowService();
