import { Response } from 'express';
import { User, Transaction, Withdrawal, sequelize } from '../models';
import { AuthRequest } from '../middleware/auth';
import { PaymentStatus, TransactionType, UserRole, WithdrawalStatus } from '../types';
import escrowService from '../services/escrowService';

/**
 * Get user's withdrawal history
 */
export const getWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.COURIER)) {
      res.status(403).json({ success: false, error: 'Seller or courier access required.' });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const { count, rows: withdrawals } = await Withdrawal.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Failed to get withdrawals' });
  }
};

/**
 * Request a new withdrawal
 */
export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const user = req.currentUser;
    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.COURIER)) {
      await dbTransaction.rollback();
      res.status(403).json({ success: false, error: 'Seller or courier access required.' });
      return;
    }

    const { amount, method, accountDetails } = req.body;

    // Validate withdrawal amount
    const validation = await escrowService.validateBalanceForWithdrawal(user.id, amount);
    if (!validation.valid) {
      await dbTransaction.rollback();
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      userId: user.id,
      amount,
      currency: 'UZS',
      status: WithdrawalStatus.PENDING,
      method: method || 'card',
      accountDetails: accountDetails || {},
    }, { transaction: dbTransaction });

    // Create transaction record
    const withdrawalTransaction = await Transaction.create({
      orderId: '00000000-0000-0000-0000-000000000000', // Placeholder for non-order transactions
      userId: user.id,
      type: TransactionType.WITHDRAWAL_REQUEST,
      amount,
      currency: 'UZS',
      status: PaymentStatus.PENDING,
      description: `Withdrawal request via ${method || 'card'}`,
      metadata: {
        withdrawalId: withdrawal.id,
        method: method || 'card',
        accountDetails: accountDetails || {},
        requestedAt: new Date().toISOString(),
      },
    }, { transaction: dbTransaction });

    // Link transaction to withdrawal
    withdrawal.transactionId = withdrawalTransaction.id;
    await withdrawal.save({ transaction: dbTransaction });

    // Update user balance (move from available to pending)
    const userData = await User.findByPk(user.id, { transaction: dbTransaction });
    if (userData) {
      userData.availableBalance = Number(userData.availableBalance) - amount;
      userData.pendingBalance = Number(userData.pendingBalance || 0) + amount;
      await userData.save({ transaction: dbTransaction });
    }

    await dbTransaction.commit();

    console.log(`[Withdrawal] User ${user.id} requested withdrawal of ${amount} UZS`);

    res.status(201).json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal request submitted successfully. Awaiting admin approval.',
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error('Request withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to request withdrawal' });
  }
};

/**
 * Get withdrawal by ID
 */
export const getWithdrawalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    const withdrawal = await Withdrawal.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'phone', 'firstName', 'lastName', 'role'] },
        { model: User, as: 'admin', attributes: ['id', 'firstName', 'lastName'] },
        { model: Transaction, as: 'transaction' },
      ],
    });

    if (!withdrawal) {
      res.status(404).json({ success: false, error: 'Withdrawal not found.' });
      return;
    }

    if (withdrawal.userId !== user?.id && user?.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to get withdrawal' });
  }
};

/**
 * Get user's balance info
 */
export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const userData = await User.findByPk(user.id, {
      attributes: ['id', 'availableBalance', 'pendingBalance', 'totalEarnings'],
    });

    if (!userData) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        availableBalance: Number(userData.availableBalance || 0),
        pendingBalance: Number(userData.pendingBalance || 0),
        totalEarnings: Number(userData.totalEarnings || 0),
      },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get balance' });
  }
};

// ================= ADMIN ENDPOINTS =================

/**
 * Admin: Get all withdrawal requests
 */
export const adminGetWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Admin access required.' });
      return;
    }

    const { page = 1, limit = 20, status, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }

    const { count, rows: withdrawals } = await Withdrawal.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'phone', 'firstName', 'lastName', 'role', 'availableBalance', 'pendingBalance'] 
        },
        { model: User, as: 'admin', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Calculate summary
    const summary = await Withdrawal.findAll({
      where: { status: WithdrawalStatus.PENDING },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'pendingCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'pendingTotal'],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        withdrawals,
        summary: summary[0] || { pendingCount: 0, pendingTotal: 0 },
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin get withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Failed to get withdrawals' });
  }
};

/**
 * Admin: Approve withdrawal request
 */
export const adminApproveWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const admin = req.currentUser;
    if (!admin || admin.role !== UserRole.ADMIN) {
      await dbTransaction.rollback();
      res.status(403).json({ success: false, error: 'Admin access required.' });
      return;
    }

    const { id } = req.params;
    const { adminNote, paymentReference } = req.body;

    const withdrawal = await Withdrawal.findByPk(id, { transaction: dbTransaction });
    if (!withdrawal) {
      await dbTransaction.rollback();
      res.status(404).json({ success: false, error: 'Withdrawal not found.' });
      return;
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      await dbTransaction.rollback();
      res.status(400).json({ 
        success: false, 
        error: `Withdrawal is already ${withdrawal.status}. Cannot approve.` 
      });
      return;
    }

    // Update withdrawal status
    withdrawal.status = WithdrawalStatus.APPROVED;
    withdrawal.adminId = admin.id;
    withdrawal.adminNote = adminNote;
    withdrawal.processedAt = new Date();
    await withdrawal.save({ transaction: dbTransaction });

    // Update related transaction
    if (withdrawal.transactionId) {
      const transaction = await Transaction.findByPk(withdrawal.transactionId, { transaction: dbTransaction });
      if (transaction) {
        transaction.status = PaymentStatus.COMPLETED;
        transaction.description = `Withdrawal approved - ${paymentReference || 'Processed'}`;
        transaction.metadata = {
          ...(transaction.metadata as Record<string, unknown> || {}),
          approvedBy: admin.id,
          approvedAt: new Date().toISOString(),
          paymentReference,
        };
        await transaction.save({ transaction: dbTransaction });
      }
    }

    // Update user balance (remove from pending, don't add back to available)
    const user = await User.findByPk(withdrawal.userId, { transaction: dbTransaction });
    if (user) {
      user.pendingBalance = Math.max(0, Number(user.pendingBalance) - Number(withdrawal.amount));
      await user.save({ transaction: dbTransaction });
    }

    await dbTransaction.commit();

    console.log(`[Withdrawal] Admin ${admin.id} approved withdrawal ${id} for user ${withdrawal.userId}`);

    res.json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal approved successfully.',
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error('Admin approve withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve withdrawal' });
  }
};

/**
 * Admin: Reject withdrawal request
 */
export const adminRejectWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const admin = req.currentUser;
    if (!admin || admin.role !== UserRole.ADMIN) {
      await dbTransaction.rollback();
      res.status(403).json({ success: false, error: 'Admin access required.' });
      return;
    }

    const { id } = req.params;
    const { adminNote, reason } = req.body;

    if (!reason && !adminNote) {
      await dbTransaction.rollback();
      res.status(400).json({ success: false, error: 'Rejection reason is required.' });
      return;
    }

    const withdrawal = await Withdrawal.findByPk(id, { transaction: dbTransaction });
    if (!withdrawal) {
      await dbTransaction.rollback();
      res.status(404).json({ success: false, error: 'Withdrawal not found.' });
      return;
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      await dbTransaction.rollback();
      res.status(400).json({ 
        success: false, 
        error: `Withdrawal is already ${withdrawal.status}. Cannot reject.` 
      });
      return;
    }

    // Update withdrawal status
    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.adminId = admin.id;
    withdrawal.adminNote = adminNote || reason;
    withdrawal.processedAt = new Date();
    await withdrawal.save({ transaction: dbTransaction });

    // Update related transaction
    if (withdrawal.transactionId) {
      const transaction = await Transaction.findByPk(withdrawal.transactionId, { transaction: dbTransaction });
      if (transaction) {
        transaction.status = PaymentStatus.CANCELLED;
        transaction.description = `Withdrawal rejected: ${reason || adminNote}`;
        transaction.metadata = {
          ...(transaction.metadata as Record<string, unknown> || {}),
          rejectedBy: admin.id,
          rejectedAt: new Date().toISOString(),
          reason: reason || adminNote,
        };
        await transaction.save({ transaction: dbTransaction });
      }
    }

    // Refund user balance (move from pending back to available)
    const user = await User.findByPk(withdrawal.userId, { transaction: dbTransaction });
    if (user) {
      user.pendingBalance = Math.max(0, Number(user.pendingBalance) - Number(withdrawal.amount));
      user.availableBalance = Number(user.availableBalance) + Number(withdrawal.amount);
      await user.save({ transaction: dbTransaction });
    }

    await dbTransaction.commit();

    console.log(`[Withdrawal] Admin ${admin.id} rejected withdrawal ${id} for user ${withdrawal.userId}`);

    res.json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal rejected. Funds returned to user balance.',
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error('Admin reject withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject withdrawal' });
  }
};
